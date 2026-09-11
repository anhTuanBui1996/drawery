import { Edge, Node } from "@xyflow/react";
import { ObjectId } from "mongodb";

export interface ColumnProps {
  columnName: string;
  dataType: ColumnDataType; // Kiểu dữ liệu (VD: "VARCHAR", "INT", "BOOLEAN")
  isPrimaryKey?: boolean; // Đánh dấu Khóa chính (PK)
  isForeignKey?: boolean; // Đánh dấu Khóa ngoại (FK)
  isNullable?: boolean; // Cho phép NULL hay không
  isUnique?: boolean; // Đánh dấu UNIQUE
  defaultValue?: string; // Giá trị mặc định nếu có
}

export type TableNodeData = Node<
  {
    _id?: ObjectId;
    diagramId: string;
    index: number;
    color: string;
    tableName: string;
    columns: Record<string, ColumnProps>;
  },
  "tableNode"
>;

export type NodeRelationEdge = Edge<
  {
    diagramId: string;
  },
  "relationEdge"
>;

export type SQLProviderName = "SQLServer" | "MySQL" | "PostgreeSQL";
export interface SQLProvider {
  provider: SQLProviderName;
  dataTypeList: ColumnDataType[];
}
export const SQLProviders: SQLProvider[] = [
  {
    provider: "SQLServer",
    dataTypeList: [
      // Exact numerics
      { type: "bigint", params: [] },
      { type: "int", params: [] },
      { type: "smallint", params: [] },
      { type: "tinyint", params: [] },
      { type: "bit", params: [] },
      { type: "decimal", params: [18, 0] },
      { type: "numeric", params: [18, 0] },
      { type: "money", params: [] },
      { type: "smallmoney", params: [] },

      // Approximate numerics
      { type: "float", params: [53] },
      { type: "real", params: [] },

      // Date and time
      { type: "date", params: [] },
      { type: "datetime", params: [] },
      { type: "smalldatetime", params: [] },
      { type: "datetime2", params: [7] },
      { type: "datetimeoffset", params: [7] },
      { type: "time", params: [7] },

      // Character strings
      { type: "char", params: [10] },
      { type: "varchar", params: [255] },
      { type: "text", params: [] },

      // Unicode character strings
      { type: "nchar", params: [10] },
      { type: "nvarchar", params: [255] },
      { type: "ntext", params: [] },

      // Binary strings
      { type: "binary", params: [50] },
      { type: "varbinary", params: [50] },
      { type: "image", params: [] },

      // Other data types
      { type: "uniqueidentifier", params: [] },
      { type: "xml", params: [] },
      { type: "json", params: [] },
      { type: "sql_variant", params: [] },
      { type: "hierarchyid", params: [] },
      { type: "geometry", params: [] },
      { type: "geography", params: [] },
      { type: "rowversion", params: [] },
      { type: "cursor", params: [] },
      { type: "table", params: [] },
    ],
  },
  {
    provider: "MySQL",
    dataTypeList: [
      // Numeric
      { type: "tinyint", params: [] },
      { type: "smallint", params: [] },
      { type: "mediumint", params: [] },
      { type: "int", params: [] },
      { type: "bigint", params: [] },
      { type: "decimal", params: [10, 0] },
      { type: "numeric", params: [10, 0] },
      { type: "float", params: [] },
      { type: "double", params: [] },
      { type: "bit", params: [1] },
      { type: "boolean", params: [] },

      // Date and time
      { type: "date", params: [] },
      { type: "datetime", params: [0] },
      { type: "timestamp", params: [0] },
      { type: "time", params: [0] },
      { type: "year", params: [] },

      // String
      { type: "char", params: [10] },
      { type: "varchar", params: [255] },
      { type: "binary", params: [50] },
      { type: "varbinary", params: [50] },
      { type: "tinytext", params: [] },
      { type: "text", params: [] },
      { type: "mediumtext", params: [] },
      { type: "longtext", params: [] },
      { type: "tinyblob", params: [] },
      { type: "blob", params: [] },
      { type: "mediumblob", params: [] },
      { type: "longblob", params: [] },
      { type: "enum", params: [] },
      { type: "set", params: [] },

      // Other
      { type: "json", params: [] },

      // Spatial
      { type: "geometry", params: [] },
      { type: "point", params: [] },
      { type: "linestring", params: [] },
      { type: "polygon", params: [] },
    ],
  },
  {
    provider: "PostgreeSQL",
    dataTypeList: [
      // Numeric
      { type: "smallint", params: [] },
      { type: "integer", params: [] },
      { type: "bigint", params: [] },
      { type: "decimal", params: [18, 0] },
      { type: "numeric", params: [18, 0] },
      { type: "real", params: [] },
      { type: "double precision", params: [] },
      { type: "smallserial", params: [] },
      { type: "serial", params: [] },
      { type: "bigserial", params: [] },
      { type: "money", params: [] },

      // Character
      { type: "character", params: [10] },
      { type: "character varying", params: [255] },
      { type: "text", params: [] },

      // Binary
      { type: "bytea", params: [] },

      // Date and time
      { type: "date", params: [] },
      { type: "timestamp", params: [6] },
      { type: "timestamp with time zone", params: [6] },
      { type: "time", params: [6] },
      { type: "time with time zone", params: [6] },
      { type: "interval", params: [] },

      // Boolean
      { type: "boolean", params: [] },

      // UUID
      { type: "uuid", params: [] },

      // JSON
      { type: "json", params: [] },
      { type: "jsonb", params: [] },

      // Network
      { type: "cidr", params: [] },
      { type: "inet", params: [] },
      { type: "macaddr", params: [] },

      // Bit string
      { type: "bit", params: [1] },
      { type: "bit varying", params: [255] },

      // Geometric
      { type: "point", params: [] },
      { type: "line", params: [] },
      { type: "lseg", params: [] },
      { type: "box", params: [] },
      { type: "path", params: [] },
      { type: "polygon", params: [] },
      { type: "circle", params: [] },

      // XML
      { type: "xml", params: [] },
    ],
  },
];
export function getDataTypeList(providerName: SQLProviderName) {
  return SQLProviders.find((p) => p.provider === providerName);
}

export interface ColumnDataType {
  type: string;
  params: number[];
}

export interface ColumnDataType {
  type: string;
  params: number[];
}
