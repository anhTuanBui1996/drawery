"use client";

import { Box } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";

export default function Template({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const s = useColorScheme();
  return (
    <Box
      sx={{
        bgcolor: s.mode === "light" ? "#f9fafb" : "#313131",
      }}
    >
      {children}
    </Box>
  );
}
