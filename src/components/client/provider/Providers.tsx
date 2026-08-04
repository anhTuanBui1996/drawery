"use client";

import { SessionProvider } from "next-auth/react";
import HeaderToggle from "@/src/components/client/layout/HeaderToggle";
import { EmotionProvider } from "@/src/components/client/provider/EmotionProvider";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  colorSchemes: {
    dark: true,
    light: true,
  },
  defaultColorScheme: "light",
});

export function Providers({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <EmotionProvider>
        <ThemeProvider theme={theme} defaultMode="light">
          <HeaderToggle locale={locale}>{children}</HeaderToggle>
        </ThemeProvider>
      </EmotionProvider>
    </SessionProvider>
  );
}
