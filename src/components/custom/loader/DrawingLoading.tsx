"use client";

import { Tooltip } from "@mui/material";
import { useTranslations } from "next-intl";
import { CloudSyncIcon } from "../icon/CloudSync";
import { CircleCheckIcon } from "../icon/CircleCheck";
import { useDrawingSyncingStatus } from "../../provider/DrawingProvider";

export default function DrawingLoading() {
  const t = useTranslations("DrawingHeader");
  const isSyncing = useDrawingSyncingStatus();

  return (
    <Tooltip title={t(isSyncing ? "syncing" : "done")}>
      <span>{isSyncing ? <CloudSyncIcon /> : <CircleCheckIcon />}</span>
    </Tooltip>
  );
}
