"use client";

import { SessionProvider } from "next-auth/react";
import HeaderToggle from "@/src/components/layout/HeaderToggle";
import { EmotionProvider } from "@/src/components/provider/EmotionProvider";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import LoaderProvider from "./LoaderProvider";
import { SnackbarProvider } from "notistack";
import { grey } from "@mui/material/colors";
import DrawingProvider from "./DrawingProvider";
import { ReactFlowProvider } from "@xyflow/react";
import { ScrollTargetsProvider } from "./ScrollTargetProvider";

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
          <LoaderProvider>
            <SnackbarProvider maxSnack={3}>
              <ReactFlowProvider>
                <ScrollTargetsProvider>
                  <DrawingProvider>
                    <HeaderToggle locale={locale}>{children}</HeaderToggle>
                  </DrawingProvider>
                </ScrollTargetsProvider>
              </ReactFlowProvider>
            </SnackbarProvider>
          </LoaderProvider>
        </ThemeProvider>
      </EmotionProvider>
    </SessionProvider>
  );
}
