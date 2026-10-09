import { ObjectId } from "mongodb";
import { ColumnProps, TableKeys } from "../model/ExtendedNodeEdge";
import {
  ReferentialAction,
  RelationshipType,
  SQLProviderName,
} from "@/src/constants/sqlProviders";

export interface DiagramDocument {
  _id: ObjectId;
  createdAt: Date;
  updatedAt?: Date;
  title: string;
  ownerId: ObjectId;
  shares: ObjectId[];
  isPrivate: boolean;
  provider: SQLProviderName;
}

export interface NodeDocument {
  _id: ObjectId;
  createdAt: Date;
  updatedAt?: Date;
  diagramId: ObjectId;
  id: string;
  position: {
    x: number;
    y: number;
  };
  index: number;
  data: {
    color: string;
    tableName: string;
    columns: Record<string, ColumnProps>; // <columnId, ColumnProps>
    keys?: TableKeys;
  };
}

export interface EdgeDocument {
  _id: ObjectId;
  createdAt: Date;
  updatedAt?: Date;
  diagramId: ObjectId;
  source: string;
  sourceHandle?: string | null;
  target: string;
  targetHandle?: string | null;
  id: string;
  index: number;
  color: string;
  relationType: RelationshipType;
  relationshipName: string;
  isAutoNaming: boolean;
  referentialActionForUpdate: ReferentialAction;
  referentialActionForDelete: ReferentialAction;
  targetSelectedPrimaryOrUniqueId: string;
  sourceColumnIds: string[];
}

export type WebhookPayload = {
  operationType: "insert" | "update" | "delete" | "replace";
  documentKey: ObjectId;
  fullDocument: any;
};
