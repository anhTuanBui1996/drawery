import {
  ColumnProps,
  NodeRelationEdge,
  REFERENTIAL_ACTIONS,
  RELATIONSHIP_TYPES,
  ReferentialAction,
  RelationshipType,
  TableNodeData,
  marchingAntsBorderStyle,
} from "@/src/types/model/TableNode";
import {
  AccountTreeRounded,
  DeleteRounded,
  AutoAwesome,
  ClearRounded,
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

type KeyWithColumnProp = {
  id: string;
  keyName?: string;
  isPrimary?: boolean;
  isUnique?: boolean;
  columns?: [string, ColumnProps][];
};

const syncTableNameToRelationship = (
  edgeId: string,
  sourceTableName: string,
  targetTableName: string,
  getEdges: () => NodeRelationEdge[],
) => {
  let loopIndex = 0;
  let pattern = `FK_${sourceTableName}_${targetTableName}_`;
  let newRelationshipName = `${pattern}${loopIndex}`;
  while (
    getEdges().find(
      (e) =>
        e.id !== edgeId && e.data?.relationshipName === newRelationshipName,
    )
  ) {
    loopIndex++;
    newRelationshipName = `${pattern}${loopIndex}`;
  }
  return newRelationshipName;
};

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
  const { deleteElements, setEdges, getEdges } = useReactFlow<
    TableNodeData,
    NodeRelationEdge
  >();
  const buttonId = `${id}-edge-button`;
  const menuId = `${id}-edge-menu`;
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const sourceNode = useNodesData<TableNodeData>(source);
  const targetNode = useNodesData<TableNodeData>(target);
  const targetPrimaryOrUniqueList = useMemo<KeyWithColumnProp[]>(() => {
    let returnList: KeyWithColumnProp[] = [];
    if (targetNode?.data) {
      const columns = Object.entries<ColumnProps>(
        targetNode.data.columns as Record<string, ColumnProps>,
      );
      const { primaryKey, otherKeys } = targetNode.data.keys;
      const primaryKeyColumns: [string, ColumnProps][] = columns.filter((c) =>
        primaryKey.columnIds.some((k) => k.columnId === c[0]),
      );
      if (primaryKey.columnIds.length) {
        returnList.push({
          id: "primaryKey",
          keyName: primaryKey.keyName,
          isUnique: true,
          isPrimary: true,
          columns: primaryKeyColumns,
        });
      }
      if (otherKeys) {
        Object.entries(otherKeys)
          .filter((k) => k[1].isUnique)
          .forEach((k) => {
            returnList.push({
              id: k[0],
              keyName: k[1].keyName,
              isUnique: true,
              isPrimary: false,
              columns: k[1].columnIds
                .map((c) => {
                  return columns.find((col) => c.columnId === col[0]);
                })
                .filter((res) => !!res),
            });
          });
      }
    }
    return returnList;
  }, [targetNode?.data]);
  const [sourceSelectedColumns, setSourceSelectedColumns] = useState<
    [string, ColumnProps?][]
  >([]);
  const [targetSelectedPrimaryOrUnique, setTargetSelectedPrimaryOrUnique] =
    useState<KeyWithColumnProp>({ id: "" });

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
  const handleChangeReferentialAction = (newAction: ReferentialAction) => {
    setEdges((edges) => {
      return edges.map((edge: NodeRelationEdge) => {
        if (edge.id !== id) return edge;
        return {
          ...edge,
          data: edge.data
            ? {
                ...edge.data,
                referentialAction: newAction,
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
    setSourceSelectedColumns((state) =>
      state.map((o, i) => {
        if (i !== columnIndex) return o;
        const foundColumn = sourceNode?.data.columns[newColumnId];
        if (foundColumn) {
          return [newColumnId, foundColumn];
        }
        return o;
      }),
    );
  };
  const handleChangeTargetSelectedPrimaryOrUnique = (
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
    setTargetSelectedPrimaryOrUnique(
      targetPrimaryOrUniqueList.find((k) => k.id === e.target.value) || {
        id: "",
      },
    );
  };

  useEffect(() => {
    if (targetSelectedPrimaryOrUnique.id) {
      const { columns } = targetSelectedPrimaryOrUnique;
      if (columns) {
        setSourceSelectedColumns(
          columns.map((c, i) => [`${c}_${i}`, undefined]),
        );
      }
    } else {
      setSourceSelectedColumns([]);
    }
  }, [targetSelectedPrimaryOrUnique, targetSelectedPrimaryOrUnique.id]);
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
        style={
          selected
            ? { opacity: 0 } // ẩn hoàn toàn đường mặc định khi được chọn, nhường chỗ cho overlay marching ants
            : undefined
        }
      />
      {/* Overlay path riêng cho hiệu ứng marching ants, chỉ hiện khi được chọn.
          Dùng Box (component="path") thay vì truyền style vào BaseEdge, vì sx đi qua
          Emotion nên @keyframes thực sự được đăng ký và chạy được. */}
      {selected && (
        <Box
          component="path"
          d={edgePath}
          fill="none"
          stroke={theme.palette.primary.main}
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
              bgcolor: "background.paper",
              boxShadow: 1,
              "&:hover": { bgcolor: "info.light" },
            }}
          >
            <AccountTreeRounded fontSize="small" color="action" />
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
              <Divider>{t("referentialAction")}</Divider>
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth>
                <InputLabel id={`${id}-select-referential-action-label`}>
                  {t("forUpdate")}
                </InputLabel>
                <Select
                  label={t("forUpdate")}
                  labelId={`${id}-select-referential-action-label`}
                  value={data?.referentialAction}
                  id={`${id}-select-referential-action-input`}
                  onChange={(e) =>
                    handleChangeReferentialAction(e.target.value)
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
                <InputLabel id={`${id}-select-referential-action-label`}>
                  {t("forDelete")}
                </InputLabel>
                <Select
                  label={t("forDelete")}
                  labelId={`${id}-select-referential-action-label`}
                  value={data?.referentialAction}
                  id={`${id}-select-referential-action-input`}
                  onChange={(e) =>
                    handleChangeReferentialAction(e.target.value)
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
              <Divider>{t("tableColumnsSpecification")}</Divider>
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
                  value={targetSelectedPrimaryOrUnique.id}
                  id={`${id}-select-type-input`}
                  onChange={handleChangeTargetSelectedPrimaryOrUnique}
                >
                  {targetPrimaryOrUniqueList.map((k) => (
                    <MenuItem key={k.id} value={k.id}>
                      {k.keyName}
                    </MenuItem>
                  ))}
                </Select>
                {targetSelectedPrimaryOrUnique.id !== "" && (
                  <IconButton
                    size="small"
                    onClick={() =>
                      setTargetSelectedPrimaryOrUnique({
                        id: "",
                      })
                    }
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
                      <TableCell width={180}>{t("dataType")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sourceSelectedColumns.map((sc, i) => (
                      <TableRow key={sc[0]}>
                        <TableCell padding="none">
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
                                  <MenuItem value={c[0]}>
                                    {c[1].columnName}
                                  </MenuItem>
                                ),
                              )}
                          </Select>
                        </TableCell>
                        <TableCell
                          sx={{ px: "14px", py: "8.5px", fontSize: "16px" }}
                        >
                          {sc[1]?.dataType.type}
                          {sc[1]?.dataType.params.length
                            ? `(${sc[1].dataType.params.join(",")})`
                            : ""}
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
                      <TableCell width={180}>{t("dataType")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {targetSelectedPrimaryOrUnique.columns?.map((c) => (
                      <TableRow key={c[0]}>
                        <TableCell
                          sx={{ px: "14px", py: "8.5px", fontSize: "16px" }}
                        >
                          {c[1].columnName}
                        </TableCell>
                        <TableCell
                          sx={{ px: "14px", py: "8.5px", fontSize: "16px" }}
                        >
                          {c[1].dataType.type}
                          {c[1].dataType.params.length
                            ? `(${c[1].dataType.params.join(",")})`
                            : ""}
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
