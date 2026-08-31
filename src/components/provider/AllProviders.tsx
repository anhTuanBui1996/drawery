"use client";

import { SessionProvider } from "next-auth/react";
import HeaderToggle from "@/src/components/layout/HeaderToggle";
import { EmotionProvider } from "@/src/components/provider/EmotionProvider";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import LoaderProvider from "./LoaderProvider";
import { SnackbarProvider } from "notistack";
import { grey } from "@mui/material/colors";

const theme = createTheme({
  colorSchemes: {
    dark: true,
    light: true,
  },
  defaultColorScheme: "light",
  palette: {
    secondary: {
      main: grey[700],
    },
  },
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
          <SnackbarProvider maxSnack={3}>
            <HeaderToggle locale={locale}>
              <LoaderProvider>{children}</LoaderProvider>
            </HeaderToggle>
          </SnackbarProvider>
        </ThemeProvider>
      </EmotionProvider>
    </SessionProvider>
  );
}
