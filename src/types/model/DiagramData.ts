import {
  ReferentialAction,
  RelationshipType,
  SQLProviderName,
} from "@/src/constants/sqlProviders";
import { ColumnProps, TableKeys } from "./ExtendedNodeEdge";

export interface NewDiagramDTO {
  createdAt: Date;
  isPrivate: boolean;
  title?: string;
}

export interface DiagramDTO {
  diagram_oid: string;
  createdAt?: Date;
  updatedAt?: Date;
  isOwned?: boolean;
  isPrivate: boolean;
  owner_oid: string;
  ownerAvatar?: string | null | undefined;
  ownerName?: string | null | undefined;
  providerName: SQLProviderName;
  title: string;
  shares: string[];
}

export interface NodeDTO {
  node_oid: string;
  createdAt?: Date;
  updatedAt?: Date;
  diagram_oid: string;
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

export interface EdgeDTO {
  edge_oid: string;
  createdAt?: Date;
  updatedAt?: Date;
  diagram_oid: string;
  id: string;
  source: string;
  sourceHandle?: string | null;
  target: string;
  targetHandle?: string | null;
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
