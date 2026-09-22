import { NodeRelationEdge, TableNodeData } from "@/src/types/model/TableNode";
import {
  Box,
  Grid,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Paper,
  Select,
} from "@mui/material";
import { useReactFlow } from "@xyflow/react";
import { useTranslations } from "next-intl";
import { MouseEvent, RefObject, useId, useMemo, useState } from "react";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import { getMuiColor, HUES } from "@/src/utils/client";
import { Check } from "@mui/icons-material";

export default function TableItemMenu({
  tableId,
  open,
  anchorEl,
  handleClose,
  isNodeItem,
  tableRef,
}: {
  tableId: string;
  open: boolean;
  anchorEl: HTMLElement | null;
  handleClose: () => void;
  isNodeItem?: boolean;
  tableRef?: RefObject<HTMLDivElement | null>;
}) {
  const id = useId();
  const t = useTranslations("Drawing");
  const { getNode, setNodes, setCenter } = useReactFlow<
    TableNodeData,
    NodeRelationEdge
  >();
  const [colorMenuAnchorEl, setColorMenuAnchorEl] =
    useState<null | HTMLLIElement>(null);
  const colorMenuOpen = Boolean(colorMenuAnchorEl);
  const selectedColor = useMemo<string | undefined>(() => {
    return getNode(tableId)?.data.color;
  }, [tableId]);

  const handleFocusTableInFlow = () => {
    const node = getNode(tableId);
    if (!node) return;

    // Tính tâm của node (position là góc trên-trái, cần cộng thêm nửa width/height)
    const x = node.position.x + (node.measured?.width ?? 0) / 2;
    const y = node.position.y + (node.measured?.height ?? 0) / 2;

    setCenter(x, y, { zoom: 1, duration: 500 }); // duration: có animation mượt
    handleClose();
  };
  const handleOpenTableColorMenu = (
    e: MouseEvent<HTMLLIElement, globalThis.MouseEvent>,
  ) => {
    setColorMenuAnchorEl(e.currentTarget);
  };
  const handleCloseTableColorMenu = () => {
    setColorMenuAnchorEl(null);
  };
  const handleChangeTableTagColor = (newColor: string) => {
    setNodes((nodes: TableNodeData[]) => {
      return nodes.map((node) => {
        if (node.id !== tableId) return node;

        return {
          ...node,
          data: {
            ...node.data,
            color: newColor,
          },
        };
      });
    });
    handleCloseTableColorMenu();
  };
  const handleDeleteTable = () => {
    if (tableRef?.current) {
      const parentContainer = tableRef.current.parentElement;
      // Lấy khoảng gap của flex container (ví dụ: "16px" -> 16)
      const computedGap = parentContainer
        ? parseInt(window.getComputedStyle(parentContainer).gap || "0", 10)
        : 0;
      tableRef.current.style.overflow = "hidden";
      tableRef.current.style.height = `${tableRef.current.offsetHeight}px`; // Cố định height hiện tại trước khi animate về 0

      // Ép trình duyệt nhận giá trị hiện tại trước khi chuyển về 0
      tableRef.current.offsetHeight;

      tableRef.current.style.height = "0px";
      tableRef.current.style.paddingTop = "0px";
      tableRef.current.style.paddingBottom = "0px";
      tableRef.current.style.marginTop = `-${computedGap / 2}px`;
      tableRef.current.style.marginBottom = `-${computedGap / 2}px`;
      tableRef.current.style.opacity = "0";
    }
    setTimeout(() => {
      setNodes((nds) => nds.filter((node) => node.id !== tableId));
    }, 310);
  };

  return (
    <>
      <Menu
        id={id}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            "aria-labelledby": tableId,
          },
        }}
      >
        <MenuItem onClick={handleFocusTableInFlow}>
          <ListItemIcon>
            <CenterFocusStrongIcon />
          </ListItemIcon>
          <ListItemText>{`${t("focusTableIn")} ${isNodeItem ? t("drawerList") : t("flowNode")}`}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenTableColorMenu}>
          <ListItemIcon>
            <ColorLensIcon />
          </ListItemIcon>
          <ListItemText>{`${t("changeColor")}`}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteTable}>
          <ListItemIcon>
            <DeleteForeverIcon />
          </ListItemIcon>
          <ListItemText>{`${t("deleteTable")}`}</ListItemText>
        </MenuItem>
      </Menu>
      <Menu
        open={colorMenuOpen}
        anchorEl={colorMenuAnchorEl}
        onClose={handleCloseTableColorMenu}
        anchorOrigin={{
          horizontal: "right",
          vertical: "top",
        }}
        slotProps={{
          list: {
            sx: { py: 0 },
          },
        }}
      >
        <Grid container width="300px">
          {Object.values(HUES).map((c) => (
            <Grid
              key={c}
              sx={{ backgroundColor: getMuiColor(c, 500) }}
              size={2}
            >
              <IconButton
                sx={{
                  justifyContent: "center",
                  borderRadius: 0,
                  width: "100%",
                  height: "36px",
                }}
                onClick={() => handleChangeTableTagColor(getMuiColor(c, 500))}
              >
                {selectedColor === getMuiColor(c, 500) && (
                  <Check fontSize="small" />
                )}
              </IconButton>
            </Grid>
          ))}
        </Grid>
      </Menu>
    </>
  );
}
