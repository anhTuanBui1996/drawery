import { keyframes } from "@emotion/react";
import { Edge, Node } from "@xyflow/react";
import { SQLProvider } from "../data/DiagramTransfer";
import { PickerValue } from "@mui/x-date-pickers/internals";
import { ObjectId } from "mongodb";

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

export type TableKey = {
  keyName: string;
  isPrimary: boolean;
  isUnique: boolean;
  columnIds: { columnId: string; sortType: "asc" | "desc" }[];
};

export type PrimaryKey = Omit<TableKey, "isPrimary" | "isUnique"> & {
  isUnique: true;
};

export type OtherKey = Omit<TableKey, "isPrimary">;

export type TableKeys = {
  primaryKey: PrimaryKey;
  otherKeys?: Record<string, OtherKey>;
};

export type TableNodeData = Node<
  {
    _id?: ObjectId;
    diagramId: string;
    index: number;
    color: string;
    tableName: string;
    columns: Record<string, ColumnProps>; // <columnId, ColumnProps>
    keys: TableKeys;
  },
  "tableNode"
>;

export type NodeRelationEdge = Edge<
  {
    _id?: ObjectId;
    diagramId: string;
    relationType: RelationshipType;
    relationshipName: string;
    isAutoNaming: boolean;
    referentialAction: ReferentialAction;
    sourceColumns: string[];
    targetColumns: string[];
  },
  "foreignKeyEdge"
>;

export const SQLProviders: SQLProvider[] = [
  {
    provider: "SQLServer",
    dataTypeList: [
      // Exact numerics
      {
        type: "bigint",
        params: [],
        inputType: "number",
        hasIdentitySpecification: true,
      },
      {
        type: "int",
        params: [],
        inputType: "number",
        hasIdentitySpecification: true,
      },
      {
        type: "smallint",
        params: [],
        inputType: "number",
        hasIdentitySpecification: true,
      },
      {
        type: "tinyint",
        params: [],
        inputType: "number",
        hasIdentitySpecification: true,
      },
      { type: "bit", params: [], inputType: "number" },
      { type: "decimal", params: [18, 0], inputType: "number" },
      { type: "numeric", params: [18, 0], inputType: "number" },
      { type: "money", params: [], inputType: "number" },
      { type: "smallmoney", params: [], inputType: "number" },

      // Approximate numerics
      { type: "float", params: [53], inputType: "number" },
      { type: "real", params: [], inputType: "number" },

      // Date and time
      { type: "date", params: [], inputType: "date" },
      { type: "datetime", params: [], inputType: "datetime" },
      { type: "smalldatetime", params: [], inputType: "datetime" },
      { type: "datetime2", params: [7], inputType: "datetime" },
      { type: "datetimeoffset", params: [7], inputType: "datetime" },
      { type: "time", params: [7], inputType: "text" },

      // Character strings
      { type: "char", params: [10], inputType: "text" },
      { type: "varchar", params: [255], inputType: "text" },
      { type: "text", params: [], inputType: "text" },

      // Unicode character strings
      { type: "nchar", params: [10], inputType: "text" },
      { type: "nvarchar", params: [255], inputType: "text" },
      { type: "ntext", params: [], inputType: "text" },

      // Binary strings
      { type: "binary", params: [50], inputType: "text" },
      { type: "varbinary", params: [50], inputType: "text" },
      { type: "image", params: [], inputType: "text" },

      // Other data types
      { type: "uniqueidentifier", params: [], inputType: "text" },
      { type: "xml", params: [], inputType: "text" },
      { type: "json", params: [], inputType: "text" },
      { type: "sql_variant", params: [], inputType: "text" },
      { type: "hierarchyid", params: [], inputType: "text" },
      { type: "geometry", params: [], inputType: "text" },
      { type: "geography", params: [], inputType: "text" },
      { type: "rowversion", params: [], inputType: "text" },
      { type: "cursor", params: [], inputType: "text" },
      { type: "table", params: [], inputType: "text" },
    ],
  },
  {
    provider: "MySQL",
    dataTypeList: [
      // Numeric
      {
        type: "tinyint",
        params: [],
        inputType: "number",
        hasIdentitySpecification: true,
      },
      {
        type: "smallint",
        params: [],
        inputType: "number",
        hasIdentitySpecification: true,
      },
      {
        type: "mediumint",
        params: [],
        inputType: "number",
        hasIdentitySpecification: true,
      },
      {
        type: "int",
        params: [],
        inputType: "number",
        hasIdentitySpecification: true,
      },
      {
        type: "bigint",
        params: [],
        inputType: "number",
        hasIdentitySpecification: true,
      },
      { type: "decimal", params: [10, 0], inputType: "number" },
      { type: "numeric", params: [10, 0], inputType: "number" },
      { type: "float", params: [], inputType: "number" },
      { type: "double", params: [], inputType: "number" },
      { type: "bit", params: [1], inputType: "number" },
      { type: "boolean", params: [], inputType: "number" },

      // Date and time
      { type: "date", params: [], inputType: "date" },
      { type: "datetime", params: [0], inputType: "datetime" },
      { type: "timestamp", params: [0], inputType: "datetime" },
      { type: "time", params: [0], inputType: "text" },
      { type: "year", params: [], inputType: "number" },

      // String
      { type: "char", params: [10], inputType: "text" },
      { type: "varchar", params: [255], inputType: "text" },
      { type: "binary", params: [50], inputType: "text" },
      { type: "varbinary", params: [50], inputType: "text" },
      { type: "tinytext", params: [], inputType: "text" },
      { type: "text", params: [], inputType: "text" },
      { type: "mediumtext", params: [], inputType: "text" },
      { type: "longtext", params: [], inputType: "text" },
      { type: "tinyblob", params: [], inputType: "text" },
      { type: "blob", params: [], inputType: "text" },
      { type: "mediumblob", params: [], inputType: "text" },
      { type: "longblob", params: [], inputType: "text" },
      { type: "enum", params: [], inputType: "text" },
      { type: "set", params: [], inputType: "text" },

      // Other
      { type: "json", params: [], inputType: "text" },

      // Spatial
      { type: "geometry", params: [], inputType: "text" },
      { type: "point", params: [], inputType: "text" },
      { type: "linestring", params: [], inputType: "text" },
      { type: "polygon", params: [], inputType: "text" },
    ],
  },
  {
    provider: "PostgreeSQL",
    dataTypeList: [
      // Numeric
      {
        type: "smallint",
        params: [],
        inputType: "number",
        hasIdentitySpecification: true,
      },
      {
        type: "integer",
        params: [],
        inputType: "number",
        hasIdentitySpecification: true,
      },
      {
        type: "bigint",
        params: [],
        inputType: "number",
        hasIdentitySpecification: true,
      },
      { type: "decimal", params: [18, 0], inputType: "number" },
      { type: "numeric", params: [18, 0], inputType: "number" },
      { type: "real", params: [], inputType: "number" },
      { type: "double precision", params: [], inputType: "number" },
      { type: "smallserial", params: [], inputType: "number" },
      { type: "serial", params: [], inputType: "number" },
      { type: "bigserial", params: [], inputType: "number" },
      { type: "money", params: [], inputType: "number" },

      // Character
      { type: "character", params: [10], inputType: "text" },
      { type: "character varying", params: [255], inputType: "text" },
      { type: "text", params: [], inputType: "text" },

      // Binary
      { type: "bytea", params: [], inputType: "text" },

      // Date and time
      { type: "date", params: [], inputType: "date" },
      { type: "timestamp", params: [6], inputType: "datetime" },
      {
        type: "timestamp with time zone",
        params: [6],
        inputType: "datetime",
      },
      { type: "time", params: [6], inputType: "text" },
      { type: "time with time zone", params: [6], inputType: "text" },
      { type: "interval", params: [], inputType: "text" },

      // Boolean
      { type: "boolean", params: [], inputType: "number" },

      // UUID
      { type: "uuid", params: [], inputType: "text" },

      // JSON
      { type: "json", params: [], inputType: "text" },
      { type: "jsonb", params: [], inputType: "text" },

      // Network
      { type: "cidr", params: [], inputType: "text" },
      { type: "inet", params: [], inputType: "text" },
      { type: "macaddr", params: [], inputType: "text" },

      // Bit string
      { type: "bit", params: [1], inputType: "text" },
      { type: "bit varying", params: [255], inputType: "text" },

      // Geometric
      { type: "point", params: [], inputType: "text" },
      { type: "line", params: [], inputType: "text" },
      { type: "lseg", params: [], inputType: "text" },
      { type: "box", params: [], inputType: "text" },
      { type: "path", params: [], inputType: "text" },
      { type: "polygon", params: [], inputType: "text" },
      { type: "circle", params: [], inputType: "text" },

      // XML
      { type: "xml", params: [], inputType: "text" },
    ],
  },
];

export interface ColumnDataType {
  type: string;
  params: number[];
  inputType: "text" | "number" | "date" | "datetime";
  hasIdentitySpecification?: boolean;
}

export const RELATIONSHIP_TYPES = ["1 - N", "N - 1", "1 - 1", "N - N"];

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const REFERENTIAL_ACTIONS = [
  "noAction",
  "cascade",
  "setNull",
  "setDefault",
];

export type ReferentialAction = (typeof REFERENTIAL_ACTIONS)[number];

/**
 * Style marching ants for selecting node (current = -16)
 */
export const marchingAntsBorderStyle = keyframes`
  to {
    stroke-dashoffset: -16;
  }
`;
