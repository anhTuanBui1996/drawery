"use client";

import React from "react";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { usePathname } from "@/src/i18n/navigation";
import AppHeader from "../custom/header/AppHeader";
import DrawHeader from "../custom/header/DrawHeader";
import { styled } from "@mui/material/styles";
import PublicHeader from "../custom/header/PublicHeader";

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
  const isInPublicPages =
    pathname === `/${locale}/signin` ||
    pathname === `/${locale}/signup` ||
    pathname === `/${locale}/privacy` ||
    pathname === `/${locale}/eula` ||
    pathname === `/signin` ||
    pathname === `/signup` ||
    pathname === `/privacy` ||
    pathname === `/eula`;
  const isInIndexPage = pathname === `/${locale}` || pathname === `/`;
  const isInDrawingPage = pathname.endsWith("/drawing");
  const isShowPrivateHeader = !isInPublicPages && !isInIndexPage;

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
      {isShowPrivateHeader ? (
        isInDrawingPage ? (
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
        )
      ) : (
        <PublicHeader />
      )}
      <Main
        open={open}
        lang={locale}
        style={{
          paddingTop: isInPublicPages ? "0" : "64px",
        }}
      >
        {children}
      </Main>
    </CacheProvider>
  );
}
