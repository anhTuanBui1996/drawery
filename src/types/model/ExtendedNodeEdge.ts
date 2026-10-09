import { keyframes } from "@emotion/react";
import { Edge, Node } from "@xyflow/react";
import { PickerValue } from "@mui/x-date-pickers/internals";
import {
  ColumnDataType,
  ReferentialAction,
  RelationshipType,
} from "@/src/constants/sqlProviders";

export interface ColumnProps {
  columnName: string;
  isNullable?: boolean;
  dataType: ColumnDataType;
  identity?: {
    seed: number;
    increment: number;
  };
  defaultValue?: number | string | PickerValue;
  description?: string;
}

export type SortOrder = "asc" | "desc";

export type TableKey = {
  id: string;
  keyName: string;
  isPrimary: boolean;
  isUnique: boolean;
  columnsWithIdAndSortOrder: { columnId: string; sortOrder: SortOrder }[];
};

export type PrimaryKey = Omit<TableKey, "isPrimary" | "isUnique"> & {
  isPrimary: true;
  isUnique: true;
};

export type OtherKey = Omit<TableKey, "isPrimary"> & {
  isPrimary: false;
};

export type TableKeys = {
  primaryKey?: PrimaryKey;
  otherKeys?: Record<string, OtherKey>;
};

export type TableNodeData = Node<
  {
    _id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    diagramId: string;
    index: number;
    color: string;
    tableName: string;
    columns: Record<string, ColumnProps>; // <columnId, ColumnProps>
    keys?: TableKeys;
  },
  "tableNode"
>;

export type KeyWithColumnProp = {
  id: string;
  keyName?: string;
  isPrimary?: boolean;
  isUnique?: boolean;
  columns?: [string, ColumnProps][];
};

export type NodeRelationData = {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  diagramId: string;
  index: number;
  color: string;
  relationType: RelationshipType;
  relationshipName: string;
  isAutoNaming: boolean;
  referentialActionForUpdate: ReferentialAction;
  referentialActionForDelete: ReferentialAction;
  targetSelectedKey: KeyWithColumnProp;
  sourceColumns: [string, ColumnProps?][];
};

export type NodeRelationEdge = Edge<NodeRelationData, "foreignKeyEdge">;

/**
 * Style marching ants for selecting node (current = -16)
 */
export const marchingAntsBorderStyle = keyframes`
  to {
    stroke-dashoffset: -16;
  }
`;
