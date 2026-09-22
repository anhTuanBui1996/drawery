"use client";

import {
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { styled, useColorScheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import VerifiedUserSharpIcon from "@mui/icons-material/VerifiedUserSharp";
import DashboardSharpIcon from "@mui/icons-material/DashboardSharp";
import LogoutIcon from "@mui/icons-material/Logout";
import {
  Avatar,
  Button,
  Menu,
  MenuItem,
  MenuList,
  TextField,
  Tooltip,
} from "@mui/material";
import AppLogo from "../layout/AppLogo";
import { getPathname, Link } from "@/src/i18n/navigation";
import { InfoIcon } from "lucide-react";
import LanguageSelector from "../layout/LanguageSelector";
import SwitchTheme from "../layout/SwitchTheme";
import Swal from "sweetalert2";
import { enqueueSnackbar } from "notistack";
import { useLocale, useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import {
  useDrawingDiagramInfo,
  useDrawingLoadingStatus,
  useDrawingUpdateTitle,
} from "../../provider/DrawingProvider";
import { FaEdit, FaPlus } from "react-icons/fa";
import { useNodes, useReactFlow } from "@xyflow/react";
import { NodeRelationEdge, TableNodeData } from "@/src/types/model/TableNode";
import { nanoid } from "nanoid";
import TableListItem from "../drawing/TableListItem";
import { getRandomMuiColor } from "@/src/utils/client";
import { drawingHeaderBaseWidth } from "../layout/HeaderToggle";
import { move } from "@dnd-kit/helpers";
import { DragDropProvider } from "@dnd-kit/react";
import DiagramMenu from "../drawing/DiagramMenu";

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
  drawerwidth?: number;
}

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

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

export default function DrawingHeaderBar({
  sideMenuWidth = drawingHeaderBaseWidth,
}: {
  sideMenuWidth?: number;
}) {
  const locale = useLocale();
  const colorScheme = useColorScheme();
  const { data: session } = useSession();
  const t = useTranslations("DrawingHeader");

  const isDiagramLoading = useDrawingLoadingStatus();
  const diagramInfo = useDrawingDiagramInfo();
  const updateDiagramTitle = useDrawingUpdateTitle();

  const { addNodes, screenToFlowPosition } = useReactFlow<
    TableNodeData,
    NodeRelationEdge
  >();
  const currentNodes = useNodes<TableNodeData>();
  const sortedNodes = useMemo(
    () => [...currentNodes].sort((a, b) => a.data.index - b.data.index),
    [currentNodes],
  );

  const [isEditTitle, setIsEditTitle] = useState<Boolean>(false);
  const [currenTitle, setCurrentTitle] = useState<string>("");
  const titleRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const tableDragAndDropContainer = useRef<HTMLDivElement | null>(null);
  const { setNodes } = useReactFlow<TableNodeData, NodeRelationEdge>();

  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  useEffect(() => {
    setCurrentTitle(diagramInfo?.title || "");
  }, [diagramInfo?.title]);

  useEffect(() => {
    if (isEditTitle) {
      titleRef.current?.focus();
    }
  }, [isEditTitle]);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  const handleSignOut = async () => {
    signOut({ callbackUrl: getPathname({ href: "/signin", locale }) })
      .then(() => {
        enqueueSnackbar({
          variant: "success",
          message: t("logOutSuccessfully"),
        });
      })
      .catch((err) => {
        console.error("Sign out error", err);
        Swal.fire({ title: t("alertErrorTitle"), text: t("alertError") });
      });
  };

  const handleOpenEditTitle = () => {
    setIsEditTitle(true);
  };
  const handleChangeTitle = (
    e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    setCurrentTitle(e.target.value);
  };
  const handleCancelEditTitle = () => {
    setCurrentTitle(diagramInfo?.title || "");
    setIsEditTitle(false);
  };
  const handleSubmitEditTitleByEnter = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      setIsEditTitle(false);
      submitEditTitle();
    } else if (e.key === "Escape") {
      handleCancelEditTitle();
    }
  };
  const submitEditTitle = () => {
    if (
      currenTitle &&
      currenTitle !== diagramInfo?.title &&
      diagramInfo?.diagramId &&
      updateDiagramTitle
    ) {
      updateDiagramTitle(diagramInfo?.diagramId, currenTitle)
        .then(() => {
          enqueueSnackbar({
            variant: "success",
            message: t("updateTitleSuccessfully"),
          });
        })
        .catch((err) => {
          console.error("Update diagram title error", err);
          Swal.fire({ title: t("alertErrorTitle"), text: t("alertError") });
        });
    }
  };

  const handleAddNewTable = () => {
    if (diagramInfo) {
      const randomOffsetX = (Math.random() - 0.5) * 200; // lệch ngẫu nhiên trong khoảng ±200px
      const randomOffsetY = (Math.random() - 0.5) * 200;

      const position = screenToFlowPosition({
        x: window.innerWidth / 2 - 300 + randomOffsetX,
        y: window.innerHeight / 2 - 300 + randomOffsetY,
      });

      const newTableId = "table_" + nanoid();
      const firstColumnName = "ID";
      const firstColumnId = "column_" + nanoid();
      const newNode: TableNodeData = {
        id: newTableId,
        position,
        type: "tableNode",
        dragHandle: ".drag-header-handle",
        data: {
          diagramId: diagramInfo.diagramId,
          index: currentNodes.length,
          color: getRandomMuiColor(),
          tableName: `${t("tableInTableName")}_${currentNodes.length}`,
          columns: {
            [firstColumnId]: {
              columnName: firstColumnName,
              dataType: {
                type: "int",
                params: [],
                inputType: "number",
              },
              isNullable: false,
              identity: {
                seed: 1,
                increment: 1,
              },
            },
          },
          keys: {
            primaryKey: {
              keyName: `PK_${t("tableInTableName")}_${currentNodes.length}`,
              columnIds: [{ columnId: firstColumnId, sortType: "asc" }],
              isUnique: true,
            },
          },
        },
      };
      addNodes(newNode);

      // Thêm đoạn này để tự động cuộn xuống dưới cùng sau khi node được thêm vào DOM
      setTimeout(() => {
        if (tableDragAndDropContainer.current) {
          tableDragAndDropContainer.current.scrollTo({
            top: tableDragAndDropContainer.current.scrollHeight,
            behavior: "smooth", // Cuộn mượt mà
          });
        }
      }, 100); // Delay nhẹ một chút để chờ React render phần tử mới vào DOM
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        open
        drawerwidth={sideMenuWidth}
        sx={{
          backgroundImage:
            colorScheme.mode === "light"
              ? "linear-gradient(135deg, #b8d0de 0%, #c1c6cd 50%, #77bff1 100%)"
              : "linear-gradient(135deg, #2e4a83 0%, #2f4975 50%, #06b6d4 100%)",
        }}
      >
        <Toolbar>
          <Box
            sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 2 }}
          >
            <TextField
              value={currenTitle}
              placeholder={t("noTitle")}
              onChange={handleChangeTitle}
              onBlur={handleCancelEditTitle}
              onKeyDown={handleSubmitEditTitleByEnter}
              inputRef={titleRef}
              variant="standard"
              disabled={!isEditTitle}
            />
            {!isEditTitle && (
              <IconButton
                disabled={!diagramInfo || isDiagramLoading}
                onClick={handleOpenEditTitle}
                sx={{ paddingTop: "4px" }}
              >
                <FaEdit size="20px" />
              </IconButton>
            )}
          </Box>
          <Box
            sx={{
              flexGrow: 1,
              justifyContent: "right",
              display: "flex",
              gap: 2,
            }}
          >
            <LanguageSelector />
            <SwitchTheme hasBackground={false} />
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
                <MenuItem onClick={handleCloseUserMenu}>
                  <Link
                    href={`/dashboard`}
                    style={{
                      display: "flex",
                      textDecoration: "none",
                      color: "inherit",
                      flexWrap: "nowrap",
                      flexDirection: "row",
                    }}
                  >
                    <ListItemIcon>
                      <DashboardSharpIcon />
                    </ListItemIcon>
                    <Typography sx={{ textAlign: "center" }}>
                      {t("dashboard")}
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
          },
        }}
        hideBackdrop
        slotProps={{
          paper: {
            sx: {
              backgroundImage:
                colorScheme.mode === "light"
                  ? "linear-gradient(135deg, #77bff1 0%, #c1c6cd 20%, #a8e3ff 100%)"
                  : "linear-gradient(135deg, #12899d 0%, #2f4975 20%, #2d4ca2 100%)",
            },
          },
        }}
        variant="permanent"
        anchor="left"
        open={true}
      >
        <DrawerHeader
          sx={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" noWrap component="div" mr={2}>
            <AppLogo />
          </Typography>
          <DiagramMenu diagramId={diagramInfo?.diagramId} />
        </DrawerHeader>
        <Button
          startIcon={<FaPlus size={12} />}
          variant="contained"
          sx={{ m: 2 }}
          onClick={handleAddNewTable}
        >
          <Typography fontSize={12} fontWeight={600} component={"strong"}>
            {t("addNewTable")}
          </Typography>
        </Button>
        <Divider />
        <List
          component={"div"}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            height: "calc(100vh - 64px + 30px + 1px)",
            overflowY: "auto",
            px: "5px",
            gap: "10px",
          }}
          ref={tableDragAndDropContainer}
        >
          <DragDropProvider
            onDragEnd={(e) => {
              setNodes((nodes: TableNodeData[]) => {
                return move(nodes, e);
              });
            }}
          >
            {sortedNodes.map(({ selected, data, id }, index) => (
              <TableListItem
                key={id}
                id={id}
                index={index}
                color={data.color}
                tableName={data.tableName}
                columns={data.columns}
                selected={selected}
              />
            ))}
          </DragDropProvider>
        </List>
      </Drawer>
    </Box>
  );
}
