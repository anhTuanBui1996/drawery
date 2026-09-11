"use client";

import {
  ColumnProps,
  NodeRelationEdge,
  TableNodeData,
} from "@/src/types/model/TableNode";
import {
  Box,
  Collapse,
  IconButton,
  keyframes,
  List,
  ListItemButton,
  Paper,
  TextField,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  ChangeEvent,
  KeyboardEvent,
  MouseEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ExpandLess,
  ExpandMore,
  DragIndicator,
  PlusOne,
} from "@mui/icons-material";
import { useReactFlow } from "@xyflow/react";
import { useTranslations } from "next-intl";
import { nanoid } from "nanoid";
import { invalidCharRegexInName } from "@/src/lib/utils";
import ColumnItem from "./ColumnItem";
import { useScrollTargets } from "../../provider/ScrollTargetProvider";
const marchingAntsBorderStyle = keyframes`
  to {
    stroke-dashoffset: -14;
  }
`;

export default function TableListItem({
  id,
  index,
  color,
  tableName,
  columns,
  selected,
}: {
  id: string;
  index: number;
  color: string;
  tableName: string;
  columns: Record<string, ColumnProps>;
  selected?: boolean;
}) {
  const t = useTranslations("Drawing");
  const theme = useTheme();
  const dragIconColor = useMemo(() => {
    return theme.palette.getContrastText(color);
  }, [color]);
  const [isShowColumns, setShowColumns] = useState<boolean>(true);
  const [isEditingTableName, setEditingTableName] = useState<boolean>(false);
  const [editingTableNameInvalid, setEditingTableNameInvalid] = useState<{
    isInvalid: boolean;
    message?: string;
  }>({ isInvalid: false });
  const [editingColumnNameState, setEditingColumnNameState] = useState<
    Record<string, { isEditing: boolean; isInvalid: boolean; message?: string }>
  >(
    Object.fromEntries(
      Object.keys(columns).map((key) => [
        key,
        { isEditing: false, isInvalid: false },
      ]),
    ),
  );
  const { setNodes, getNode, setCenter, getNodes } = useReactFlow<
    TableNodeData,
    NodeRelationEdge
  >();
  const tableNameEditor = useRef<HTMLInputElement | null>(null);
  const { register, unregister } = useScrollTargets();

  const handleChangeTableTagColor = (newColor: string) => {
    setNodes((nodes: TableNodeData[]) => {
      return nodes.map((node) => {
        if (node.id !== id) return node;

        return {
          ...node,
          data: {
            ...node.data,
            color: newColor,
          },
        };
      });
    });
  };
  const handleClickToggleCollapseColumns = () => {
    setShowColumns(!isShowColumns);
  };
  const handleOpenTableNameEditor = (
    e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>,
  ) => {
    e.stopPropagation();
    setEditingTableName(true);
    editingTableNameInvalid.isInvalid &&
      setEditingTableNameInvalid({ isInvalid: false });
  };
  const handleCloseTableNameEditorByBlur = () => {
    setEditingTableName(false);
    editingTableNameInvalid.isInvalid &&
      setEditingTableNameInvalid({ isInvalid: false });
  };
  const handleCloseTableNameEditorByKey = (
    e: KeyboardEvent<HTMLDivElement>,
  ) => {
    if (e.key === "Enter" || e.key === "Escape") {
      tableNameEditor.current?.blur();
    }
  };
  const handleChangeTableName = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!e.target.value) {
      setEditingTableNameInvalid({
        isInvalid: true,
        message: t("notAllowEmpty"),
      });
      return;
    } else if (e.target.value.includes(" ")) {
      setEditingTableNameInvalid({
        isInvalid: true,
        message: t("notAllowSpace"),
      });
      return;
    } else if (!invalidCharRegexInName.test(e.target.value)) {
      setEditingTableNameInvalid({
        isInvalid: true,
        message: t("notAllowSpecialCharacterOrBeginWithNumber"),
      });
      return;
    } else if (getNodes().find((n) => n.data.tableName === e.target.value)) {
      setEditingTableNameInvalid({
        isInvalid: true,
        message: t("tableNameExist"),
      });
      return;
    } else {
      editingTableNameInvalid.isInvalid &&
        setEditingTableNameInvalid({ isInvalid: false });
    }
    setNodes((nodes: TableNodeData[]) => {
      return nodes.map((node) => {
        if (node.id !== id) return node;
        return {
          ...node,
          data: {
            ...node.data,
            tableName: e.target.value,
          },
        };
      });
    });
  };
  const handleAddNewColumn = (
    e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>,
  ) => {
    e.stopPropagation();
    setNodes((nodes: TableNodeData[]) => {
      return nodes.map((node) => {
        if (node.id !== id) return node;

        const newColumnId = nanoid();
        const newColumnName = `${t("columnInColumnName")}_${Object.keys(node.data.columns).length}`;
        const newColumnProp: ColumnProps = {
          columnName: newColumnName,
          dataType: {
            type: "varchar",
            params: [100],
          },
          isNullable: true,
        };

        return {
          ...node,
          data: {
            ...node.data,
            columns: {
              ...node.data.columns,
              [newColumnId]: { ...newColumnProp },
            },
          },
        };
      });
    });
  };
  const handleFocusTableInFlow = () => {
    const node = getNode(id);
    if (!node) return;

    // Tính tâm của node (position là góc trên-trái, cần cộng thêm nửa width/height)
    const x = node.position.x + (node.measured?.width ?? 0) / 2;
    const y = node.position.y + (node.measured?.height ?? 0) / 2;

    setCenter(x, y, { zoom: 1, duration: 500 }); // duration: có animation mượt

    setNodes((nodes) => {
      const target = nodes.find((n) => n.id === id);
      if (!target) return nodes;

      const rest = nodes.filter((n) => n.id !== id);
      return [
        ...rest.map((n) => ({ ...n, selected: false })),
        { ...target, selected: true },
      ];
    });
  };

  return (
    <Box sx={{ position: "relative" }}>
      <Paper
        sx={{
          boxShadow: selected
            ? `inset 0 0 0 1px ${theme.palette.primary.main}, ${theme.shadows[6]}`
            : `inset 0 0 0 0px transparent, ${theme.shadows[1]}`,
        }}
        ref={(el: HTMLDivElement | null) => {
          // React gọi callback này với el có giá trị lúc mount,
          // và với null lúc unmount (khi node bị xóa khỏi danh sách)
          if (el) {
            register!(id, el);
          } else {
            unregister!(id);
          }
        }}
      >
        <ListItemButton
          sx={{ display: "flex", gap: "10px" }}
          onClick={handleClickToggleCollapseColumns}
        >
          <IconButton
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={handleFocusTableInFlow}
            sx={{
              userSelect: "none",
              cursor: "move",
              backgroundColor: color,
              "&:hover": {
                backgroundColor: color,
              },
            }}
          >
            <DragIndicator htmlColor={dragIconColor} />
          </IconButton>
          <Tooltip
            title={editingTableNameInvalid.message}
            arrow
            slotProps={{
              tooltip: { sx: { backgroundColor: "error.main" } },
              arrow: { sx: { color: "error.main" } },
            }}
          >
            <TextField
              variant="outlined"
              size="small"
              error={editingTableNameInvalid.isInvalid}
              placeholder={`${t("tableName")}`}
              value={tableName}
              inputRef={tableNameEditor}
              onBlur={handleCloseTableNameEditorByBlur}
              onKeyDown={handleCloseTableNameEditorByKey}
              onClick={handleOpenTableNameEditor}
              onChange={handleChangeTableName}
              sx={{
                flexGrow: 1,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderWidth: isEditingTableName ? "1px" : "0",
                  },
                  "&:hover fieldset": {
                    borderWidth: isEditingTableName ? "1px" : "0",
                  },
                  "&.Mui-focused fieldset": {
                    borderWidth: isEditingTableName ? "1px" : "0",
                  },
                },
              }}
            />
          </Tooltip>
          <Tooltip title={t("addNewColumn")} arrow>
            <IconButton onClick={handleAddNewColumn}>
              <PlusOne />
            </IconButton>
          </Tooltip>
          {isShowColumns ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={isShowColumns} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {Object.entries(columns).map(([columnId, columnProps]) => (
              <ColumnItem
                key={columnId}
                tableId={id}
                columnId={columnId}
                columnProps={columnProps}
              />
            ))}
          </List>
        </Collapse>
      </Paper>
      {selected && (
        <Box
          component="svg"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          <Box
            component="rect"
            x={1}
            y={1}
            width="calc(100% - 2px)"
            height="calc(100% - 2px)"
            rx={5}
            ry={5}
            fill="none"
            stroke={theme.palette.primary.main}
            strokeWidth={2}
            strokeDasharray="8 6"
            sx={{
              animation: `${marchingAntsBorderStyle} 0.6s linear infinite`,
            }}
          />
        </Box>
      )}
    </Box>
  );
}
