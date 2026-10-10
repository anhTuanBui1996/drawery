import {
  KeyWithColumnProp,
  NodeRelationEdge,
  TableNodeData,
} from "../types/model/ExtendedNodeEdge";
import * as muiColors from "@mui/material/colors";
import { EdgeDTO, NodeDTO } from "../types/model/DiagramData";
import { SQLProviderName, SQLProviders } from "../constants/sqlProviders";

export const HUES = [
  "red",
  "pink",
  "purple",
  "deepPurple",
  "indigo",
  "blue",
  "lightBlue",
  "cyan",
  "teal",
  "green",
  "lightGreen",
  "lime",
  "yellow",
  "amber",
  "orange",
  "deepOrange",
  "brown",
  "grey",
  "blueGrey",
] as const;

export type HUE = (typeof HUES)[number];

export function getShades(hue: HUE) {
  return muiColors[hue as keyof typeof muiColors];
}

export function getMuiColor(hue: HUE, shade: keyof typeof muiColors.red) {
  return (muiColors as any)[hue][shade] as string;
}

export function getRandomMuiColor(shade: keyof typeof muiColors.red = 500) {
  const hue = HUES[Math.floor(Math.random() * HUES.length)];
  return (muiColors as any)[hue][shade] as string;
}

export const invalidCharRegexInName = new RegExp(/^[a-zA-Z_][a-zA-Z0-9_]*$/);

export function getDataTypeList(providerName: SQLProviderName) {
  return SQLProviders.find((p) => p.provider === providerName);
}

export const syncTableNameToRelationship = (
  edgeId: string,
  sourceTableName: string,
  targetTableName: string,
  getEdges: () => NodeRelationEdge[],
) => {
  let loopIndex = 0;
  let pattern = `FK_${sourceTableName}_${targetTableName}_`;
  let newRelationshipName = `${pattern}${loopIndex}`;
  while (
    getEdges().find(
      (e) =>
        e.id !== edgeId && e.data?.relationshipName === newRelationshipName,
    )
  ) {
    loopIndex++;
    newRelationshipName = `${pattern}${loopIndex}`;
  }
  return newRelationshipName;
};

//#region DTO conversion
export function toNodeDTO(node: TableNodeData): NodeDTO {
  return {
    id: node.id,
    diagram_oid: node.data.diagramId,
    node_oid: node.data._id?.toString() || "",
    createdAt: node.data.createdAt || new Date(),
    updatedAt: node.data.updatedAt,
    index: node.data.index,
    position: node.position,
    data: node.data,
  };
}

export function toEdgeDTO(edge: NodeRelationEdge): EdgeDTO {
  return {
    id: edge.id,
    diagram_oid: edge.data?.diagramId || "",
    edge_oid: edge.data?._id?.toString() || "",
    index: edge.data?.index || 0,
    source: edge.source,
    sourceHandle: edge.sourceHandle,
    target: edge.target,
    targetHandle: edge.targetHandle,
    color: edge.data?.color || "#ffffff",
    isAutoNaming: !!edge.data?.isAutoNaming,
    referentialActionForDelete:
      edge.data?.referentialActionForDelete || "noAction",
    referentialActionForUpdate:
      edge.data?.referentialActionForUpdate || "noAction",
    relationshipName: edge.data?.relationshipName || "FK_Source_Target_0",
    relationType: "N - 1",
    sourceColumnIds: edge.data?.sourceColumns.map((c) => c[0]) || [],
    targetSelectedPrimaryOrUniqueId: edge.data?.targetSelectedKey.id || "",
  };
}

export function toTableNodeData(node: NodeDTO): TableNodeData {
  return {
    id: node.id,
    type: "tableNode",
    position: node.position,
    data: {
      ...node.data,
      _id: node.node_oid,
      diagramId: node.diagram_oid,
      index: node.index,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
    },
  };
}

export function toNodeRelationEdge(
  edge: EdgeDTO,
  nodeDTOs: NodeDTO[],
): NodeRelationEdge {
  const sourceNode = nodeDTOs.find((n) => n.id === edge.source);
  const targetNode = nodeDTOs.find((n) => n.id === edge.target);
  let targetSelectedKey: KeyWithColumnProp | undefined = undefined;
  if (
    edge.targetSelectedPrimaryOrUniqueId ===
      targetNode?.data.keys?.primaryKey?.id &&
    targetNode.data.keys?.primaryKey
  ) {
    targetSelectedKey = {
      id: edge.targetSelectedPrimaryOrUniqueId,
      isPrimary: true,
      isUnique: true,
      keyName: targetNode.data.keys.primaryKey.keyName,
      columns: targetNode.data.keys.primaryKey.columnsWithIdAndSortOrder.map(
        (c) => [c.columnId, targetNode.data.columns[c.columnId]],
      ),
    };
  } else if (
    targetNode?.data.keys?.otherKeys &&
    targetNode.data.keys.otherKeys[edge.targetSelectedPrimaryOrUniqueId] &&
    targetNode.data.keys.otherKeys[edge.targetSelectedPrimaryOrUniqueId]
      .isUnique
  ) {
    targetSelectedKey = {
      id: edge.targetSelectedPrimaryOrUniqueId,
      isPrimary: false,
      isUnique: true,
      keyName:
        targetNode.data.keys.otherKeys[edge.targetSelectedPrimaryOrUniqueId]
          .keyName,
      columns: targetNode.data.keys.otherKeys[
        edge.targetSelectedPrimaryOrUniqueId
      ].columnsWithIdAndSortOrder.map((c) => [
        c.columnId,
        targetNode.data.columns[c.columnId],
      ]),
    };
  }
  return {
    id: edge.id,
    type: "foreignKeyEdge",
    source: edge.source,
    sourceHandle: edge.sourceHandle,
    target: edge.target,
    targetHandle: edge.targetHandle,
    data: {
      ...edge,
      _id: edge.edge_oid,
      diagramId: edge.diagram_oid,
      sourceColumns: edge.sourceColumnIds.map((cid) => [
        cid,
        sourceNode?.data.columns[cid],
      ]),
      targetSelectedKey: targetSelectedKey
        ? targetSelectedKey
        : {
            id: "",
          },
    },
  };
}

//#endregion
