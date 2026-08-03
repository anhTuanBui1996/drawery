"use client";

import { Link } from "@/src/i18n/navigation";
import { Typography } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import Image from "next/image";
import React from "react";

export default function AppLogo(): React.JSX.Element {
  const s = useColorScheme();
  return (
    <Link
      href={"/dashboard"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        cursor: "pointer",
      }}
    >
      <Image
        src={s.mode === "dark" ? "/logo_white.ico" : "/logo_black.ico"}
        alt="logo"
        style={{ width: "32px", height: "32px" }}
        width={32}
        height={32}
      />{" "}
      <Typography color="textPrimary" variant="subtitle1" component="strong" fontFamily="cursive">
        DraWery
      </Typography>
    </Link>
  );
}
