import { routing } from "@/src/i18n/routing";
import { authOptions } from "@/src/lib/nextauth";
import supabaseAdmin from "@/src/lib/supabase/admin";
import { DiagramRow } from "@/src/types/data/DiagramRow";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { NextRequest, NextResponse } from "next/server";
import { EdgeDTO, NodeDTO } from "@/src/types/model/DiagramData";
import { isUuid, toEdgeRow, toNodeRow } from "@/src/utils/server";

type RequestBody = {
  upsertNodes?: NodeDTO[];
  deleteNodeIds?: string[];
  upsertEdges?: EdgeDTO[];
  deleteEdgeIds?: string[];
};

const MAX_DELETE_IDS = 5000;

// Flow ids (e.g. "table_xxx"), the same ids used as flow_id when upserting
const toFlowIds = (ids: unknown): string[] =>
  Array.isArray(ids)
    ? ids
        .filter((x): x is string => typeof x === "string" && x.length > 0)
        .slice(0, MAX_DELETE_IDS)
    : [];

const toArray = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

// One upsert statement can't touch the same row twice: the last one wins
const uniqueByFlowId = <T extends { flow_id: string }>(rows: T[]): T[] => [
  ...new Map(rows.map((row) => [row.flow_id, row])).values(),
];

type Table = "nodes" | "edges";

// Upsert by (diagram_id, flow_id): always scoped to this diagram, so a row of
// another diagram can never be overwritten
async function upsertRows(table: Table, rows: { flow_id: string }[]) {
  if (rows.length === 0) return;
  const { error } = await supabaseAdmin
    .from(table)
    .upsert(rows, { onConflict: "diagram_id,flow_id" });
  if (error) throw error;
}

async function deleteRows(table: Table, diagramId: string, flowIds: string[]) {
  if (flowIds.length === 0) return;
  const { error } = await supabaseAdmin
    .from(table)
    .delete()
    .eq("diagram_id", diagramId)
    .in("flow_id", flowIds);
  if (error) throw error;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const locale = req.headers.get("accept-language") || routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "Drawing" });
  const { id } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    if (!isUuid(id)) {
      return NextResponse.json({ error: t("invalidId") }, { status: 400 });
    }

    let body: RequestBody;
    try {
      body = (await req.json()) as RequestBody;
    } catch {
      return NextResponse.json({ error: t("alertError") }, { status: 400 });
    }

    const upsertNodes = toArray<NodeDTO>(body?.upsertNodes);
    const upsertEdges = toArray<EdgeDTO>(body?.upsertEdges);
    const deleteNodeIds = toFlowIds(body?.deleteNodeIds);
    const deleteEdgeIds = toFlowIds(body?.deleteEdgeIds);

    const { data: diagram, error: findError } = await supabaseAdmin
      .from("diagrams")
      .select("*")
      .eq("id", id)
      .maybeSingle<DiagramRow>();
    if (findError) throw findError;

    if (!diagram) {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }

    const isOwner = diagram.owner_id === session.user.id;

    if (diagram.is_private && !isOwner) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    await Promise.all([
      upsertRows(
        "nodes",
        uniqueByFlowId(upsertNodes.map((n) => toNodeRow(n, id))),
      ),
      upsertRows(
        "edges",
        uniqueByFlowId(upsertEdges.map((e) => toEdgeRow(e, id))),
      ),
    ]);

    // Delete only what the client explicitly removed, scoped to this diagram
    await Promise.all([
      deleteRows("nodes", id, deleteNodeIds),
      deleteRows("edges", id, deleteEdgeIds),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(
      `PATCH /api/data/diagram/${id}/updateDiagramNodesAndEdges error:`,
      err,
    );
    return NextResponse.json({ error: t("alertError") }, { status: 500 });
  }
}
