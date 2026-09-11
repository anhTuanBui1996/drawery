import {
  ColumnProps,
  NodeRelationEdge,
  TableNodeData,
} from "@/src/types/model/TableNode";
import {
  ListItem,
  ListItemButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useReactFlow } from "@xyflow/react";
import { useTranslations } from "next-intl";
import { ChangeEvent, KeyboardEvent, memo, useRef, useState } from "react";
import DataTypeSelector from "./DataTypeSelector";
import { invalidCharRegexInName } from "@/src/lib/utils";

function ColumnItem({
  tableId,
  columnId,
  columnProps,
}: {
  tableId: string;
  columnId: string;
  columnProps: ColumnProps;
}) {
  const t = useTranslations("Drawing");
  const [editingColumnNameState, setEditingColumnNameState] = useState<{
    isEditing: boolean;
    isInvalid: boolean;
    message?: string;
  }>({ isEditing: false, isInvalid: false });
  const { setNodes } = useReactFlow<TableNodeData, NodeRelationEdge>();
  const columnNameEditor = useRef<HTMLInputElement | null>(null);

  const handleToggleAllowNull = (columnId: string) => {
    setNodes((nodes: TableNodeData[]) => {
      return nodes.map((node) => {
        if (node.id !== tableId) return node;

        const column = node.data.columns[columnId];
        if (!column) return node;

        return {
          ...node,
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
    } else if (invalidCharRegexInName.test(e.target.value)) {
      setEditingColumnNameState((state) => {
        return {
          ...state,
          isInvalid: true,
          message: t("notAllowSpecialCharacterOrBeginWithNumber"),
        };
      });
      return;
    } else {
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

  return (
    <ListItem sx={{ gap: "10px" }} key={columnId}>
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
      <Tooltip title={t("allowNull")} placement="left" arrow>
        <ListItemButton
          selected={columnProps.isNullable}
          onClick={() => handleToggleAllowNull(columnId)}
          sx={{
            borderRadius: "5px",
            width: "30px",
            height: "30px",
            px: 0,
            py: 0,
          }}
        >
          <Typography
            component={"span"}
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
    </ListItem>
  );
}

export default memo(ColumnItem);
