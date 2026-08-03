"use client";

import { Backdrop, CircularProgress } from "@mui/material";

export default function GlobalLoading() {
  return (
    <Backdrop
      sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
      open
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
}
