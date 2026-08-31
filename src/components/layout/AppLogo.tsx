"use client";

import { Link } from "@/src/i18n/navigation";
import { Box, Typography } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { useSession } from "next-auth/react";
import Image from "next/image";
import React from "react";

export default function AppLogo({
  isRedirectToIndex,
  hasBackground,
}: {
  isRedirectToIndex?: boolean;
  hasBackground?: boolean;
}): React.JSX.Element {
  const s = useColorScheme();
  return (
    <Link href={`${isRedirectToIndex ? "/" : "/dashboard"}`}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          height: "100%",
          borderRadius: 3,
          px: 2,
          bgcolor: hasBackground ? "background.paper" : undefined,
          transition: "all 0.3s",
          "&:hover": {
            transform: hasBackground ? "translateY(-2px)" : undefined,
            boxShadow: hasBackground ? 4 : undefined,
          },
        }}
      >
        <Image
          src={s.mode === "dark" ? "/logo_white.ico" : "/logo_black.ico"}
          alt="logo"
          style={{ width: "32px", height: "32px" }}
          width={32}
          height={32}
        />{" "}
        <Typography
          color="textPrimary"
          variant="subtitle1"
          component="span"
          fontFamily="cursive"
        >
          DraWery
        </Typography>
      </Box>
    </Link>
  );
}
