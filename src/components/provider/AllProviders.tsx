"use client";

import { SessionProvider } from "next-auth/react";
import HeaderToggle from "@/src/components/custom/layout/HeaderToggle";
import { EmotionProvider } from "@/src/components/provider/EmotionProvider";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import LoaderProvider from "./LoaderProvider";
import { SnackbarProvider } from "notistack";
import { grey } from "@mui/material/colors";
import DrawingProvider from "./DrawingProvider";
import { ReactFlowProvider } from "@xyflow/react";
import { ScrollTargetsProvider } from "./ScrollTargetProvider";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import type {} from "@mui/x-date-pickers/themeAugmentation";

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
  components: {
    MuiDatePicker: {
      defaultProps: {
        displayWeekNumber: true,
      },
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
    <SessionProvider refetchOnWindowFocus={true} refetchInterval={5 * 60}>
      <EmotionProvider>
        <ThemeProvider theme={theme} defaultMode="light">
          <LocalizationProvider dateAdapter={AdapterMoment}>
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
          </LocalizationProvider>
        </ThemeProvider>
      </EmotionProvider>
    </SessionProvider>
  );
}
