import { toNodeRelationEdge, toTableNodeData } from "@/src/lib/utils";
import { EdgeDocument, NodeDocument } from "@/src/types/data/DiagramTransfer";
import { DiagramInfo } from "@/src/types/model/DiagramData";
import { NodeRelationEdge, TableNodeData } from "@/src/types/model/TableNode";
import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { createContext, useContext, useReducer, useCallback } from "react";

interface ContextData {
  isFirstLoaded: boolean;
  loading: boolean;
  info: DiagramInfo | null;
  nodes: TableNodeData[];
  edges: NodeRelationEdge[];
  error?: string | any | null;
}

interface ContextDispatcher {
  fetchDiagramData: (diagramId: string, isFirstLoad?: boolean) => Promise<void>;
  updateDiagramTitle: (diagramId: string, newTitle: string) => Promise<void>;
  fetchNodeAndEdgeData: (diagramId: string) => Promise<void>;
}

type Action =
  | { type: "firstFetchDiagramStart"; diagramId: string }
  | { type: "firstFetchDiagramSuccess"; result: DiagramInfo }
  | { type: "firstFetchDiagramFail"; error: string | any }
  | { type: "fetchDiagramStart"; diagramId: string }
  | { type: "fetchDiagramSuccess"; result: DiagramInfo }
  | { type: "fetchDiagramFail"; error: string | any }
  | { type: "fetchNodeAndEdgeStart"; diagramId: string }
  | {
      type: "fetchNodeAndEdgeSuccess";
      result: { nodes: TableNodeData[]; edges: NodeRelationEdge[] };
    }
  | { type: "fetchNodeAndEdgeFail"; error: string | any }
  | { type: "saveDiagramStart" }
  | { type: "saveDiagramSuccess"; result: DiagramInfo }
  | { type: "saveDiagramFail"; error: string | any }
  | { type: "saveNodeAndEdgeStart" }
  | { type: "saveNodeAndEdgeSuccess" }
  | { type: "saveNodeAndEdgeFail"; error: string | any }
  | { type: "saveEdgeStart" }
  | { type: "saveEdgeSuccess"; newDiagram: DiagramInfo }
  | { type: "saveEdgeFail"; error: string | any };

function reducer(ctx: ContextData, action: Action): ContextData {
  let newCtx = { ...ctx };
  switch (action.type) {
    case "firstFetchDiagramStart":
      return { ...ctx, isFirstLoaded: true, loading: true, error: null };
    case "firstFetchDiagramSuccess":
      return {
        ...ctx,
        isFirstLoaded: true,
        loading: false,
        info: action.result,
      };
    case "firstFetchDiagramFail":
      return {
        ...ctx,
        isFirstLoaded: true,
        loading: false,
        error: action.error,
      };
    case "fetchDiagramStart":
      return { ...ctx, isFirstLoaded: false, loading: true, error: null };
    case "fetchDiagramSuccess":
      return {
        ...ctx,
        loading: false,
        info: action.result,
      };
    case "fetchDiagramFail":
      return {
        ...ctx,
        loading: false,
        error: action.error,
      };
    case "fetchNodeAndEdgeStart":
      return { ...ctx, loading: true, error: null };
    case "fetchNodeAndEdgeSuccess":
      return {
        ...ctx,
        loading: false,
        nodes: action.result.nodes,
        edges: action.result.edges,
      };
    case "fetchNodeAndEdgeFail":
      return {
        ...ctx,
        loading: false,
        error: action.error,
      };
    case "saveDiagramStart":
      return {
        ...ctx,
        loading: true,
        error: null,
      };
    case "saveDiagramSuccess":
      return {
        ...ctx,
        loading: false,
      };
    case "saveDiagramFail":
      return {
        ...ctx,
        loading: false,
        error: action.error,
      };
    default:
      return newCtx;
  }
}

const initialContextData: ContextData = {
  isFirstLoaded: false,
  loading: false,
  info: null,
  nodes: [],
  edges: [],
  error: null,
};
const DrawingContext = createContext<ContextData>(initialContextData);
const DrawingDispatcher = createContext<ContextDispatcher | null>(null);

export default function DrawingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ctx, dispatch] = useReducer(reducer, initialContextData);
  const locale = useLocale();
  const t = useTranslations("Drawing");
  const { enqueueSnackbar } = useSnackbar();

  //#region FetchData
  const fetchDiagramData = useCallback(
    async (diagramId: string, isFirstLoad?: boolean) => {
      dispatch({
        type: isFirstLoad ? "firstFetchDiagramStart" : "fetchDiagramStart",
        diagramId,
      });
      try {
        const resDiagramInfo = await fetch(
          `/api/data/diagram/${diagramId}/getDiagramInfo`,
          {
            headers: { "accept-language": locale },
          },
        );
        const {
          success,
          diagramInfo,
          error,
        }: { success?: boolean; diagramInfo?: DiagramInfo; error: string } =
          await resDiagramInfo.json();
        if (success && diagramInfo) {
          dispatch({
            type: isFirstLoad
              ? "firstFetchDiagramSuccess"
              : "fetchDiagramSuccess",
            result: diagramInfo,
          });
        } else {
          console.error(error);
          dispatch({
            type: isFirstLoad ? "firstFetchDiagramFail" : "fetchDiagramFail",
            error,
          });
        }
      } catch (err) {
        console.error(err);
        dispatch({
          type: isFirstLoad ? "firstFetchDiagramFail" : "fetchDiagramFail",
          error: err,
        });
      }
    },
    [],
  );
  const fetchNodeAndEdgeData = useCallback(
    async (diagramId: string, isFirstLoad?: boolean) => {
      dispatch({ type: "fetchNodeAndEdgeStart", diagramId });
      try {
        const resDiagramInfo = await fetch(
          `/api/data/diagram/${diagramId}/getDiagramNodesAndEdges`,
          {
            headers: { "accept-language": locale },
          },
        );
        const {
          success,
          nodes,
          edges,
          error,
        }: {
          success?: boolean;
          nodes?: NodeDocument[];
          edges?: EdgeDocument[];
          error: string;
        } = await resDiagramInfo.json();
        if (success) {
          dispatch({
            type: "fetchNodeAndEdgeSuccess",
            result: {
              nodes: nodes ? nodes.map(toTableNodeData) : [],
              edges: edges ? edges.map(toNodeRelationEdge) : [],
            },
          });
        } else {
          console.error(error);
          dispatch({ type: "fetchNodeAndEdgeFail", error });
        }
      } catch (err) {
        console.error(err);
        dispatch({ type: "fetchNodeAndEdgeFail", error: err });
      }
    },
    [],
  );
  //#endregion

  //#region UpdateData (server)
  const updateDiagramTitle = useCallback(
    async (diagramId: string, newTitle: string) => {
      try {
        dispatch({ type: "saveDiagramStart" });
        const res = await fetch(
          `/api/data/diagram/${diagramId}/updateDiagramTitle`,
          {
            method: "PATCH",
            headers: { "accept-language": locale },
            body: JSON.stringify({ diagramId, newTitle }),
          },
        );
        const {
          success,
          result,
          error,
        }: { success?: boolean; result?: DiagramInfo; error?: string } =
          await res.json();
        if (success && result) {
          dispatch({ type: "saveDiagramSuccess", result });
        } else {
          console.error(error);
          enqueueSnackbar(t("updateFail"), { variant: "error" });
          dispatch({
            type: "saveDiagramFail",
            error: error || t("sendUpdateTitleFail"),
          });
        }
      } catch (err) {
        console.error(err);
        enqueueSnackbar(t("updateFail"), { variant: "error" });
      }
    },
    [],
  );
  //#endregion

  return (
    <DrawingContext value={ctx}>
      <DrawingDispatcher
        value={{ fetchDiagramData, updateDiagramTitle, fetchNodeAndEdgeData }}
      >
        {children}
      </DrawingDispatcher>
    </DrawingContext>
  );
}

export function useDrawing() {
  const ctx = useContext(DrawingContext);
  return ctx;
}

export function useDrawingIsFirstLoading() {
  const ctx = useContext(DrawingContext);
  return ctx.isFirstLoaded;
}

export function useDrawingLoadingStatus() {
  const ctx = useContext(DrawingContext);
  return ctx.loading;
}

export function useDrawingDiagramInfo() {
  const ctx = useContext(DrawingContext);
  return ctx.info;
}

export function useDrawingFetchData() {
  const ctx = useContext(DrawingDispatcher);
  return ctx?.fetchDiagramData;
}

export function useDrawingFetchNodeAndEdge() {
  const ctx = useContext(DrawingDispatcher);
  return ctx?.fetchNodeAndEdgeData;
}

export function useDrawingUpdateTitle() {
  const ctx = useContext(DrawingDispatcher);
  return ctx?.updateDiagramTitle;
}
