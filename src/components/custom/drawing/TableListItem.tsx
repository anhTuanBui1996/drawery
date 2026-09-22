"use client";

import {
  ColumnProps,
  marchingAntsBorderStyle,
  NodeRelationEdge,
  TableNodeData,
} from "@/src/types/model/TableNode";
import {
  Box,
  Collapse,
  IconButton,
  List,
  ListSubheader,
  Paper,
  TextField,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  ChangeEvent,
  KeyboardEvent,
  memo,
  MouseEvent,
  useCallback,
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
import { invalidCharRegexInName } from "@/src/utils/client";
import ColumnItem from "./ColumnItem";
import { useScrollTargets } from "../../provider/ScrollTargetProvider";
import { DragDropProvider } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { useSortable } from "@dnd-kit/react/sortable";
import { RestrictToVerticalAxis } from "@dnd-kit/abstract/modifiers";
import TableItemMenu from "./TableItemMenu";

function TableListItem({
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
  const { setNodes, getNodes } = useReactFlow<
    TableNodeData,
    NodeRelationEdge
  >();
  const tableNameEditor = useRef<HTMLInputElement | null>(null);
  const { register, unregister } = useScrollTargets();
  const tableDragAndDrop = useRef<HTMLDivElement | null>(null);
  const columnDragAndDropContainer = useRef<HTMLDivElement | null>(null);
  const [tableMenuState, setTableMenuState] = useState<{
    open: boolean;
    anchorEl: HTMLButtonElement | null;
  }>({
    open: false,
    anchorEl: null,
  });

  const { handleRef } = useSortable({
    id: id,
    index,
    element: tableDragAndDrop,
    modifiers: [RestrictToVerticalAxis],
  });
  const setPaperRef = useCallback(
    (el: HTMLDivElement | null) => {
      tableDragAndDrop.current = el;
      if (el) register!(id, el);
      else unregister!(id);
    },
    [id, register, unregister],
  );

  const handleClickListItem = () => {
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
  const handleClickToggleCollapseColumns = () => {
    setShowColumns(!isShowColumns);
  };
  const handleOpenTableNameEditor = () => {
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
  const handleAddNewColumn = () => {
    setNodes((nodes: TableNodeData[]) => {
      return nodes.map((node) => {
        if (node.id !== id) return node;

        const newColumnId = "column_" + nanoid();
        let loopIndex = 0;
        let newColumnName = `${t("columnInColumnName")}_${loopIndex}`;
        const columnNameList = Object.values(node.data.columns).map(
          (c) => c.columnName,
        );
        while (columnNameList.includes(newColumnName)) {
          loopIndex++;
          newColumnName = `${t("columnInColumnName")}_${loopIndex}`;
        }
        const newColumnProp: ColumnProps = {
          columnName: newColumnName,
          dataType: {
            type: "varchar",
            params: [100],
            inputType: "text",
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
  const handleOpenTableMenu = (
    e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setTableMenuState({
      open: true,
      anchorEl: e.currentTarget,
    });
    handleClickListItem();
  };
  const handleCloseTableMenu = () => {
    setTableMenuState({
      open: false,
      anchorEl: null,
    });
  };

  return (
    <Paper
      sx={{
        width: "400px",
        boxShadow: selected ? 6 : 1,
        transition: `box-shadow 0.5s, 
          height 0.3s ease, 
          opacity 0.3s ease, 
          padding-top 0.3s ease, 
          padding-bottom 0.3s ease, 
          margin-top 0.3s ease, 
          margin-bottom 0.3s ease`,
        borderRadius: "5px",
      }}
      ref={setPaperRef}
      onClick={handleClickListItem}
    >
      <List
        component={"div"}
        subheader={
          <ListSubheader
            component="div"
            id="nested-list-subheader"
            sx={{
              position: "static",
              zIndex: "1",
              lineHeight: "36px",
              cursor: "auto",
              userSelect: "none",
              px: "8px",
              py: "8px",
              display: "flex",
              alignItems: "center",
              borderRadius: "6px",
            }}
          >
            <IconButton
              onClick={(e) => e.stopPropagation()}
              onContextMenu={handleOpenTableMenu}
              ref={handleRef}
              sx={{
                userSelect: "none",
                cursor: "grab",
                backgroundColor: color,
                "&:hover": {
                  backgroundColor: color,
                },
              }}
            >
              <DragIndicator htmlColor={dragIconColor} />
            </IconButton>
            <TableItemMenu
              open={tableMenuState.open}
              anchorEl={tableMenuState.anchorEl}
              tableId={id}
              handleClose={handleCloseTableMenu}
              tableRef={tableDragAndDrop}
            />
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
                  mx: "5px",
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
            <IconButton onClick={handleClickToggleCollapseColumns}>
              {isShowColumns ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </ListSubheader>
        }
        sx={{
          position: "relative",
        }}
        ref={columnDragAndDropContainer}
      >
        <Collapse in={isShowColumns} timeout="auto" unmountOnExit>
          <DragDropProvider
            onDragEnd={(e) => {
              setNodes((nodes: TableNodeData[]) => {
                return nodes.map((node) => {
                  if (node.id !== id) return node;

                  if (e.canceled) return node;
                  const sortedColumnIds = move(
                    Object.keys(node.data.columns),
                    e,
                  );
                  const sortedColumns: Record<string, ColumnProps> = {};
                  sortedColumnIds.forEach((k) => {
                    sortedColumns[k] = node.data.columns[k];
                  });
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      columns: sortedColumns,
                    },
                  };
                });
              });
            }}
          >
            {Object.entries(columns).map(([columnId, columnProps], i) => (
              <ColumnItem
                key={columnId}
                index={i}
                dragable
                tableId={id}
                columnId={columnId}
                columnProps={columnProps}
              />
            ))}
          </DragDropProvider>
        </Collapse>
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
              zIndex: 1,
            }}
          >
            <Box
              component="rect"
              width="calc(100% - 2px)"
              height="calc(100% - 2px)"
              x={1}
              y={1}
              rx={5}
              ry={5}
              fill="none"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              strokeDasharray="10 6"
              sx={{
                animation: `${marchingAntsBorderStyle} 0.6s linear infinite`,
              }}
            />
          </Box>
        )}
      </List>
    </Paper>
  );
}

export default memo(TableListItem);
