"use client";

import { Backdrop, LinearProgress } from "@mui/material";

export default function BackgroundLoading() {
  return (
    <LinearProgress
      color="info"
      sx={{ position: "fixed", bottom: 0, width: "100vw" }}
    />
  );
}
