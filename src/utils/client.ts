import { SQLProviderName } from "../types/data/DiagramTransfer";
import { SQLProviders } from "../types/model/TableNode";
import * as muiColors from "@mui/material/colors";

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
