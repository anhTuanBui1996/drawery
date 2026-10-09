import {
  ColumnProps,
  KeyWithColumnProp,
  NodeRelationEdge,
  SortOrder,
  TableNodeData,
  marchingAntsBorderStyle,
} from "@/src/types/model/ExtendedNodeEdge";
import { syncTableNameToRelationship } from "@/src/utils/client";
import {
  AccountTreeRounded,
  DeleteRounded,
  AutoAwesome,
  ClearRounded,
  NearMe,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  Position,
  useNodesData,
  useReactFlow,
} from "@xyflow/react";
import { useTranslations } from "next-intl";
import {
  ChangeEvent,
  memo,
  MouseEvent,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useScrollTargets } from "../../provider/ScrollTargetProvider";
import {
  REFERENTIAL_ACTIONS,
  ReferentialAction,
  RELATIONSHIP_TYPES,
  RelationshipType,
} from "@/src/constants/sqlProviders";

const RelationEdgeItem = ({
  id,
  data,
  sourceX,
  sourceY,
  sourcePosition,
  source,
  targetX,
  targetY,
  targetPosition,
  target,
  selected,
}: EdgeProps<NodeRelationEdge>): ReactElement => {
  const t = useTranslations("Drawing");
  const { deleteElements, setEdges, getEdges, getEdge } = useReactFlow<
    TableNodeData,
    NodeRelationEdge
  >();
  const buttonId = `${id}-edge-button`;
  const menuId = `${id}-edge-menu`;
  const theme = useTheme();
  const menuIconColor = useMemo(() => {
    return data?.color ? theme.palette.getContrastText(data.color) : undefined;
  }, [data?.color]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const sourceNode = useNodesData<TableNodeData>(source);
  const targetNode = useNodesData<TableNodeData>(target);
  const targetKeyList = useMemo<KeyWithColumnProp[]>(() => {
    let returnList: KeyWithColumnProp[] = [];
    if (targetNode?.data) {
      const columns = Object.entries<ColumnProps>(targetNode.data.columns);
      const tableKeys = targetNode.data.keys;
      if (tableKeys?.primaryKey) {
        const primaryKey = tableKeys.primaryKey;
        const primaryKeyColumns: [
          string,
          ColumnProps & { sortOrder: SortOrder },
        ][] = columns
          .filter((c) =>
            primaryKey.columnsWithIdAndSortOrder.some(
              (k) => k.columnId === c[0],
            ),
          )
          .map((c) => {
            const columnSortType = primaryKey.columnsWithIdAndSortOrder.find(
              (ci) => ci.columnId === c[0],
            )?.sortOrder;
            return [c[0], { ...c[1], sortOrder: columnSortType || "asc" }];
          });
        if (primaryKey.columnsWithIdAndSortOrder.length) {
          returnList.push({
            id: "primaryKey",
            keyName: primaryKey.keyName,
            isUnique: true,
            isPrimary: true,
            columns: primaryKeyColumns,
          });
        }
      }
      if (tableKeys?.otherKeys) {
        const otherKeys = tableKeys.otherKeys;
        Object.entries(otherKeys)
          .filter((k) => k[1].isUnique)
          .forEach((k) => {
            returnList.push({
              id: k[0],
              keyName: k[1].keyName,
              isUnique: true,
              isPrimary: false,
              columns: k[1].columnsWithIdAndSortOrder.map((ci) => [
                ci.columnId,
                targetNode.data.columns[ci.columnId],
              ]),
            });
          });
      }
    }
    return returnList;
  }, [targetNode?.data]);
  const { scrollTo } = useScrollTargets();

  const handleClickOpenMenu = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  const handleDeleteEdge = () => {
    deleteElements({ edges: [{ id }] });
  };
  const handleClickAutoNaming = useCallback(() => {
    if (sourceNode?.data.tableName && targetNode?.data.tableName) {
      const sourceTableName = sourceNode.data.tableName || "Source";
      const targetTableName = targetNode.data.tableName || "Target";

      const newRelationshipName = syncTableNameToRelationship(
        id,
        sourceTableName,
        targetTableName,
        getEdges,
      );

      setEdges((edges) => {
        return edges.map((edge: NodeRelationEdge) => {
          if (edge.id !== id || !edge.data) return edge;
          return {
            ...edge,
            data: {
              ...edge.data,
              relationshipName: newRelationshipName,
              isAutoNaming: !Boolean(edge.data.isAutoNaming),
            },
          };
        });
      });
    }
  }, [sourceNode?.data.tableName, targetNode?.data.tableName]);
  const handleChangeRelationshipType = (newType: RelationshipType) => {
    setEdges((edges) => {
      return edges.map((edge: NodeRelationEdge) => {
        if (edge.id !== id) return edge;
        return {
          ...edge,
          data: edge.data
            ? {
                ...edge.data,
                relationType: newType,
              }
            : undefined,
        };
      });
    });
  };
  const handleChangeReferentialActionForUpdate = (
    newAction: ReferentialAction,
  ) => {
    setEdges((edges) => {
      return edges.map((edge: NodeRelationEdge) => {
        if (edge.id !== id) return edge;
        return {
          ...edge,
          data: edge.data
            ? {
                ...edge.data,
                referentialActionForUpdate: newAction,
              }
            : undefined,
        };
      });
    });
  };
  const handleChangeReferentialActionForDelete = (
    newAction: ReferentialAction,
  ) => {
    setEdges((edges) => {
      return edges.map((edge: NodeRelationEdge) => {
        if (edge.id !== id) return edge;
        return {
          ...edge,
          data: edge.data
            ? {
                ...edge.data,
                referentialActionForDelete: newAction,
              }
            : undefined,
        };
      });
    });
  };
  const handleChangeSourceRelationshipType = () => {
    let newRelationshipType: RelationshipType = "1 - N";
    if (data?.relationType) {
      const newSourceRelationshipType =
        data.relationType.at(0) === "1" ? "N" : "1";
      newRelationshipType = (newSourceRelationshipType +
        data.relationType.slice(1)) as RelationshipType;
    }
    setEdges((edges) => {
      return edges.map((edge: NodeRelationEdge) => {
        if (edge.id !== id) return edge;
        return {
          ...edge,
          data: edge.data
            ? {
                ...edge.data,
                relationType: newRelationshipType,
              }
            : undefined,
        };
      });
    });
  };
  const handleChangeTargetRelationshipType = () => {
    let newRelationshipType: RelationshipType = "N - 1";
    if (data?.relationType) {
      const newSourceRelationshipType =
        data.relationType.at(4) === "1" ? "N" : "1";
      newRelationshipType = (data.relationType.slice(0, 4) +
        newSourceRelationshipType) as RelationshipType;
    }
    setEdges((edges) => {
      return edges.map((edge: NodeRelationEdge) => {
        if (edge.id !== id) return edge;
        return {
          ...edge,
          data: edge.data
            ? {
                ...edge.data,
                relationType: newRelationshipType,
              }
            : undefined,
        };
      });
    });
  };
  const handleChangeSourceSelectedColumns = (
    newColumnId: string,
    columnIndex: number,
  ) => {
    setEdges((edges) => {
      return edges.map((edge: NodeRelationEdge) => {
        if (edge.id !== id || !edge.data) return edge;
        return {
          ...edge,
          data: {
            ...edge.data,
            sourceColumns: edge.data.sourceColumns.map((c, i) => {
              if (i !== columnIndex) return c;
              const foundSourceColumn = sourceNode?.data.columns[newColumnId];
              if (!foundSourceColumn) return c;
              return [newColumnId, foundSourceColumn];
            }),
          },
        };
      });
    });
  };
  const handleChangeTargetSelectedKey = (
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
    const foundKey = targetKeyList.find((k) => k.id === e.target.value);
    setEdges((edges) => {
      return edges.map((edge: NodeRelationEdge) => {
        if (edge.id !== id || !edge.data || !foundKey?.columns) return edge;
        return {
          ...edge,
          data: {
            ...edge.data,
            targetSelectedKey: foundKey,
            sourceColumns: foundKey.columns.map(() => [""]),
          },
        };
      });
    });
  };
  const handleClearTargetSelectedKey = () => {
    setEdges((edges) => {
      return edges.map((edge: NodeRelationEdge) => {
        if (edge.id !== id || !edge.data) return edge;
        return {
          ...edge,
          data: {
            ...edge.data,
            targetSelectedKey: {
              id: "",
            },
            sourceColumns: [],
          },
        };
      });
    });
  };
  const handleFocusEdgeInList = () => {
    const edge = getEdge(id);
    if (!edge) return;

    scrollTo!(id);
  };

  useEffect(() => {
    if (sourceNode?.data.tableName && targetNode?.data.tableName) {
      const newRelationshipName = syncTableNameToRelationship(
        id,
        sourceNode.data.tableName,
        targetNode.data.tableName,
        getEdges,
      );
      setEdges((edges) => {
        return edges.map((edge: NodeRelationEdge) => {
          if (edge.id !== id || !edge.data || !edge.data.isAutoNaming)
            return edge;
          return {
            ...edge,
            data: {
              ...edge.data,
              relationshipName: newRelationshipName,
            },
          };
        });
      });
    }
  }, [sourceNode?.data.tableName, targetNode?.data.tableName]);
  useEffect(() => {
    if (sourceNode?.data.columns && data?.sourceColumns) {
      setEdges((edges) => {
        return edges.map((edge: NodeRelationEdge) => {
          if (edge.id !== id || !edge.data) return edge;
          return {
            ...edge,
            data: {
              ...edge.data,
              sourceColumns: data.sourceColumns.map((sc) => {
                if (sc[0] === "") return sc;
                return [sc[0], sourceNode.data.columns[sc[0]]];
              }),
            },
          };
        });
      });
    }
  }, [sourceNode?.data.columns]);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8, // bo tròn tại các điểm gấp khúc
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ opacity: selected ? 0 : undefined, stroke: data?.color }}
      />
      {selected && (
        <Box
          component="path"
          d={edgePath}
          fill="none"
          stroke={data?.color}
          strokeWidth={2}
          strokeDasharray="10 6"
          sx={{
            animation: `${marchingAntsBorderStyle} 0.6s linear infinite`,
            pointerEvents: "none",
          }}
        />
      )}

      <EdgeLabelRenderer>
        <Button
          className="nodrag nopan"
          onClick={handleChangeSourceRelationshipType}
          id={`relationship-type-${id}-source`}
          sx={{
            bgcolor: data?.color,
            color: menuIconColor,
            pointerEvents: "all",
            maxWidth: "35px",
            minWidth: "35px",
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${sourcePosition === Position.Bottom ? sourceX : sourceX + 20}px, ${sourcePosition === Position.Bottom ? sourceY + 20 : sourceY}px)`,
            zIndex: 1,
          }}
          variant="contained"
          size="small"
        >
          {data?.relationType ? data?.relationType.at(0) : 1}
        </Button>
        <Button
          className="nodrag nopan"
          onClick={handleChangeTargetRelationshipType}
          id={`relationship-type-${id}-target`}
          sx={{
            bgcolor: data?.color,
            color: menuIconColor,
            pointerEvents: "all",
            maxWidth: "35px",
            minWidth: "35px",
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${targetPosition === Position.Top ? targetX : targetX - 20}px, ${targetPosition === Position.Top ? targetY - 20 : targetY}px)`,
            zIndex: 1,
          }}
          variant="contained"
          size="small"
        >
          {data?.relationType ? data?.relationType.at(4) : 1}
        </Button>
        <Tooltip title={data?.relationshipName}>
          <IconButton
            size="small"
            centerRipple
            onClick={handleClickOpenMenu}
            sx={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
              bgcolor: data?.color,
              boxShadow: 1,
              "&:hover": {
                bgcolor: data?.color
                  ? menuIconColor === "#fff"
                    ? theme.lighten(data.color, 0.3)
                    : theme.darken(data.color, 0.3)
                  : undefined,
              },
            }}
          >
            <AccountTreeRounded fontSize="small" htmlColor={menuIconColor} />
          </IconButton>
        </Tooltip>
        <Menu
          id={menuId}
          anchorEl={anchorEl}
          open={open}
          onClose={handleCloseMenu}
          slotProps={{
            list: {
              "aria-labelledby": buttonId,
            },
            paper: {
              sx: {
                width: "600px",
                px: 2,
                py: 1,
              },
            },
          }}
          anchorOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
        >
          <Box
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            gap={1}
            mb={1}
          >
            <IconButton
              color="primary"
              sx={{ width: "50px", height: "50px" }}
              centerRipple
              onClick={handleFocusEdgeInList}
            >
              <NearMe />
            </IconButton>
            <FormControl>
              <InputLabel id={`${id}-select-type-label`}>
                {t("selectType")}
              </InputLabel>
              <Select
                label={t("selectType")}
                labelId={`${id}-select-type-label`}
                value={data?.relationType}
                id={`${id}-select-type-input`}
                onChange={(e) => handleChangeRelationshipType(e.target.value)}
              >
                {RELATIONSHIP_TYPES.map((tp) => (
                  <MenuItem value={tp}>{tp}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={t("foreignKeyEdgeName")}
              sx={{ flexGrow: 1 }}
              value={data?.relationshipName}
              disabled={data?.isAutoNaming}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={t("autoNamingRelationshipName")}>
                        <IconButton
                          onClick={handleClickAutoNaming}
                          aria-label={
                            data?.isAutoNaming
                              ? "auto-set foreign key name"
                              : "setting foreign key name manually"
                          }
                          edge="end"
                          color="info"
                        >
                          <AutoAwesome
                            color={data?.isAutoNaming ? "primary" : "disabled"}
                          />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <IconButton
              color="error"
              sx={{ width: "50px", height: "50px" }}
              centerRipple
              onClick={handleDeleteEdge}
            >
              <DeleteRounded />
            </IconButton>
          </Box>
          <Grid container spacing={1}>
            <Grid size={12}>
              <Divider>
                <Typography fontSize={14} fontStyle={"italic"}>
                  {t("referentialAction")}
                </Typography>
              </Divider>
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth>
                <InputLabel
                  id={`${id}-select-referential-action-label-for-update`}
                >
                  {t("forUpdate")}
                </InputLabel>
                <Select
                  label={t("forUpdate")}
                  labelId={`${id}-select-referential-action-label-for-update`}
                  value={data?.referentialActionForUpdate}
                  id={`${id}-select-referential-action-input-for-update`}
                  onChange={(e) =>
                    handleChangeReferentialActionForUpdate(e.target.value)
                  }
                  size="small"
                >
                  {REFERENTIAL_ACTIONS.map((a) => (
                    <MenuItem value={a}>
                      <Tooltip title={t(`${a}Tooltip`)} placement="left">
                        <Typography>{t(a)}</Typography>
                      </Tooltip>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth>
                <InputLabel
                  id={`${id}-select-referential-action-label-for-delete`}
                >
                  {t("forDelete")}
                </InputLabel>
                <Select
                  label={t("forDelete")}
                  labelId={`${id}-select-referential-action-label-for-delete`}
                  value={data?.referentialActionForDelete}
                  id={`${id}-select-referential-action-input-for-delete`}
                  onChange={(e) =>
                    handleChangeReferentialActionForDelete(e.target.value)
                  }
                  size="small"
                >
                  {REFERENTIAL_ACTIONS.map((a) => (
                    <MenuItem value={a}>
                      <Tooltip title={t(`${a}Tooltip`)} placement="right">
                        <Typography>{t(a)}</Typography>
                      </Tooltip>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <Divider>
                <Typography fontSize={14} fontStyle={"italic"}>
                  {t("tableColumnsSpecification")}
                </Typography>
              </Divider>
            </Grid>
            <Grid size={6}>
              <Typography
                display={"flex"}
                alignItems={"center"}
                height={"100%"}
                paddingLeft={1}
              >
                {`${t("foreignKeyOnSelectedTable")} ${sourceNode?.data.tableName}`}
              </Typography>
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth size="small">
                <InputLabel id={`${id}-select-target-columns-label`}>
                  {`${t("primaryKeyOnReferenceTable")} ${targetNode?.data.tableName}`}
                </InputLabel>
                <Select
                  label={`${t("primaryKeyOnReferenceTable")} ${targetNode?.data.tableName}`}
                  labelId={`${id}-select-target-columns-label`}
                  value={data?.targetSelectedKey.id || ""}
                  id={`${id}-select-reference-input`}
                  onChange={handleChangeTargetSelectedKey}
                >
                  {targetKeyList.map((k) => (
                    <MenuItem key={k.id} value={k.id}>
                      {k.keyName}
                    </MenuItem>
                  ))}
                </Select>
                {data?.targetSelectedKey.id && (
                  <IconButton
                    size="small"
                    onClick={handleClearTargetSelectedKey}
                    sx={{
                      position: "absolute",
                      right: "30px",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  >
                    <ClearRounded fontSize="small" />
                  </IconButton>
                )}
              </FormControl>
            </Grid>
            <Grid size={6}>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("columnName")}</TableCell>
                      <TableCell>{t("dataType")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.sourceColumns.map((sc, i) => (
                      <TableRow key={sc[0]}>
                        <TableCell
                          padding="none"
                          sx={{ maxWidth: "150px", minWidth: "150px" }}
                        >
                          <Tooltip
                            title={sourceNode?.data.columns[sc[0]]?.columnName}
                          >
                            <Select
                              id={`${id}-columns-relation-selector`}
                              fullWidth
                              size="small"
                              value={sc[0]}
                              onChange={(e) =>
                                handleChangeSourceSelectedColumns(
                                  e.target.value,
                                  i,
                                )
                              }
                              slotProps={{
                                notchedOutline: {
                                  sx: {
                                    border: "none",
                                  },
                                },
                              }}
                            >
                              {sourceNode?.data.columns &&
                                Object.entries(sourceNode?.data.columns).map(
                                  (c) => (
                                    <MenuItem key={c[0]} value={c[0]}>
                                      {c[1].columnName}
                                    </MenuItem>
                                  ),
                                )}
                            </Select>
                          </Tooltip>
                        </TableCell>
                        <TableCell
                          sx={{
                            px: "14px",
                            py: "8.5px",
                            fontSize: "16px",
                            maxWidth: "130px",
                            minWidth: "130px",
                            overflowX: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          <Tooltip
                            title={`${sc[1]?.dataType.type}
                              ${
                                sc[1]?.dataType.params.length
                                  ? `(${sc[1].dataType.params.join(",")})`
                                  : ""
                              }`}
                          >
                            <Typography component={"span"}>
                              {sc[1]?.dataType.type}
                              {sc[1]?.dataType.params.length
                                ? `(${sc[1].dataType.params.join(",")})`
                                : ""}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid size={6}>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("columnName")}</TableCell>
                      <TableCell>{t("dataType")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.targetSelectedKey.columns?.map((c) => (
                      <TableRow key={c[0]}>
                        <TableCell
                          sx={{
                            px: "14px",
                            py: "8.5px",
                            fontSize: "16px",
                            maxWidth: "150px",
                            minWidth: "150px",
                          }}
                        >
                          <Tooltip title={c[1].columnName}>
                            <Typography component={"span"}>
                              {c[1].columnName}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell
                          sx={{
                            px: "14px",
                            py: "8.5px",
                            fontSize: "16px",
                            maxWidth: "130px",
                            minWidth: "130px",
                            overflowX: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          <Tooltip
                            title={`${c[1].dataType.type}
                              ${
                                c[1].dataType.params.length
                                  ? `(${c[1].dataType.params.join(",")})`
                                  : ""
                              }`}
                          >
                            <Typography component={"span"}>
                              {c[1].dataType.type}
                              {c[1].dataType.params.length
                                ? `(${c[1].dataType.params.join(",")})`
                                : ""}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Menu>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(RelationEdgeItem);
