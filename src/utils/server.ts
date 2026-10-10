import { routing } from "../i18n/routing";
import { DiagramRow, EdgeRow, NodeRow } from "../types/data/DiagramRow";
import { DiagramDTO, EdgeDTO, NodeDTO } from "../types/model/DiagramData";

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
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_PATTERN.test(value);

const toDate = (value: string | null) => (value ? new Date(value) : undefined);

export function toDiagramDTO(row: DiagramRow): DiagramDTO {
  return {
    diagram_oid: row.id,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    isPrivate: row.is_private,
    owner_oid: row.owner_id,
    providerName: row.provider,
    title: row.title,
    shares: row.shares ?? [],
  };
}

export function toNodeDTO(row: NodeRow): NodeDTO {
  return {
    id: row.flow_id,
    node_oid: row.id,
    diagram_oid: row.diagram_id,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    position: row.position,
    index: row.index,
    data: row.data,
  };
}

export function toEdgeDTO(row: EdgeRow): EdgeDTO {
  return {
    id: row.flow_id,
    edge_oid: row.id,
    diagram_oid: row.diagram_id,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    source: row.source,
    sourceHandle: row.source_handle,
    target: row.target,
    targetHandle: row.target_handle,
    index: row.index,
    color: row.color,
    relationType: row.relation_type,
    relationshipName: row.relationship_name,
    isAutoNaming: row.is_auto_naming,
    referentialActionForUpdate: row.referential_action_for_update,
    referentialActionForDelete: row.referential_action_for_delete,
    targetSelectedPrimaryOrUniqueId: row.target_selected_primary_or_unique_id,
    sourceColumnIds: row.source_column_ids ?? [],
  };
}

// Nodes/edges are identified by (diagram_id, flow_id), the id the flow uses on the client.
// `id` is left out so an upsert keeps the existing row id (default only on insert).
export function toNodeRow(node: NodeDTO, diagramId: string) {
  return {
    diagram_id: diagramId,
    flow_id: node.id,
    position: node.position,
    index: node.index,
    data: node.data,
    updated_at: new Date().toISOString(),
  };
}

export function toEdgeRow(edge: EdgeDTO, diagramId: string) {
  return {
    diagram_id: diagramId,
    flow_id: edge.id,
    source: edge.source,
    source_handle: edge.sourceHandle ?? null,
    target: edge.target,
    target_handle: edge.targetHandle ?? null,
    index: edge.index,
    color: edge.color,
    relation_type: edge.relationType,
    relationship_name: edge.relationshipName,
    is_auto_naming: edge.isAutoNaming,
    referential_action_for_update: edge.referentialActionForUpdate,
    referential_action_for_delete: edge.referentialActionForDelete,
    target_selected_primary_or_unique_id: edge.targetSelectedPrimaryOrUniqueId,
    source_column_ids: edge.sourceColumnIds,
    updated_at: new Date().toISOString(),
  };
}
//#endregion
