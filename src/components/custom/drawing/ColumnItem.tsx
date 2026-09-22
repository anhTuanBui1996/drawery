import {
  ColumnProps,
  NodeRelationEdge,
  PrimaryKey,
  TableKeys,
  TableNodeData,
} from "@/src/types/model/TableNode";
import {
  Badge,
  Box,
  Collapse,
  FormControlLabel,
  IconButton,
  ListItem,
  ListItemButton,
  Menu,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useNodesData, useReactFlow } from "@xyflow/react";
import { useTranslations } from "next-intl";
import {
  ChangeEvent,
  KeyboardEvent,
  memo,
  MouseEvent,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import DataTypeSelector from "./DataTypeSelector";
import { invalidCharRegexInName } from "@/src/utils/client";
import {
  Delete,
  DragIndicator,
  KeyTwoTone,
  ArrowDropDown,
  ArrowDropUp,
} from "@mui/icons-material";
import { MoreVerticalIcon } from "lucide-react";
import { DatePicker, DateTimePicker } from "@mui/x-date-pickers";
import { PickerValue } from "@mui/x-date-pickers/internals";
import NumberField from "../input/NumberField";
import moment from "moment";
import { useSortable } from "@dnd-kit/react/sortable";
import { RestrictToVerticalAxis } from "@dnd-kit/abstract/modifiers";

// Change handler signature shared with ColumnItem's handleChangeDefaultValue
type DefaultValueChangeHandler = (
  e: number | PickerValue | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
) => void;

type EditingColumnNameState = {
  isEditing: boolean;
  isInvalid: boolean;
  message?: string;
};

function DefaultValueField({
  id,
  inputType,
  columnDefaultValue,
  onChange,
  disabled,
}: {
  id: string;
  inputType: ColumnProps["dataType"]["inputType"];
  columnDefaultValue: ColumnProps["defaultValue"];
  onChange: DefaultValueChangeHandler;
  disabled?: boolean;
}) {
  const t = useTranslations("Drawing");
  const defaultProps = {
    label: t("defaultValue"),
    id: `default-value-${id}`,
  };

  switch (inputType) {
    case "number":
      return (
        <NumberField
          {...defaultProps}
          value={(columnDefaultValue as number) ?? null}
          onValueChange={onChange}
          disabled={disabled}
        />
      );
    case "date":
      return (
        <DatePicker
          {...defaultProps}
          value={columnDefaultValue as PickerValue}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "datetime":
      return (
        <DateTimePicker
          {...defaultProps}
          slotProps={{
            field: {
              clearable: true,
            },
          }}
          value={columnDefaultValue as PickerValue}
          onChange={onChange}
          disabled={disabled}
        />
      );
    default:
      return (
        <TextField
          {...defaultProps}
          value={columnDefaultValue || ("" as string)}
          onChange={onChange}
          disabled={disabled}
        />
      );
  }
}

function ColumnItem({
  index,
  dragable,
  tableId,
  columnId,
  columnProps,
}: {
  index: number;
  dragable?: boolean;
  tableId: string;
  columnId: string;
  columnProps: ColumnProps;
}) {
  const id = useId();
  const t = useTranslations("Drawing");
  const [editingColumnNameState, setEditingColumnNameState] =
    useState<EditingColumnNameState>({ isEditing: false, isInvalid: false });
  const { setNodes } = useReactFlow<TableNodeData, NodeRelationEdge>();
  const columnNameEditor = useRef<HTMLInputElement | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const columnDragAndDrop = useRef<HTMLLIElement | null>(null);
  const tableNode = useNodesData(tableId);
  const primaryKeyState = useMemo(() => {
    if (tableNode?.data) {
      const tableKeys = tableNode.data["keys"] as TableKeys;
      const foundColumn = tableKeys.primaryKey.columnIds.find(
        (c) => c.columnId === columnId,
      );
      if (foundColumn) {
        return {
          index: tableKeys.primaryKey.columnIds.findIndex(
            (c) => c.columnId === columnId,
          ),
          sortType: foundColumn.sortType,
        };
      }
    }
    return undefined;
  }, [tableNode?.data]);

  const handleToggleAllowNull = (columnId: string) => {
    setNodes((nodes: TableNodeData[]) => {
      return nodes.map((node) => {
        if (node.id !== tableId) return node;

        const column = node.data.columns[columnId];
        if (!column) return node;

        return {
          ...node,
          selected: true,
          data: {
            ...node.data,
            columns: {
              ...node.data.columns,
              [columnId]: {
                ...column,
                isNullable: !column.isNullable,
              },
            },
          },
        };
      });
    });
  };
  const handleToggleIsPrimaryKey = (columnId: string) => {
    setNodes((nodes: TableNodeData[]) => {
      return nodes.map((node) => {
        if (node.id !== tableId) return node;

        const column = node.data.columns[columnId];
        if (!column) return node;
        const primaryKeys = node.data.keys.primaryKey.columnIds;
        const willToggleOff = Boolean(primaryKeyState); // hành động này sẽ tắt đúng không (primaryKeyState nếu !undefined thì sẽ là sẽ tắt)?

        return {
          ...node,
          selected: true,
          data: {
            ...node.data,
            keys: {
              ...node.data.keys,
              primaryKey: {
                ...node.data.keys.primaryKey,
                columnIds: willToggleOff
                  ? primaryKeys.filter((c) => c.columnId !== columnId)
                  : primaryKeys.concat([{ columnId, sortType: "asc" }]),
              },
            },
          },
        };
      });
    });
  };
  const handleTogglePrimaryKeySortType = (
    e: MouseEvent<HTMLSpanElement, globalThis.MouseEvent>,
  ) => {
    e.stopPropagation();
    setNodes((nodes: TableNodeData[]) => {
      return nodes.map((node) => {
        if (node.id !== tableId || !primaryKeyState) return node;

        const column = node.data.columns[columnId];
        if (!column) return node;
        const primaryKeys = node.data.keys.primaryKey.columnIds;
        const willToggleToDesc = primaryKeyState.sortType === "asc";

        return {
          ...node,
          selected: true,
          data: {
            ...node.data,
            keys: {
              ...node.data.keys,
              primaryKey: {
                ...node.data.keys.primaryKey,
                columnIds: primaryKeys.map((c) =>
                  c.columnId === columnId
                    ? { ...c, sortType: willToggleToDesc ? "desc" : "asc" }
                    : c,
                ),
              },
            },
          },
        };
      });
    });
  };
  const handleOpenColumnNameEditor = () => {
    setEditingColumnNameState((state) => {
      return {
        ...state,
        isEditing: true,
      };
    });
    columnNameEditor.current?.focus();
  };
  const handleCloseColumnNameEditorByBlur = () => {
    setEditingColumnNameState((state) => {
      return {
        ...state,
        isEditing: false,
      };
    });
  };
  const handleCloseColumnNameEditorByKey = (
    e: KeyboardEvent<HTMLDivElement>,
  ) => {
    if (e.key === "Enter" || e.key === "Escape") {
      setEditingColumnNameState((state) => {
        return {
          ...state,
          isEditing: false,
        };
      });
    }
  };
  const handleChangeColumnName = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!e.target.value) {
      setEditingColumnNameState((state) => {
        return {
          ...state,
          isInvalid: true,
          message: t("notAllowEmpty"),
        };
      });
      return;
    } else if (e.target.value.includes(" ")) {
      setEditingColumnNameState((state) => {
        return {
          ...state,
          isInvalid: true,
          message: t("notAllowSpace"),
        };
      });
      return;
    } else if (!invalidCharRegexInName.test(e.target.value)) {
      setEditingColumnNameState((state) => {
        return {
          ...state,
          isInvalid: true,
          message: t("notAllowSpecialCharacterOrBeginWithNumber"),
        };
      });
      return;
    } else {
      editingColumnNameState.isInvalid &&
        setEditingColumnNameState((state) => {
          const { message, ...rest } = state;
          return {
            ...rest,
            isInvalid: false,
          };
        });
    }
    setNodes((nodes: TableNodeData[]) => {
      return nodes.map((node) => {
        if (node.id !== tableId) return node;

        return {
          ...node,
          data: {
            ...node.data,
            columns: {
              ...node.data.columns,
              [columnId]: {
                ...node.data.columns[columnId],
                columnName: e.target.value,
              },
            },
          },
        };
      });
    });
  };
  const handleClickOpenMoreMenu = (
    event: MouseEvent<HTMLDivElement, globalThis.MouseEvent>,
  ) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMoreMenu = () => {
    setAnchorEl(null);
  };
  const handleChangeDefaultValue: DefaultValueChangeHandler = (
    e:
      | number
      | PickerValue
      | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setNodes((nodes: TableNodeData[]) => {
      return nodes.map((node) => {
        if (node.id !== tableId) return node;
        return {
          ...node,
          data: {
            ...node.data,
            columns: {
              ...node.data.columns,
              [columnId]: {
                ...node.data.columns[columnId],
                defaultValue:
                  typeof e === "number" || e === null || moment.isMoment(e)
                    ? e
                    : e.target.value,
              },
            },
          },
        };
      });
    });
  };
  const handleChangeDescription = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setNodes((nodes: TableNodeData[]) => {
      return nodes.map((node) => {
        if (node.id !== tableId) return node;

        return {
          ...node,
          data: {
            ...node.data,
            columns: {
              ...node.data.columns,
              [columnId]: {
                ...node.data.columns[columnId],
                description: e.target.value,
              },
            },
          },
        };
      });
    });
  };
  const handleChangeIdentitySwitch = (e: ChangeEvent<HTMLInputElement>) => {
    setNodes((nodes: TableNodeData[]) => {
      return nodes.map((node) => {
        if (node.id !== tableId) return node;
        const { identity, defaultValue, ...rest } = node.data.columns[columnId];
        if (e.target.checked) {
          return {
            ...node,
            data: {
              ...node.data,
              columns: {
                ...node.data.columns,
                [columnId]: {
                  ...rest,
                  isNullable: false,
                  identity: {
                    seed: 1,
                    increment: 1,
                  },
                },
              },
            },
          };
        } else {
          return {
            ...node,
            data: {
              ...node.data,
              columns: {
                ...node.data.columns,
                [columnId]: {
                  ...rest,
                },
              },
            },
          };
        }
      });
    });
  };
  const handleChangeIdentitySeed = (newNumber: number | null) => {
    setNodes((nodes: TableNodeData[]) => {
      return nodes.map((node) => {
        if (node.id !== tableId || !node.data.columns[columnId].identity)
          return node;

        return {
          ...node,
          data: {
            ...node.data,
            columns: {
              ...node.data.columns,
              [columnId]: {
                ...node.data.columns[columnId],
                identity: {
                  ...node.data.columns[columnId].identity,
                  seed: newNumber || 1,
                },
              },
            },
          },
        };
      });
    });
  };
  const handleChangeIdentityIncrement = (newNumber: number | null) => {
    setNodes((nodes: TableNodeData[]) => {
      return nodes.map((node) => {
        if (node.id !== tableId || !node.data.columns[columnId].identity)
          return node;
        return {
          ...node,
          data: {
            ...node.data,
            columns: {
              ...node.data.columns,
              [columnId]: {
                ...node.data.columns[columnId],
                identity: {
                  ...node.data.columns[columnId].identity,
                  increment: newNumber || 1,
                },
              },
            },
          },
        };
      });
    });
  };
  const handleDeleteColumn = () => {
    if (columnDragAndDrop?.current) {
      const parentContainer = columnDragAndDrop.current.parentElement;
      // Lấy khoảng gap của flex container (ví dụ: "16px" -> 16)
      const computedGap = parentContainer
        ? parseInt(window.getComputedStyle(parentContainer).gap || "0", 10)
        : 0;
      columnDragAndDrop.current.style.overflow = "hidden";
      columnDragAndDrop.current.style.height = `${columnDragAndDrop.current.offsetHeight}px`; // Cố định height hiện tại trước khi animate về 0

      // Ép trình duyệt nhận giá trị hiện tại trước khi chuyển về 0
      columnDragAndDrop.current.offsetHeight;

      columnDragAndDrop.current.style.height = "0px";
      columnDragAndDrop.current.style.paddingTop = "0px";
      columnDragAndDrop.current.style.paddingBottom = "0px";
      columnDragAndDrop.current.style.marginTop = `-${computedGap / 2}px`;
      columnDragAndDrop.current.style.marginBottom = `-${computedGap / 2}px`;
      columnDragAndDrop.current.style.opacity = "0";
    }
    setTimeout(() => {
      setNodes((nodes: TableNodeData[]) => {
        return nodes.map((node) => {
          if (node.id !== tableId) return node;
          const { [columnId]: _, ...rest } = node.data.columns;

          return {
            ...node,
            data: {
              ...node.data,
              columns: {
                ...rest,
              },
            },
          };
        });
      });
    }, 310);
    handleCloseMoreMenu();
  };

  const { handleRef } = useSortable({
    id: columnId,
    index,
    element: columnDragAndDrop,
    modifiers: [RestrictToVerticalAxis],
  });

  return (
    <ListItem
      ref={columnDragAndDrop}
      sx={{
        gap: "5px",
        justifyContent: "space-between",
        backgroundColor: "background.paper",
        borderRadius: "5px",
        transition: `box-shadow 0.5s, 
          height 0.3s ease, 
          opacity 0.3s ease, 
          padding-top 0.3s ease, 
          padding-bottom 0.3s ease, 
          margin-top 0.3s ease, 
          margin-bottom 0.3s ease`,
      }}
      key={columnId}
    >
      {dragable && (
        <DragIndicator
          color="action"
          fontSize="small"
          ref={dragable ? handleRef : undefined}
          style={{ cursor: "grab" }}
        />
      )}
      <TextField
        variant="outlined"
        size="small"
        error={editingColumnNameState.isInvalid}
        helperText={editingColumnNameState.message}
        placeholder={`${t("columnName")}`}
        value={columnProps.columnName}
        ref={columnNameEditor}
        onBlur={handleCloseColumnNameEditorByBlur}
        onKeyDown={handleCloseColumnNameEditorByKey}
        onClick={handleOpenColumnNameEditor}
        onChange={handleChangeColumnName}
        slotProps={{
          input: {
            readOnly: !editingColumnNameState.isEditing,
          },
        }}
        sx={{
          flexGrow: 1,
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderWidth: editingColumnNameState.isEditing ? "1px" : "0",
            },
            "&:hover fieldset": {
              borderWidth: editingColumnNameState.isEditing ? "1px" : "0",
            },
            "&.Mui-focused fieldset": {
              borderWidth: editingColumnNameState.isEditing ? "1px" : "0",
            },
          },
        }}
      />
      <Tooltip
        title={`${t("primaryKey")}${primaryKeyState ? ` (${t("sortType")}: ${t(primaryKeyState.sortType)}, ${t("index")}: ${primaryKeyState.index})` : ""}`}
        placement="top-end"
        arrow
      >
        <Badge
          badgeContent={(primaryKeyState?.index || 0) + 1}
          color="primary"
          invisible={!!!primaryKeyState}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Badge
            badgeContent={
              primaryKeyState?.sortType === "desc" ? (
                <ArrowDropDown fontSize={"small"} />
              ) : (
                <ArrowDropUp fontSize={"small"} />
              )
            }
            color="success"
            invisible={!!!primaryKeyState}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            onClick={handleTogglePrimaryKeySortType}
            sx={{
              cursor: "pointer",
            }}
            slotProps={{
              badge: {
                sx: {
                  px: 0,
                },
              },
            }}
          >
            <ListItemButton
              selected={!!primaryKeyState}
              disabled={columnProps.isNullable}
              onClick={() => handleToggleIsPrimaryKey(columnId)}
              sx={{
                flexGrow: 1,
                borderRadius: "5px",
                width: "30px",
                height: "30px",
                px: "5px",
                py: 0,
              }}
            >
              <KeyTwoTone
                color={!!primaryKeyState ? "info" : "disabled"}
                sx={{ margin: "auto" }}
                fontSize="small"
              />
            </ListItemButton>
          </Badge>
        </Badge>
      </Tooltip>
      <Tooltip title={t("allowNull")} placement="top-end" arrow>
        <ListItemButton
          selected={columnProps.isNullable}
          disabled={!!primaryKeyState || !!columnProps.identity}
          onClick={() => handleToggleAllowNull(columnId)}
          sx={{
            flexGrow: "0",
            borderRadius: "5px",
            width: "30px",
            height: "30px",
            px: "5px",
            py: 0,
          }}
        >
          <Typography
            component={"strong"}
            fontWeight={600}
            color={columnProps.isNullable ? "info" : "textDisabled"}
            sx={{ margin: "auto" }}
          >
            N
          </Typography>
        </ListItemButton>
      </Tooltip>
      <DataTypeSelector
        tableId={tableId}
        columnId={columnId}
        dataType={columnProps.dataType}
      />
      <ListItemButton
        id={`column-button-more-${id}`}
        sx={{ px: 0, borderRadius: "5px", flexGrow: 0 }}
        onClick={handleClickOpenMoreMenu}
      >
        <MoreVerticalIcon />
      </ListItemButton>
      <Menu
        id={`column-more-menu-${id}`}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseMoreMenu}
        slotProps={{
          list: {
            "aria-labelledby": `column-button-more-${id}`,
            sx: {
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            },
          },
          paper: {
            sx: {
              px: "10px",
              py: "5px",
            },
          },
        }}
      >
        <DefaultValueField
          id={id}
          inputType={columnProps.dataType.inputType}
          columnDefaultValue={columnProps.defaultValue}
          onChange={handleChangeDefaultValue}
          disabled={!!columnProps.identity}
        />
        <TextField
          id={`column-desc-${id}`}
          label={t("description")}
          value={columnProps.description ?? ""}
          multiline
          rows={5}
          onChange={handleChangeDescription}
        />
        <Box display={"flex"} justifyContent={"space-between"}>
          <FormControlLabel
            control={
              <Switch
                checked={!!columnProps.identity}
                onChange={handleChangeIdentitySwitch}
                disabled={!columnProps.dataType.hasIdentitySpecification}
              />
            }
            label={t("hasIdentity")}
          />
          <Tooltip title={t("deleteColumn")}>
            <IconButton onClick={handleDeleteColumn}>
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
        <Collapse in={!!columnProps.identity}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "nowrap",
              justifyContent: "space-between",
              gap: "10px",
              width: "260px",
              marginTop: "8px",
            }}
          >
            <NumberField
              label={t("seed")}
              value={columnProps.identity?.seed ?? 1}
              onValueChange={handleChangeIdentitySeed}
            />
            <NumberField
              label={t("increment")}
              value={columnProps.identity?.increment ?? 1}
              onValueChange={handleChangeIdentityIncrement}
            />
          </Box>
        </Collapse>
      </Menu>
    </ListItem>
  );
}

export default memo(ColumnItem);
