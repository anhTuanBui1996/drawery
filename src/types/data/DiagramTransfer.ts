import { Edge } from "@xyflow/react";
import { ObjectId } from "mongodb";
import { ColumnProps } from "../model/TableNode";

export interface NewDiagram {
  createdAt: Date;
  isPrivate: boolean;
  title?: string;
}

export interface DiagramDocument {
  _id: ObjectId;
  createdAt: Date;
  updatedAt?: Date;
  title?: string | null;
  ownerId: ObjectId;
  shares: ObjectId[];
  isPrivate: boolean;
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
    columns: Record<string, ColumnProps>;
  };
}

export interface EdgeDocument {
  _id: ObjectId;
  createdAt: Date;
  updatedAt?: Date;
  diagramId: ObjectId;
  id: string;
  source: string;
  target: string;
}
