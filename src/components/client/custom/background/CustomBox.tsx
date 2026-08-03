"use client";

import { Box } from "@mui/material";
import { SxProps, Theme } from "@mui/material/styles";
import { useColorScheme } from "@mui/material/styles";

export default function CustomBox({
  children,
  sx,
}: Readonly<{
  children: React.ReactNode;
  sx?: SxProps<Theme> | undefined;
}>) {
  const s = useColorScheme();
  return (
    <Box
      sx={{
        ...sx,
        background:
          s.mode === "light"
            ? "linear-gradient(135deg, #a8e3ff 0%, #c1c6cd 50%, #77bff1 100%)"
            : "linear-gradient(135deg, #aabdf3 0%, #2f4975 50%, #06b6d4 100%)",
      }}
    >
      {children}
    </Box>
  );
}
