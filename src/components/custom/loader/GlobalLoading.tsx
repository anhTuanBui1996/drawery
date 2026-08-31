"use client";

import { Backdrop, CircularProgress } from "@mui/material";
import { useLoader } from "../../provider/LoaderProvider";

export default function GlobalLoading({ open }: { open: boolean }) {
  const loaderContext = useLoader();
  return (
    <Backdrop
      sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
      open={loaderContext?.isLoading || open}
    >
      <CircularProgress color="inherit" sx={{ marginRight: "20px" }} />
      {loaderContext?.text}
    </Backdrop>
  );
}
