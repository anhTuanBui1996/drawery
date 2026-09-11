"use client";

import { invalidCharRegexInName } from "@/src/lib/utils";
import {
  ColumnProps,
  NodeRelationEdge,
  TableNodeData,
} from "@/src/types/model/TableNode";
import {
  DragIndicator,
  ExpandLess,
  ExpandMore,
  PlusOne,
} from "@mui/icons-material";
import {
  Box,
  Collapse,
  IconButton,
  keyframes,
  List,
  ListSubheader,
  Paper,
  TextField,
  Tooltip,
  useTheme,
} from "@mui/material";
import { NodeProps, useReactFlow } from "@xyflow/react";
import { nanoid } from "nanoid";
import { useTranslations } from "next-intl";
import {
  ChangeEvent,
  KeyboardEvent,
  memo,
  ReactElement,
  useMemo,
  useRef,
  useState,
} from "react";
import { useScrollTargets } from "../../provider/ScrollTargetProvider";
import ColumnItem from "./ColumnItem";

const marchingAntsBorderStyle = keyframes`
  to {
    stroke-dashoffset: -14;
  }
`;

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

  const { setNodes, getNode, getNodes } = useReactFlow<
    TableNodeData,
    NodeRelationEdge
  >();
  const { scrollTo } = useScrollTargets();

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
  const handleFocusTableListItem = () => {
    const node = getNode(id);
    if (!node) return;

    scrollTo!(id);
  };

  return (
    <Box sx={{ position: "relative", width: "400px" }}>
      <Paper
        className="entity-node"
        sx={{
          width: "100%",
          borderTopLeftRadius: 0,
          borderTopRightRadius: "5px",
          borderBottomLeftRadius: "5px",
          borderBottomRightRadius: "5px",
          boxShadow: selected ? 6 : 1,
          transition: "box-shadow 0.5s",
          position: "relative",
        }}
      >
        <Box
          sx={{
            height: "14px",
            borderTopRightRadius: "5px",
            marginBottom: "-7px",
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
                zIndex: "auto",
                borderRadius: "5px",
                lineHeight: "36px",
                cursor: "auto",
                userSelect: "none",
                px: "8px",
                py: "8px",
                display: "flex",
                alignItems: "center",
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
              <IconButton
                onClick={handleClickToggleCollapseColumns}
                disableRipple
              >
                {isShowColumns ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </ListSubheader>
          }
          disablePadding
          dense
        >
          <Collapse
            in={isShowColumns}
            timeout="auto"
            unmountOnExit
            sx={{
              paddingBottom: "8px",
            }}
          >
            {Object.entries(data.columns).map(([columnId, columnProps]) => (
              <ColumnItem
                key={columnId}
                tableId={id}
                columnId={columnId}
                columnProps={columnProps}
              />
            ))}
          </Collapse>
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
            left: -29,
            maxWidth: "50px",
          }}
          onDoubleClick={handleFocusTableListItem}
        >
          <DragIndicator htmlColor={dragIconColor} fontSize="small" />
        </IconButton>
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
};

export default memo(TableNodeItem);
