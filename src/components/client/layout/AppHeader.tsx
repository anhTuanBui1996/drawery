"use client";

import * as React from "react";
import { styled, useColorScheme, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import AppLogo from "./AppLogo";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import InfoIcon from "@mui/icons-material/Info";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DashboardIcon from "@mui/icons-material/Dashboard";
import VerifiedUserSharpIcon from "@mui/icons-material/VerifiedUserSharp";
import { Avatar, Menu, MenuItem, MenuList, Tooltip } from "@mui/material";
import { signOut, useSession } from "next-auth/react";
import { getPathname, usePathname } from "@/src/i18n/navigation";
import { Link } from "@/src/i18n/navigation";
import { useTranslations } from "next-intl";
import SwitchTheme from "./SwitchTheme";
import LanguageSelector from "./LanguageSelector";

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
  drawerwidth?: number;
}

const menuItems = [
  { name: "dashboard", icon: <DashboardIcon />, href: "/dashboard" },
  { name: "about", icon: <InfoIcon />, href: "/" },
];

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, drawerwidth }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        width: `calc(100% - ${drawerwidth}px)`,
        marginLeft: `${drawerwidth}px`,
        transition: theme.transitions.create(["margin", "width"], {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}));

const AppHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

export default function ApplicationHeaderBar({
  open,
  handleDrawerOpen,
  handleDrawerClose,
  sideMenuWidth = 240,
  locale,
}: {
  open: boolean;
  handleDrawerOpen: () => void;
  handleDrawerClose: () => void;
  sideMenuWidth?: number;
  locale: string;
}) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const { data: session } = useSession();
  const t = useTranslations("AppHeader");
  const pathname = usePathname();

  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null,
  );

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleSignOut = async () => {
    signOut({ callbackUrl: getPathname({ href: "/signin", locale }) });
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        sx={{
          backgroundImage:
            colorScheme.mode === "light"
              ? "linear-gradient(135deg, #a8e3ff 0%, #c1c6cd 50%, #77bff1 100%)"
              : "linear-gradient(135deg, #2d4ca2 0%, #2f4975 50%, #06b6d4 100%)",
        }}
        position="fixed"
        open={open}
        drawerwidth={sideMenuWidth}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={[
              {
                mr: 2,
              },
              open && { display: "none" },
            ]}
          >
            <MenuIcon color="action" />
          </IconButton>
          {!open && (
            <Typography variant="h6" noWrap component="div" mr={2}>
              <AppLogo />
            </Typography>
          )}
          <Box sx={{ flexGrow: 1, justifyContent: "right", display: "flex" }}>
            <LanguageSelector />
            <SwitchTheme />
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                {session?.user?.image ? (
                  <Avatar
                    alt={session.user.name || undefined}
                    src={session.user.image}
                  />
                ) : (
                  <Avatar alt={"Avatar"}>
                    {session?.user?.name?.[0] || session?.user?.email?.[0]}
                  </Avatar>
                )}
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuList>
                <MenuItem onClick={handleCloseUserMenu}>
                  <Link
                    href={`/profile`}
                    style={{
                      display: "flex",
                      textDecoration: "none",
                      color: "inherit",
                      flexWrap: "nowrap",
                      flexDirection: "row",
                    }}
                  >
                    <ListItemIcon>
                      <InfoIcon />
                    </ListItemIcon>
                    <Typography sx={{ textAlign: "center" }}>
                      {t("profile")}
                    </Typography>
                  </Link>
                </MenuItem>
                <MenuItem onClick={handleCloseUserMenu}>
                  <Link
                    href={`/account`}
                    style={{
                      display: "flex",
                      textDecoration: "none",
                      color: "inherit",
                      flexWrap: "nowrap",
                      flexDirection: "row",
                    }}
                  >
                    <ListItemIcon>
                      <VerifiedUserSharpIcon />
                    </ListItemIcon>
                    <Typography sx={{ textAlign: "center" }}>
                      {t("account")}
                    </Typography>
                  </Link>
                </MenuItem>
                <MenuItem onClick={handleSignOut}>
                  <ListItemIcon>
                    <LogoutIcon />
                  </ListItemIcon>
                  <Typography sx={{ textAlign: "center" }}>
                    {t("logout")}
                  </Typography>
                </MenuItem>
              </MenuList>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: sideMenuWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: sideMenuWidth,
            boxSizing: "border-box",
            boxShadow: "2px 0px 8px rgba(0,0,0,0.1)",
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <AppHeader sx={{ justifyContent: "space-between" }}>
          {open && (
            <Typography variant="h6" noWrap component="div" mr={2}>
              <AppLogo />
            </Typography>
          )}
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === "ltr" ? (
              <ChevronLeftIcon />
            ) : (
              <ChevronRightIcon />
            )}
          </IconButton>
        </AppHeader>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <Link href={item.href} key={item.name}>
              <ListItem disablePadding>
                <ListItemButton selected={pathname === item.href}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={t(item.name)} />
                </ListItemButton>
              </ListItem>
            </Link>
          ))}
        </List>
      </Drawer>
    </Box>
  );
}
