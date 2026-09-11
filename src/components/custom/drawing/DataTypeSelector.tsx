import {
  ColumnDataType,
  getDataTypeList,
  NodeRelationEdge,
  SQLProviderName,
  TableNodeData,
} from "@/src/types/model/TableNode";
import {
  Button,
  FormControl,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useReactFlow } from "@xyflow/react";
import { useTranslations } from "next-intl";
import { ChangeEvent, MouseEvent, useId, useState } from "react";

export default function DataTypeSelector({
  tableId,
  columnId,
  dataType,
  providerName = "SQLServer",
}: {
  tableId: string;
  columnId: string;
  dataType: ColumnDataType;
  providerName?: SQLProviderName;
}) {
  const t = useTranslations("Drawing");
  const id = useId();
  const buttonId = `${id}-button`;
  const menuId = `${id}-menu`;
  const inputLabelId = `${id}-input-label`;
  const selectLabelId = `${id}-select-label`;
  const selectorId = `${id}-select`;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { setNodes } = useReactFlow<TableNodeData, NodeRelationEdge>();
  const dataTypeList = getDataTypeList(providerName)?.dataTypeList;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleChangeDataType = (
    e:
      | ChangeEvent<
          Omit<HTMLInputElement, "value"> & {
            value: string;
          }
        >
      | (Event & {
          target: {
            value: string;
            name: string;
          };
        }),
  ) => {
    setNodes((nodes: TableNodeData[]) => {
      return nodes.map((node) => {
        if (node.id !== tableId) return node;

        const column = node.data.columns[columnId];
        if (!column) return node;

        const newDefaultDataType: ColumnDataType | undefined =
          dataTypeList?.find((d) => d.type === e.target.value);

        return {
          ...node,
          data: {
            ...node.data,
            columns: {
              ...node.data.columns,
              [columnId]: {
                ...column,
                dataType: newDefaultDataType || {
                  type: "varchar",
                  params: [100],
                },
              },
            },
          },
        };
      });
    });
  };
  const handleChangeDataTypeParams =
    (paramIndex: number) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const rawValue = e.target.value;
      const numValue = rawValue === "" ? 0 : Number(rawValue);
      setNodes((nodes: TableNodeData[]) => {
        return nodes.map((node) => {
          if (node.id !== tableId) return node;

          const column = node.data.columns[columnId];
          if (!column) return node;

          // Clone mảng params, chỉ thay đổi đúng vị trí paramIndex
          const newParams = [...column.dataType.params];
          newParams[paramIndex] = numValue;

          const newDataType: ColumnDataType = {
            ...column.dataType,
            params: newParams,
          };

          return {
            ...node,
            data: {
              ...node.data,
              columns: {
                ...node.data.columns,
                [columnId]: {
                  ...column,
                  dataType: newDataType,
                },
              },
            },
          };
        });
      });
    };

  return (
    <>
      <Button
        id={buttonId}
        onClick={handleClick}
        sx={{ textTransform: "none" }}
      >
        {dataType.type}
        {dataType.params.length ? `(${dataType.params.join(",")})` : ""}
      </Button>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              padding: "10px",
            },
          },
        }}
      >
        <FormControl size="small" sx={{ width: "200px" }}>
          <InputLabel id={inputLabelId}>{t("dataType")}</InputLabel>
          <Select
            labelId={selectLabelId}
            id={selectorId}
            value={dataType.type}
            label={t("dataType")}
            onChange={handleChangeDataType}
            sx={{
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            }}
          >
            {dataTypeList?.map((dt) => (
              <MenuItem value={dt.type}>{dt.type}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {dataType.params.map((n, i) => (
          <FormControl size="small" sx={{ width: "80px" }} key={i}>
            <TextField
              type="number"
              value={n}
              size="small"
              onChange={handleChangeDataTypeParams(i)}
              slotProps={{
                input: {
                  sx: {
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    borderTopRightRadius:
                      i === dataType.params.length - 1 ? "4px" : 0,
                    borderBottomRightRadius:
                      i === dataType.params.length - 1 ? "4px" : 0,
                  },
                },
              }}
            />
          </FormControl>
        ))}
      </Menu>
    </>
  );
}
