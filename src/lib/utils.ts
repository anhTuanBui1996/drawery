import { routing } from "@/src/i18n/routing";
import { EdgeDocument, NodeDocument } from "../types/data/DiagramTransfer";
import { NodeRelationEdge, TableNodeData } from "../types/model/TableNode";
import * as muiColors from "@mui/material/colors";
import { keyframes } from "@emotion/react";

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

export function toTableNodeData(node: NodeDocument): TableNodeData {
  return {
    id: node.id,
    position: node.position,
    type: "tableNode",
    data: {
      ...node.data,
      _id: node._id,
      index: node.index,
      diagramId: node.diagramId.toString(),
    },
  };
}

export function toNodeDocument(
  sourceDocument: NodeDocument,
  newNode: TableNodeData,
): NodeDocument {
  return {
    ...sourceDocument,
    data: {
      ...newNode.data,
    },
    position: newNode.position,
  };
}

export function toNodeRelationEdge(edge: EdgeDocument): NodeRelationEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
  };
}

export function toEdgeDocument(
  sourceDocument: EdgeDocument,
  newEdge: NodeRelationEdge,
): EdgeDocument {
  return {
    ...sourceDocument,
    id: newEdge.id,
    source: newEdge.source,
    target: newEdge.target,
  };
}

const HUES = [
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

export function getRandomMuiColor(shade: keyof typeof muiColors.red = 500) {
  const hue = HUES[Math.floor(Math.random() * HUES.length)];
  return (muiColors as any)[hue][shade] as string;
}

export const invalidCharRegexInName = new RegExp(/^[a-zA-Z_][a-zA-Z0-9_]*$/);
