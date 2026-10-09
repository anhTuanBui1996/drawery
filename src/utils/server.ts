import { ObjectId } from "mongodb";
import { routing } from "../i18n/routing";
import { EdgeDocument, NodeDocument } from "../types/data/DiagramDocument";
import { EdgeDTO, NodeDTO } from "../types/model/DiagramData";

/**
 * Extracts the locale segment from a URL pathname, falling back to the default locale.
 *
 * Reads the first path segment (e.g. "vi" from "/vi/dashboard") and checks it
 * against the configured `routing.locales`. Useful in places like middleware
 * where the current locale must be resolved before rendering (e.g. building
 * a locale-aware redirect URL).
 *
 * @param pathname - The URL pathname to inspect, e.g. "/vi/dashboard" or "/dashboard".
 * @returns The matched locale if the first path segment is a supported locale,
 *          otherwise `routing.defaultLocale`.
 */
export function getLocaleFromPathname(pathname: string) {
  const [, maybeLocale] = pathname.split("/");
  return routing.locales.includes(maybeLocale as any)
    ? maybeLocale
    : routing.defaultLocale;
}

/**
 * Generates a cryptographically secure random integer in the range [0, max).
 * Uses rejection sampling to avoid modulo bias, unlike a plain `% max` approach.
 *
 * Works in any runtime with the Web Crypto API (Edge Runtime, Node.js, browsers).
 *
 * @param max - Exclusive upper bound. Must be a positive integer <= 2^32.
 * @returns A random integer between 0 (inclusive) and max (exclusive).
 */
export function randomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0 || max > 2 ** 32) {
    throw new Error("max must be a positive integer not greater than 2^32");
  }

  // Largest multiple of `max` that fits in a Uint32 range, used to reject
  // values that would otherwise introduce modulo bias.
  const range = 2 ** 32;
  const limit = range - (range % max);

  const array = new Uint32Array(1);
  let value: number;

  do {
    crypto.getRandomValues(array);
    value = array[0];
  } while (value >= limit);

  return value % max;
}

//#region DTO conversion
export function toNodeDTO(node: NodeDocument): NodeDTO {
  return {
    ...node,
    diagram_oid: node.diagramId.toString(),
    node_oid: node._id.toString(),
  };
}

export function toEdgeDTO(edge: EdgeDocument): EdgeDTO {
  return {
    ...edge,
    diagram_oid: edge.diagramId.toString(),
    edge_oid: edge._id.toString(),
  };
}

export function toNodeDocument(node: NodeDTO): NodeDocument {
  const { diagram_oid, node_oid, ...rest } = node;
  return {
    ...rest,
    _id: node.node_oid ? new ObjectId(node.node_oid) : new ObjectId(),
    diagramId: new ObjectId(node.diagram_oid),
    createdAt: node.createdAt || new Date(),
  };
}

export function toEdgeDocument(edge: EdgeDTO): EdgeDocument {
  const { diagram_oid, edge_oid, ...rest } = edge;
  return {
    ...rest,
    _id: edge.edge_oid ? new ObjectId(edge.edge_oid) : new ObjectId(),
    diagramId: new ObjectId(edge.diagram_oid),
    createdAt: edge.createdAt || new Date(),
  };
}
//#endregion;
