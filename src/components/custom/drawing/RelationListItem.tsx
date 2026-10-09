import {
  ColumnProps,
  KeyWithColumnProp,
  marchingAntsBorderStyle,
  NodeRelationData,
  NodeRelationEdge,
  SortOrder,
  TableNodeData,
} from "@/src/types/model/ExtendedNodeEdge";
import {
  Box,
  Collapse,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListSubheader,
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
  useTheme,
} from "@mui/material";
import { useNodesData, useReactFlow } from "@xyflow/react";
import { useTranslations } from "next-intl";
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AutoAwesome,
  ClearRounded,
  DeleteRounded,
  DragHandle,
  ExpandLess,
  ExpandMore,
  NearMe,
} from "@mui/icons-material";
import { syncTableNameToRelationship } from "@/src/utils/client";
import { useSortable } from "@dnd-kit/react/sortable";
import { RestrictToVerticalAxis } from "@dnd-kit/abstract/modifiers";
import { useScrollTargets } from "../../provider/ScrollTargetProvider";
import {
  REFERENTIAL_ACTIONS,
  ReferentialAction,
  RELATIONSHIP_TYPES,
  RelationshipType,
} from "@/src/constants/sqlProviders";

export default function RelationListItem({
  id,
  index,
  data,
  sourceId,
  targetId,
  selected,
}: {
  id: string;
  index: number;
  data: NodeRelationData | undefined;
  sourceId: string;
  targetId: string;
  selected?: boolean;
}) {
  const t = useTranslations("Drawing");
  const theme = useTheme();
  const { deleteElements, setEdges, getEdges, getEdge, setCenter, getNodes } =
    useReactFlow<TableNodeData, NodeRelationEdge>();
  const dragIconColor = useMemo(() => {
    return data?.color ? theme.palette.getContrastText(data.color) : undefined;
  }, [data?.color]);

  const [isShowDetail, setShowDetail] = useState<boolean>(false);
  const sourceNode = useNodesData<TableNodeData>(sourceId);
  const targetNode = useNodesData<TableNodeData>(targetId);
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
  const { register, unregister } = useScrollTargets();
  const relationshipDragAndDrop = useRef<HTMLDivElement | null>(null);

  const { handleRef } = useSortable({
    id: id,
    index,
    element: relationshipDragAndDrop,
    modifiers: [RestrictToVerticalAxis],
  });
  const setPaperRef = useCallback(
    (el: HTMLDivElement | null) => {
      relationshipDragAndDrop.current = el;
      if (el) register!(id, el);
      else unregister!(id);
    },
    [id, register, unregister],
  );

  const handleClickToggleShowDetail = () => {
    setShowDetail((state) => !state);
  };
  const handleClickListItem = () => {
    setEdges((edges) => {
      const target = edges.find((n) => n.id === id);
      if (!target) return edges;

      const rest = edges.filter((n) => n.id !== id);
      return [
        ...rest.map((n) => ({ ...n, selected: false })),
        { ...target, selected: true },
      ];
    });
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
  const handleFocusEdgeInFlow = () => {
    const edge = getEdge(id);
    if (!edge) return;

    // Lấy source node và target node
    const nodes = getNodes();
    const source = nodes.find((n) => n.id === edge.source);
    const target = nodes.find((n) => n.id === edge.target);

    if (!source || !target) return;

    // Tính tâm của source node
    const sourceX = source.position.x + (source.measured?.width ?? 0) / 2;
    const sourceY = source.position.y + (source.measured?.height ?? 0) / 2;

    // Tính tâm của target node
    const targetX = target.position.x + (target.measured?.width ?? 0) / 2;
    const targetY = target.position.y + (target.measured?.height ?? 0) / 2;

    // Điểm giữa (Midpoint) cũng chính là vị trí của Edge Label (trường hợp đường thẳng/default)
    const labelX = (sourceX + targetX) / 2;
    const labelY = (sourceY + targetY) / 2;

    // Di chuyển màn hình đến vị trí label
    setCenter(labelX, labelY, { zoom: 1, duration: 500 });
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

  return (
    <Box
      position={"relative"}
      ref={setPaperRef}
      sx={{
        boxShadow: selected ? 6 : 1,
      }}
    >
      <Box
        bgcolor={data?.color}
        height={"40px"}
        borderRadius={"5px"}
        position={"absolute"}
        top={"-25px"}
        left={0}
        zIndex={0}
        width={"100%"}
        textAlign={"center"}
        ref={handleRef}
        sx={{
          cursor: "grab",
        }}
      >
        <DragHandle htmlColor={dragIconColor} />
      </Box>
      <Paper
        sx={{
          position: "relative",
          width: "100%",
          transition: `box-shadow 0.5s, 
          height 0.3s ease, 
          opacity 0.3s ease, 
          padding-top 0.3s ease, 
          padding-bottom 0.3s ease, 
          margin-top 0.3s ease, 
          margin-bottom 0.3s ease`,
          borderRadius: "5px",
          p: 1,
          zIndex: 1,
        }}
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
                px: 0,
                pt: "8px",
                pb: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "5px",
                borderRadius: "6px",
              }}
            >
              <TextField
                label={t("tableWithForeignKey")}
                id="source-table-name"
                value={sourceNode?.data.tableName}
                disabled
                aria-readonly="true"
                size="small"
              />
              <FormControl sx={{ flexBasis: "120px" }}>
                <InputLabel id={`${id}-select-type-label`}>
                  {t("selectType")}
                </InputLabel>
                <Select
                  label={t("selectType")}
                  labelId={`${id}-select-type-label`}
                  value={data?.relationType}
                  id={`${id}-select-type-input`}
                  onChange={(e) => handleChangeRelationshipType(e.target.value)}
                  size="small"
                >
                  {RELATIONSHIP_TYPES.map((tp) => (
                    <MenuItem value={tp}>{tp}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label={t("tableForReference")}
                id="target-table-name"
                value={targetNode?.data.tableName}
                disabled
                aria-readonly="true"
                size="small"
              />
              <IconButton onClick={handleClickToggleShowDetail}>
                {isShowDetail ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </ListSubheader>
          }
          sx={{
            position: "relative",
            zIndex: 1,
          }}
          disablePadding
        >
          <Collapse in={isShowDetail} timeout="auto">
            <Box
              display={"flex"}
              justifyContent={"space-between"}
              alignItems={"center"}
              gap={1}
              mt={2}
              mb={1}
            >
              <IconButton
                color="primary"
                sx={{ width: "50px", height: "50px" }}
                centerRipple
                onClick={handleFocusEdgeInFlow}
              >
                <NearMe />
              </IconButton>
              <TextField
                label={t("foreignKeyEdgeName")}
                sx={{ flexGrow: 1 }}
                value={data?.relationshipName}
                disabled={data?.isAutoNaming}
                size="small"
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
                              color={
                                data?.isAutoNaming ? "primary" : "disabled"
                              }
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
                        <Tooltip title={t(`${a}Tooltip`)} placement="left">
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
                    id={`${id}-select-type-input`}
                    onChange={handleChangeTargetSelectedKey}
                  >
                    {targetKeyList.map((k) => (
                      <MenuItem key={k.id} value={k.id}>
                        {k.keyName}
                      </MenuItem>
                    ))}
                  </Select>
                  {data?.targetSelectedKey.id !== "" && (
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
                        <TableRow key={i}>
                          <TableCell
                            padding="none"
                            sx={{ maxWidth: "95px", minWidth: "95px" }}
                          >
                            <Tooltip
                              title={
                                sourceNode?.data.columns[sc[0]]?.columnName
                              }
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
                              maxWidth: "109.5px",
                              minWidth: "109.5px",
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
                              maxWidth: "95px",
                              minWidth: "95px",
                            }}
                          >
                            <Tooltip title={c[1].columnName}>
                              {
                                <Typography component={"span"}>
                                  {c[1].columnName}
                                </Typography>
                              }
                            </Tooltip>
                          </TableCell>
                          <TableCell
                            sx={{
                              px: "14px",
                              py: "8.5px",
                              fontSize: "16px",
                              maxWidth: "109.5px",
                              minWidth: "109.5px",
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
          </Collapse>
        </List>
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
              strokeDasharray="10 5"
              sx={{
                animation: `${marchingAntsBorderStyle} 0.6s linear infinite`,
              }}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
}
