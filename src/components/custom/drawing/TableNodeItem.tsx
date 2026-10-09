"use client";

import { invalidCharRegexInName } from "@/src/utils/client";
import {
  ColumnProps,
  marchingAntsBorderStyle,
  NodeRelationEdge,
  TableNodeData,
} from "@/src/types/model/ExtendedNodeEdge";
import {
  ArrowDropDown,
  ArrowDropUp,
  DragIndicator,
  ExpandLess,
  ExpandMore,
  PlusOne,
} from "@mui/icons-material";
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
import { Handle, NodeProps, Position, useReactFlow } from "@xyflow/react";
import { nanoid } from "nanoid";
import { useTranslations } from "next-intl";
import {
  ChangeEvent,
  KeyboardEvent,
  memo,
  MouseEvent,
  ReactElement,
  useMemo,
  useRef,
  useState,
} from "react";
import { useScrollTargets } from "../../provider/ScrollTargetProvider";
import ColumnItem from "./ColumnItem";
import ArrowCircleRightIcon from "@mui/icons-material/ArrowCircleRight";
import TableItemMenu from "./TableItemMenu";

const TableNodeItem = ({
  id,
  data,
  selected,
}: NodeProps<TableNodeData>): ReactElement => {
  const theme = useTheme();
  const dragIconColor = useMemo(() => {
    return theme.palette.getContrastText(data.color);
  }, [data.color]);
  const t = useTranslations("Drawing");
  const [isShowColumns, setShowColumns] = useState<boolean>(true);

  const [isEditingTableName, setEditingTableName] = useState<boolean>(false);
  const [editingTableNameInvalid, setEditingTableNameInvalid] = useState<{
    isInvalid: boolean;
    message?: string;
  }>({ isInvalid: false });
  const tableNameEditor = useRef<HTMLInputElement | null>(null);

  const [tableMenuState, setTableMenuState] = useState<{
    open: boolean;
    anchorEl: HTMLButtonElement | null;
  }>({
    open: false,
    anchorEl: null,
  });

  const { setNodes, getNode, getNodes } = useReactFlow<
    TableNodeData,
    NodeRelationEdge
  >();
  const { scrollTo } = useScrollTargets();

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
        const newColumnName = `${t("columnInColumnName")}_${Object.keys(node.data.columns).length}`;
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
  const handleFocusTableListItem = () => {
    const node = getNode(id);
    if (!node) return;

    scrollTo!(id);
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
      className="entity-node"
      sx={{
        width: "530px",
        boxShadow: selected ? 6 : 1,
        transition: "box-shadow 0.5s",
        borderRadius: "6px",
        cursor: "auto",
        userSelect: "none",
        zIndex: 1,
        position: "relative",
      }}
    >
      <Box
        className="drag-header-handle"
        sx={{
          height: "14px",
          borderTopRightRadius: "5px",
          marginBottom: "-7px",
          cursor: "move",
        }}
        component={"div"}
        bgcolor={data.color}
      >
        {" "}
      </Box>
      <List
        subheader={
          <ListSubheader
            component="div"
            id="nested-list-subheader"
            sx={{
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
                value={data.tableName}
                inputRef={tableNameEditor}
                onBlur={handleCloseTableNameEditorByBlur}
                onKeyDown={handleCloseTableNameEditorByKey}
                onClick={handleOpenTableNameEditor}
                onChange={handleChangeTableName}
                sx={{
                  marginRight: "5px",
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
        disablePadding
      >
        <Collapse
          in={isShowColumns}
          timeout="auto"
          unmountOnExit
          sx={{
            position: "relative",
            zIndex: 0,
          }}
        >
          {Object.entries(data.columns).map(([columnId, columnProps], i) => (
            <ColumnItem
              key={columnId}
              index={i}
              tableId={id}
              columnId={columnId}
              columnProps={columnProps}
            />
          ))}
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
              height="calc(100% - 1px)"
              x={1}
              y={1}
              rx={5}
              ry={5}
              fill="none"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              strokeDasharray="10 7"
              sx={{
                animation: `${marchingAntsBorderStyle} 0.6s linear infinite`,
              }}
            />
          </Box>
        )}
      </List>
      <IconButton
        className="drag-header-handle"
        size="small"
        sx={{
          userSelect: "none",
          cursor: "move",
          bgcolor: data.color,
          "&:hover": {
            backgroundColor: data.color,
          },
          position: "absolute",
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          top: 0,
          left: "-25px",
          zIndex: 0,
        }}
        onDoubleClick={handleFocusTableListItem}
        onContextMenu={handleOpenTableMenu}
      >
        <DragIndicator htmlColor={dragIconColor} fontSize="small" />
      </IconButton>
      <TableItemMenu
        open={tableMenuState.open}
        anchorEl={tableMenuState.anchorEl}
        tableId={id}
        handleClose={handleCloseTableMenu}
        isNodeItem
      />
      <Handle
        position={Position.Top}
        id={"target-top"}
        type="target"
        style={{
          background: "none",
          border: "none",
          width: "1em",
          height: "1em",
          zIndex: 2,
        }}
      >
        <Paper
          sx={{
            height: "100%",
            borderRadius: "100%",
            backgroundColor: "light",
          }}
        >
          <ArrowDropDown
            style={{
              pointerEvents: "none",
              fontSize: "1em",
              left: 0,
              position: "absolute",
            }}
          />
        </Paper>
      </Handle>
      <Handle
        position={Position.Bottom}
        id={"source-bottom"}
        type="source"
        style={{
          background: "none",
          border: "none",
          width: "1em",
          height: "1em",
          zIndex: 2,
        }}
      >
        <Paper
          sx={{
            height: "100%",
            borderRadius: "100%",
            backgroundColor: "light",
          }}
        >
          <ArrowDropDown
            style={{
              pointerEvents: "none",
              fontSize: "1em",
              left: 0,
              position: "absolute",
            }}
          />
        </Paper>
      </Handle>
      <Handle
        position={Position.Right}
        id={"source-right"}
        type="source"
        style={{
          background: "none",
          border: "none",
          width: "1em",
          height: "1em",
          zIndex: 2,
        }}
      >
        <Paper
          sx={{
            height: "100%",
            borderRadius: "100%",
            backgroundColor: "light",
          }}
        >
          <ArrowDropUp
            style={{
              pointerEvents: "none",
              fontSize: "1em",
              left: 0,
              position: "absolute",
              transform: "rotate(90deg)",
            }}
          />
        </Paper>
      </Handle>
      <Handle
        position={Position.Left}
        id={"target-left"}
        type="target"
        style={{
          background: "none",
          border: "none",
          width: "1em",
          height: "1em",
          zIndex: 2,
        }}
      >
        <Paper
          sx={{
            height: "100%",
            borderRadius: "100%",
            backgroundColor: "light",
          }}
        >
          <ArrowDropUp
            style={{
              pointerEvents: "none",
              fontSize: "1em",
              left: 0,
              position: "absolute",
              transform: "rotate(90deg)",
            }}
          />
        </Paper>
      </Handle>
    </Paper>
  );
};

export default memo(TableNodeItem);
