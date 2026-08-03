"use client";

import React from "react";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { usePathname } from "next/navigation";
import AppHeader from "./AppHeader";
import DrawHeader from "./DrawHeader";
import { styled } from "@mui/material/styles";

const drawerWidth = 240;

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })<{
  open?: boolean;
}>(({ theme }) => ({
  flexGrow: 1,
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        transition: theme.transitions.create("margin", {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: 0,
      },
    },
  ],
}));

export default function HeaderToggle({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isInSigninOrSignupPage =
    pathname === `/${locale}/signin` || pathname === `/${locale}/signup`;
  const isInIndexPage = pathname === `/${locale}`;
  const isInDrawingPage = pathname.endsWith("/drawing");
  const isShowHeader = !isInSigninOrSignupPage && !isInIndexPage;

  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const cache = React.useMemo(() => {
    const c = createCache({ key: "mui", prepend: true });
    c.compat = true;
    return c;
  }, []);
  return (
    <CacheProvider value={cache}>
      {isShowHeader &&
        (isInDrawingPage ? (
          <DrawHeader
            open={open}
            handleDrawerOpen={handleDrawerOpen}
            handleDrawerClose={handleDrawerClose}
            sideMenuWidth={drawerWidth}
          />
        ) : (
          <AppHeader
            open={open}
            handleDrawerOpen={handleDrawerOpen}
            handleDrawerClose={handleDrawerClose}
            sideMenuWidth={drawerWidth}
            locale={locale}
          />
        ))}
      <Main open={open} lang={locale}>
        {children}
      </Main>
    </CacheProvider>
  );
}
