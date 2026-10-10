"use client";

import { useRouter } from "@/src/i18n/navigation";
import { routing } from "@/src/i18n/routing";
import { createClient, RowChangePayload } from "@/src/lib/supabase/client";
import { DiagramRow } from "@/src/types/data/DiagramRow";
import { DiagramDTO, EdgeDTO, NodeDTO } from "@/src/types/model/DiagramData";
import {
  NodeRelationEdge,
  TableNodeData,
} from "@/src/types/model/ExtendedNodeEdge";
import {
  toEdgeDTO,
  toNodeDTO,
  toNodeRelationEdge,
  toTableNodeData,
} from "@/src/utils/client";
import {
  isUuid,
  toDiagramDTO as toDiagramDTOFromRow,
} from "@/src/utils/server";
import { useParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

//#region Store types
// Edits are sent to other clients immediately (Broadcast) and saved to the DB after this idle time,
// or at the latest PERSIST_MAX_WAIT_MS after the first unsaved edit (so nonstop editing still saves)
const PERSIST_DEBOUNCE_MS = 3000;
const PERSIST_MAX_WAIT_MS = 30000;
const LIVE_THROTTLE_MS = 80;
const RETRY_DELAY_MS = 5000;

// Diagram fields that are persisted and synced in realtime.
// Only the fields that actually changed are sent (the server enforces who may change what).
const DIAGRAM_SYNC_FIELDS = [
  "title",
  "isPrivate",
  "providerName",
  "shares",
] as const;
type DiagramSyncField = (typeof DIAGRAM_SYNC_FIELDS)[number];
type DiagramSyncPatch = Partial<Pick<DiagramDTO, DiagramSyncField>>;

class HttpError extends Error {
  status: number;
  constructor(status: number) {
    super(`HTTP ${status}`);
    this.status = status;
  }
}

interface PendingChanges {
  nodes: Set<string>;
  edges: Set<string>;
  deletedNodes: Set<string>;
  deletedEdges: Set<string>;
  // Names of diagram fields edited locally and not yet saved
  diagram: Set<DiagramSyncField>;
}

// What is sent to other clients while editing (flow ids, not DB ids)
export interface LivePayload {
  nodes: NodeDTO[];
  edges: EdgeDTO[];
  deleteNodeIds: string[];
  deleteEdgeIds: string[];
  diagram: DiagramSyncPatch | null;
}

export interface PendingSnapshot {
  upsertNodes: TableNodeData[];
  upsertEdges: NodeRelationEdge[];
  deleteNodeIds: string[];
  deleteEdgeIds: string[];
  diagram: DiagramSyncPatch | null;
}

interface DrawingState {
  isFirstLoaded: boolean;
  loading: boolean;
  syncing: boolean;
  info: DiagramDTO | null;
  nodes: TableNodeData[];
  edges: NodeRelationEdge[];
  error?: string | any;
  locale: string;

  // Local changes not yet persisted. Mutated in place; `dirtyVersion` is the change signal.
  pending: PendingChanges;
  dirtyVersion: number;

  // Local changes not yet broadcast to other clients (includes position while dragging)
  live: PendingChanges;
  liveVersion: number;

  reset: () => void;

  fetchDiagramData: (diagramId: string, isFirstLoad?: boolean) => Promise<void>;
  fetchNodeAndEdgeData: (diagramId: string) => Promise<void>;

  // Local updates (from the flow): tracked as pending changes
  updateDiagramData: (diagram: DiagramDTO) => Promise<void>;
  updateNodeData: (nodes: TableNodeData[]) => Promise<void>;
  updateEdgeData: (edges: NodeRelationEdge[]) => Promise<void>;

  // Remote updates (from Supabase Realtime): never marked as pending, otherwise they'd be echoed back
  syncDiagram: (diagram: DiagramDTO) => void;
  syncNode: (node: TableNodeData, isDelete: boolean) => void;
  syncEdge: (edge: NodeRelationEdge, isDelete: boolean) => void;

  hasPending: () => boolean;
  takePending: () => PendingSnapshot;
  takeLive: () => LivePayload;
  restorePending: (snapshot: PendingSnapshot) => void;
}
//#endregion

//#region Helpers
const createPending = (): PendingChanges => ({
  nodes: new Set(),
  edges: new Set(),
  deletedNodes: new Set(),
  deletedEdges: new Set(),
  diagram: new Set(),
});

const jsonEqual = (a: unknown, b: unknown) =>
  a === b || JSON.stringify(a) === JSON.stringify(b);

// Compared by value: `shares` is an array and may be a new reference with the same content
const changedSyncFields = (a: DiagramDTO, b: DiagramDTO): DiagramSyncField[] =>
  DIAGRAM_SYNC_FIELDS.filter((f) => !jsonEqual(a[f], b[f]));

const pickSyncFields = (
  d: DiagramDTO,
  fields: Iterable<DiagramSyncField>,
): DiagramSyncPatch =>
  Object.fromEntries([...fields].map((f) => [f, d[f]])) as DiagramSyncPatch;

// What counts as a persistable node change.
// Add fields here if your NodeDTO also stores width/height, etc.
const nodeChanged = (a: TableNodeData, b: TableNodeData) =>
  a.data !== b.data ||
  a.type !== b.type ||
  // While dragging, ignore position; persist once when the drag ends
  (!b.dragging &&
    (a.position.x !== b.position.x ||
      a.position.y !== b.position.y ||
      !!a.dragging));

// For live broadcast, position counts even while dragging
const nodeLiveChanged = (a: TableNodeData, b: TableNodeData) =>
  a.data !== b.data ||
  a.type !== b.type ||
  a.position.x !== b.position.x ||
  a.position.y !== b.position.y;

const edgeChanged = (a: NodeRelationEdge, b: NodeRelationEdge) =>
  a.source !== b.source ||
  a.target !== b.target ||
  a.sourceHandle !== b.sourceHandle ||
  a.targetHandle !== b.targetHandle ||
  a.type !== b.type ||
  a.data !== b.data;

const nodeEqual = (a: TableNodeData, b: TableNodeData) =>
  a.type === b.type &&
  a.position.x === b.position.x &&
  a.position.y === b.position.y &&
  jsonEqual(a.data, b.data);

const edgeEqual = (a: NodeRelationEdge, b: NodeRelationEdge) =>
  a.source === b.source &&
  a.target === b.target &&
  a.sourceHandle === b.sourceHandle &&
  a.targetHandle === b.targetHandle &&
  a.type === b.type &&
  jsonEqual(a.data, b.data);

// Compare prev/next lists by id and record what must be persisted.
// Returns true if anything was recorded.
function trackChanges<T extends { id: string }>(
  prev: T[],
  next: T[],
  changed: (a: T, b: T) => boolean,
  dirty: Set<string>,
  deleted: Set<string>,
): boolean {
  const prevMap = new Map(prev.map((x) => [x.id, x]));
  const nextIds = new Set<string>();
  let touched = false;

  for (const item of next) {
    nextIds.add(item.id);
    const old = prevMap.get(item.id);
    if (!old || changed(old, item)) {
      dirty.add(item.id);
      deleted.delete(item.id);
      touched = true;
    }
  }
  for (const old of prev) {
    if (!nextIds.has(old.id)) {
      dirty.delete(old.id);
      deleted.add(old.id);
      touched = true;
    }
  }
  return touched;
}
//#endregion

//#region Store
const initialData = {
  isFirstLoaded: false,
  loading: false,
  syncing: false,
  info: null as DiagramDTO | null,
  nodes: [] as TableNodeData[],
  edges: [] as NodeRelationEdge[],
  error: null as string | any,
};

export const useDrawingStore = create<DrawingState>((set, get) => ({
  ...initialData,
  locale: routing.defaultLocale,
  pending: createPending(),
  dirtyVersion: 0,
  live: createPending(),
  liveVersion: 0,

  // Keeps `locale` and the monotonic versions untouched
  reset: () =>
    set({ ...initialData, pending: createPending(), live: createPending() }),

  //#region Fetch data from API
  fetchDiagramData: async (diagramId, isFirstLoad) => {
    set(
      isFirstLoad
        ? { isFirstLoaded: true, loading: true, error: null }
        : { isFirstLoaded: false, loading: true, error: null },
    );
    const fail = (error: any) => {
      console.error(error);
      set(
        isFirstLoad
          ? { isFirstLoaded: true, loading: false, error }
          : { loading: false, error },
      );
    };
    try {
      const res = await fetch(`/api/data/diagram/${diagramId}/getDiagramInfo`, {
        headers: { "accept-language": get().locale },
      });
      const {
        success,
        diagramInfo,
        error,
      }: { success?: boolean; diagramInfo?: DiagramDTO; error: string } =
        await res.json();
      if (success && diagramInfo) {
        set(
          isFirstLoad
            ? { isFirstLoaded: true, loading: false, info: diagramInfo }
            : { loading: false, info: diagramInfo },
        );
      } else {
        fail(error);
      }
    } catch (err) {
      fail(err);
    }
  },

  fetchNodeAndEdgeData: async (diagramId) => {
    set({ syncing: true, error: null });
    try {
      const res = await fetch(
        `/api/data/diagram/${diagramId}/getDiagramNodesAndEdges`,
        { headers: { "accept-language": get().locale }, method: "GET" },
      );
      const {
        success,
        nodes,
        edges,
        error,
      }: {
        success?: boolean;
        nodes?: NodeDTO[];
        edges?: EdgeDTO[];
        error: string;
      } = await res.json();
      if (success && nodes && edges) {
        set((s) => ({
          syncing: false,
          nodes: nodes.map(toTableNodeData),
          edges: edges.map((edge) => toNodeRelationEdge(edge, nodes)),
          // Server state is the source of truth for nodes/edges after a full fetch.
          // A pending diagram edit is unrelated to that fetch, so keep it.
          pending: { ...createPending(), diagram: s.pending.diagram },
          live: createPending(),
        }));
      } else {
        console.error(error);
        set({ syncing: false, error });
      }
    } catch (err) {
      console.error(err);
      set({ syncing: false, error: err });
    }
  },
  //#endregion

  //#region Local updates (from flow)
  updateDiagramData: async (newDiagram) => {
    set((s) => {
      // Only edits of synced fields on an already loaded diagram are persisted
      const changed = s.info ? changedSyncFields(s.info, newDiagram) : [];
      for (const f of changed) {
        s.pending.diagram.add(f);
        s.live.diagram.add(f);
      }
      const hasChanges = changed.length > 0;
      return {
        info: newDiagram,
        dirtyVersion: s.dirtyVersion + (hasChanges ? 1 : 0),
        liveVersion: s.liveVersion + (hasChanges ? 1 : 0),
      };
    });
  },

  updateNodeData: async (nodes) => {
    set((s) => {
      if (nodes === s.nodes) return s;
      const touched = trackChanges(
        s.nodes,
        nodes,
        nodeChanged,
        s.pending.nodes,
        s.pending.deletedNodes,
      );
      const liveTouched = trackChanges(
        s.nodes,
        nodes,
        nodeLiveChanged,
        s.live.nodes,
        s.live.deletedNodes,
      );
      return {
        nodes,
        dirtyVersion: s.dirtyVersion + (touched ? 1 : 0),
        liveVersion: s.liveVersion + (liveTouched ? 1 : 0),
      };
    });
  },

  updateEdgeData: async (edges) => {
    set((s) => {
      if (edges === s.edges) return s;
      const touched = trackChanges(
        s.edges,
        edges,
        edgeChanged,
        s.pending.edges,
        s.pending.deletedEdges,
      );
      const liveTouched = trackChanges(
        s.edges,
        edges,
        edgeChanged,
        s.live.edges,
        s.live.deletedEdges,
      );
      return {
        edges,
        dirtyVersion: s.dirtyVersion + (touched ? 1 : 0),
        liveVersion: s.liveVersion + (liveTouched ? 1 : 0),
      };
    });
  },
  //#endregion

  //#region Remote updates (from Supabase Realtime)
  syncDiagram: (newDiagram) =>
    set((s) => {
      // Merge so fields the broadcast doesn't carry (ownerName, ownerAvatar) survive
      const merged: DiagramDTO = s.info
        ? { ...s.info, ...newDiagram }
        : newDiagram;
      // Keep fields with a local, not yet saved edit; the rest comes from the server
      const next =
        s.info && s.pending.diagram.size > 0
          ? { ...merged, ...pickSyncFields(s.info, s.pending.diagram) }
          : merged;
      // Skip echoes of our own saves
      if (s.info && jsonEqual(s.info, next)) return s;
      return { info: next };
    }),

  syncNode: (newNode, isDelete) =>
    set((s) => {
      if (isDelete) {
        s.pending.nodes.delete(newNode.id);
        return { nodes: s.nodes.filter((n) => n.id !== newNode.id) };
      }
      const old = s.nodes.find((n) => n.id === newNode.id);
      if (old) {
        // Keep local unsaved/in-progress changes; skip echoes of our own saves
        if (s.pending.nodes.has(old.id) || old.dragging) return s;
        if (nodeEqual(old, newNode)) return s;
      }
      const { selected, ...newNodeData } = newNode;
      return {
        nodes: old
          ? s.nodes.map((n) =>
              n.id === newNode.id
                ? { selected: n.selected, ...newNodeData }
                : n,
            )
          : [...s.nodes, newNode],
      };
    }),

  syncEdge: (newEdge, isDelete) =>
    set((s) => {
      if (isDelete) {
        s.pending.edges.delete(newEdge.id);
        return { edges: s.edges.filter((e) => e.id !== newEdge.id) };
      }
      const old = s.edges.find((e) => e.id === newEdge.id);
      if (old) {
        if (s.pending.edges.has(old.id)) return s;
        if (edgeEqual(old, newEdge)) return s;
      }
      const { selected, ...newEdgeData } = newEdge;
      return {
        edges: old
          ? s.edges.map((e) =>
              e.id === newEdge.id
                ? { selected: e.selected, ...newEdgeData }
                : e,
            )
          : [...s.edges, newEdge],
      };
    }),
  //#endregion

  //#region Persistence bookkeeping
  hasPending: () => {
    const { pending: p } = get();
    return (
      p.nodes.size > 0 ||
      p.edges.size > 0 ||
      p.deletedNodes.size > 0 ||
      p.deletedEdges.size > 0 ||
      p.diagram.size > 0
    );
  },

  // Returns what must be saved and clears the pending sets
  takePending: () => {
    const { nodes, edges, info, pending: p } = get();
    const snapshot: PendingSnapshot = {
      diagram:
        p.diagram.size > 0 && info ? pickSyncFields(info, p.diagram) : null,
      upsertNodes: nodes.filter((n) => p.nodes.has(n.id)),
      upsertEdges: edges.filter((e) => p.edges.has(e.id)),
      deleteNodeIds: [...p.deletedNodes],
      deleteEdgeIds: [...p.deletedEdges],
    };
    p.nodes.clear();
    p.edges.clear();
    p.deletedNodes.clear();
    p.deletedEdges.clear();
    p.diagram.clear();
    return snapshot;
  },

  // Returns what must be broadcast to other clients and clears the live sets
  takeLive: () => {
    const { nodes, edges, info, live: l } = get();
    const payload: LivePayload = {
      diagram:
        l.diagram.size > 0 && info ? pickSyncFields(info, l.diagram) : null,
      nodes: nodes.filter((n) => l.nodes.has(n.id)).map(toNodeDTO),
      edges: edges.filter((e) => l.edges.has(e.id)).map(toEdgeDTO),
      deleteNodeIds: [...l.deletedNodes],
      deleteEdgeIds: [...l.deletedEdges],
    };
    l.nodes.clear();
    l.edges.clear();
    l.deletedNodes.clear();
    l.deletedEdges.clear();
    l.diagram.clear();
    return payload;
  },

  // Put a failed snapshot back (silently, no version bump: the caller schedules the retry)
  restorePending: (snapshot) => {
    const { nodes, edges, pending: p } = get();
    const nodeIds = new Set(nodes.map((n) => n.id));
    const edgeIds = new Set(edges.map((e) => e.id));
    if (snapshot.diagram && get().info) {
      for (const f of Object.keys(snapshot.diagram) as DiagramSyncField[]) {
        p.diagram.add(f);
      }
    }
    for (const n of snapshot.upsertNodes) {
      if (nodeIds.has(n.id) && !p.deletedNodes.has(n.id)) p.nodes.add(n.id);
    }
    for (const e of snapshot.upsertEdges) {
      if (edgeIds.has(e.id) && !p.deletedEdges.has(e.id)) p.edges.add(e.id);
    }
    for (const id of snapshot.deleteNodeIds) {
      if (!nodeIds.has(id)) p.deletedNodes.add(id);
    }
    for (const id of snapshot.deleteEdgeIds) {
      if (!edgeIds.has(id)) p.deletedEdges.add(id);
    }
  },
  //#endregion
}));
//#endregion

//#region Provider (side effects only: autosave + realtime)
export default function DrawingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = useSession();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Drawing");
  const { enqueueSnackbar } = useSnackbar();
  const supabase = useMemo(() => createClient(), []);

  // Always-fresh references for long-lived callbacks (avoids stale closures)
  const latest = useRef({
    t,
    enqueueSnackbar,
    router,
    userId: session.data?.user?.id,
  });
  useEffect(() => {
    latest.current = {
      t,
      enqueueSnackbar,
      router,
      userId: session.data?.user?.id,
    };
  });

  // Layout effects run before children's passive effects,
  // so the first fetch from a child already uses the right locale
  useLayoutEffect(() => {
    useDrawingStore.setState({ locale });
  }, [locale]);

  //#region Autosave: debounced, sends only what changed
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let queue: Promise<void> = Promise.resolve();
    let failed = false;
    // When the oldest unsaved edit happened (for the max wait)
    let dirtySince: number | null = null;
    let disposed = false;

    // Never throws. Takes the snapshot synchronously, then sends it.
    const send = async (keepalive: boolean) => {
      dirtySince = null;
      const store = useDrawingStore.getState();
      const id = store.info?.diagram_oid;
      if (!id || !store.hasPending()) return;

      const snapshot = store.takePending();

      const patch = async (path: string, payload: unknown) => {
        const res = await fetch(`/api/data/diagram/${id}/${path}`, {
          method: "PATCH",
          keepalive,
          headers: {
            "Content-Type": "application/json",
            "accept-language": store.locale,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new HttpError(res.status);
      };

      const hasGraphChanges =
        snapshot.upsertNodes.length > 0 ||
        snapshot.upsertEdges.length > 0 ||
        snapshot.deleteNodeIds.length > 0 ||
        snapshot.deleteEdgeIds.length > 0;

      // Nodes/edges and diagram info are saved independently
      const [graphResult, diagramResult] = await Promise.allSettled([
        hasGraphChanges
          ? patch("updateDiagramNodesAndEdges", {
              upsertNodes: snapshot.upsertNodes.map(toNodeDTO),
              deleteNodeIds: snapshot.deleteNodeIds,
              upsertEdges: snapshot.upsertEdges.map(toEdgeDTO),
              deleteEdgeIds: snapshot.deleteEdgeIds,
            })
          : undefined,
        snapshot.diagram
          ? patch("updateDiagramInfo", snapshot.diagram)
          : undefined,
      ]);

      const graphFailed = graphResult.status === "rejected";
      const diagramFailed = diagramResult.status === "rejected";
      if (!graphFailed && !diagramFailed) {
        failed = false;
        return;
      }

      for (const r of [graphResult, diagramResult]) {
        if (r.status === "rejected") {
          console.error(`Error saving diagram ${id}:`, r.reason);
        }
      }
      if (disposed) return;

      // Rejected by the server (no access, invalid, gone): retrying can't help.
      // Drop the local edit and reload the server state instead.
      const isRejected = (r: PromiseSettledResult<unknown>) =>
        r.status === "rejected" &&
        r.reason instanceof HttpError &&
        [400, 401, 403, 404].includes(r.reason.status);
      const graphRejected = isRejected(graphResult);
      const diagramRejected = isRejected(diagramResult);
      const current = useDrawingStore.getState();
      if (graphRejected) void current.fetchNodeAndEdgeData(id);
      if (diagramRejected) void current.fetchDiagramData(id);
      if (graphRejected || diagramRejected) {
        latest.current.enqueueSnackbar(latest.current.t("updateFail"), {
          variant: "error",
        });
      }

      // Transient errors (network, 5xx): put the parts that failed back and retry
      const retryGraph = graphFailed && !graphRejected;
      const retryDiagram = diagramFailed && !diagramRejected;
      if (!retryGraph && !retryDiagram) return;

      current.restorePending({
        upsertNodes: retryGraph ? snapshot.upsertNodes : [],
        upsertEdges: retryGraph ? snapshot.upsertEdges : [],
        deleteNodeIds: retryGraph ? snapshot.deleteNodeIds : [],
        deleteEdgeIds: retryGraph ? snapshot.deleteEdgeIds : [],
        diagram: retryDiagram ? snapshot.diagram : null,
      });
      if (!failed) {
        failed = true;
        latest.current.enqueueSnackbar(latest.current.t("updateFail"), {
          variant: "error",
        });
      }
      schedule(RETRY_DELAY_MS);
    };

    // Requests run one after another so an older save can't overwrite a newer one
    function schedule(ms: number) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        queue = queue.then(() => send(false));
      }, ms);
    }

    const unsubscribe = useDrawingStore.subscribe((s, prev) => {
      if (s.dirtyVersion === prev.dirtyVersion) return;
      const now = Date.now();
      dirtySince ??= now;
      schedule(
        Math.min(
          PERSIST_DEBOUNCE_MS,
          Math.max(0, dirtySince + PERSIST_MAX_WAIT_MS - now),
        ),
      );
    });

    // Flush immediately when the tab is hidden or closed
    const flushNow = () => {
      clearTimeout(timer);
      void send(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushNow();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flushNow);

    return () => {
      unsubscribe();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flushNow);
      void send(true); // flush what is left before leaving the page
      disposed = true;
      useDrawingStore.getState().reset();
    };
  }, []);
  //#endregion

  //#region Realtime: apply remote changes
  // Each diagram has its own private topic, fed by the DB triggers in
  // supabase/migrations (realtime.broadcast_changes)
  const pathname = usePathname();
  const routeParams = useParams<{ id?: string }>();
  const diagramId =
    pathname.includes("/drawing/") && isUuid(routeParams.id)
      ? routeParams.id
      : undefined;

  useEffect(() => {
    if (!diagramId) return;

    let disposed = false;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let channel: ReturnType<typeof supabase.channel> | undefined;
    let subscribed = false;
    let liveTimer: ReturnType<typeof setTimeout> | undefined;

    // Sends local edits to the other clients right away (throttled). Not saved
    // to the DB here: that is the autosave's job.
    const sendLive = () => {
      liveTimer = undefined;
      const payload = useDrawingStore.getState().takeLive();
      if (!subscribed || !channel) return;
      if (
        !payload.diagram &&
        payload.nodes.length === 0 &&
        payload.edges.length === 0 &&
        payload.deleteNodeIds.length === 0 &&
        payload.deleteEdgeIds.length === 0
      ) {
        return;
      }
      void channel.send({ type: "broadcast", event: "live", payload });
    };
    const unsubscribeLive = useDrawingStore.subscribe((s, prev) => {
      if (s.liveVersion !== prev.liveVersion && !liveTimer) {
        liveTimer = setTimeout(sendLive, LIVE_THROTTLE_MS);
      }
    });

    // The private channel is authorized by a short-lived JWT minted from the
    // next-auth session; renew it before it expires
    const refreshToken = async () => {
      const res = await fetch("/api/realtime/token", { cache: "no-store" });
      const { token, expiresIn } = await res.json();
      if (!res.ok || !token) throw new Error("Cannot get realtime token");
      await supabase.realtime.setAuth(token);
      if (disposed) return;
      refreshTimer = setTimeout(
        () =>
          refreshToken().catch((e) =>
            console.error("Realtime token refresh failed:", e),
          ),
        expiresIn * 0.8 * 1000,
      );
    };

    const start = async () => {
      try {
        await refreshToken();
      } catch (e) {
        console.error("Realtime auth failed:", e);
        return;
      }
      if (disposed) return;

      channel = supabase.channel(`diagram:${diagramId}`, {
        config: { private: true },
      });

      channel
        .on(
          "broadcast",
          { event: "diagram_changed" },
          ({ payload }: { payload: RowChangePayload<DiagramRow> }) => {
            const is_deleted = payload.operation === "DELETE";
            const row = is_deleted ? payload.old_record : payload.record;
            if (!row) return;
            const diagramDTO: DiagramDTO = toDiagramDTOFromRow(row);
            diagramDTO.isOwned = diagramDTO.owner_oid === latest.current.userId;
            useDrawingStore.getState().syncDiagram(diagramDTO);
            if (is_deleted) {
              latest.current.enqueueSnackbar(
                latest.current.t("diagramDeletedAndRedirectToDashboard"),
                { variant: "error" },
              );
              latest.current.router.push("/dashboard");
            }
          },
        )
        .on(
          "broadcast",
          { event: "live" },
          ({ payload }: { payload: LivePayload }) => {
            const store = useDrawingStore.getState();
            if (payload.diagram && store.info) {
              store.syncDiagram(payload.diagram as DiagramDTO);
            }
            for (const id of payload.deleteNodeIds ?? []) {
              store.syncNode({ id } as TableNodeData, true);
            }
            for (const node of payload.nodes ?? []) {
              store.syncNode(toTableNodeData(node), false);
            }
            // Read nodes after they were applied, not from a stale closure
            const nodeDTOs = useDrawingStore.getState().nodes.map(toNodeDTO);
            for (const id of payload.deleteEdgeIds ?? []) {
              store.syncEdge({ id } as NodeRelationEdge, true);
            }
            for (const edge of payload.edges ?? []) {
              store.syncEdge(toNodeRelationEdge(edge, nodeDTOs), false);
            }
          },
        )
        .subscribe((status, error) => {
          if (status === "SUBSCRIBED") {
            subscribed = true;
            console.log("Successful subscribing to Supabase Broadcast");
          } else {
            subscribed = false;
            console.error("Error subscribing to Supabase channel:", error);
          }
        });
    };

    void start();

    return () => {
      disposed = true;
      unsubscribeLive();
      clearTimeout(liveTimer);
      clearTimeout(refreshTimer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, diagramId]);
  //#endregion

  return <>{children}</>;
}
//#endregion

//#region Hooks (same names/return types as before)
export function useDrawing() {
  return useDrawingStore(
    useShallow((s) => ({
      isFirstLoaded: s.isFirstLoaded,
      loading: s.loading,
      syncing: s.syncing,
      info: s.info,
      nodes: s.nodes,
      edges: s.edges,
      error: s.error,
    })),
  );
}

export const useDrawingIsFirstLoading = () =>
  useDrawingStore((s) => s.isFirstLoaded);

export const useDrawingLoadingStatus = () => useDrawingStore((s) => s.loading);

export const useDrawingSyncingStatus = () => useDrawingStore((s) => s.syncing);

export const useDrawingDiagramDTO = () => useDrawingStore((s) => s.info);

export const useDrawingNodes = () => useDrawingStore((s) => s.nodes);

export const useDrawingEdges = () => useDrawingStore((s) => s.edges);

export const useDrawingFetchData = () =>
  useDrawingStore((s) => s.fetchDiagramData);

export const useDrawingFetchNodeAndEdge = () =>
  useDrawingStore((s) => s.fetchNodeAndEdgeData);

export const useDrawingUpdateDiagram = () =>
  useDrawingStore((s) => s.updateDiagramData);

export const useDrawingUpdateNodes = () =>
  useDrawingStore((s) => s.updateNodeData);

export const useDrawingUpdateEdges = () =>
  useDrawingStore((s) => s.updateEdgeData);
//#endregion
