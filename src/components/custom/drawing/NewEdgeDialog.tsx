import {
  ColumnProps,
  KeyWithColumnProp,
  NodeRelationEdge,
  SortOrder,
  TableNodeData,
} from "@/src/types/model/ExtendedNodeEdge";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
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
import { useNodesData, useReactFlow } from "@xyflow/react";
import { useTranslations } from "next-intl";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AutoAwesome, ClearRounded } from "@mui/icons-material";
import { nanoid } from "nanoid";
import {
  getRandomMuiColor,
  syncTableNameToRelationship,
} from "@/src/utils/client";
import {
  REFERENTIAL_ACTIONS,
  ReferentialAction,
  RELATIONSHIP_TYPES,
  RelationshipType,
} from "@/src/constants/sqlProviders";

type TableList = {
  id: string;
  name: string;
};

export default function NewEdgeDialog({
  diagramId,
  open,
  handleClose,
}: {
  diagramId: string;
  open: boolean;
  handleClose: () => void;
}) {
  const t = useTranslations("Drawing");
  const { setEdges, getEdges, getNodes } = useReactFlow<
    TableNodeData,
    NodeRelationEdge
  >();

  const [newEdgeId, setNewEdgeId] = useState<string>(nanoid());
  const [newRelationshipType, setNewRelationshipType] =
    useState<RelationshipType>("N - 1");
  const [newRelationshipName, setNewRelationshipName] = useState<string>("");
  const [isAutoNaming, setIsAutoNaming] = useState<boolean>(false);
  const [newReferentialActionForUpdate, setNewReferentialActionForUpdate] =
    useState<ReferentialAction>("noAction");
  const [newReferentialActionForDelete, setNewReferentialActionForDelete] =
    useState<ReferentialAction>("noAction");
  const [sourceList, setSourceList] = useState<TableList[]>([]);
  const [sourceId, setSourceId] = useState<string>("");
  const sourceNode = useNodesData<TableNodeData>(sourceId);
  const [targetList, setTargetList] = useState<TableList[]>([]);
  const [targetId, setTargetId] = useState<string>("");
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
  const [targetSelectedKey, setTargetSelectedKey] = useState<KeyWithColumnProp>(
    { id: "" },
  );
  const [sourceSelectedColumns, setSourceSelectedColumns] = useState<
    [string, ColumnProps?][]
  >([]);

  const handleClickAutoNaming = useCallback(() => {
    setIsAutoNaming((state) => {
      if (state === false) {
        // đang từ tắt sang bật
        if (!isAutoNaming && sourceId && sourceNode && targetId && targetNode) {
          const sourceTableName = sourceNode.data.tableName || "Source";
          const targetTableName = targetNode.data.tableName || "Target";
          const newEdgeId = nanoid();

          setNewRelationshipName(
            syncTableNameToRelationship(
              newEdgeId,
              sourceTableName,
              targetTableName,
              getEdges,
            ),
          );
        }
        return true;
      }
      return false;
    });
  }, [sourceId, sourceNode, targetId, targetNode]);
  const handleChangeRelationshipName = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setNewRelationshipName(e.target.value);
  };
  const handleChangeRelationshipType = (newType: RelationshipType) => {
    setNewRelationshipType(newType);
  };
  const handleChangeReferentialActionForUpdate = (
    newAction: ReferentialAction,
  ) => {
    setNewReferentialActionForUpdate(newAction);
  };
  const handleChangeReferentialActionForDelete = (
    newAction: ReferentialAction,
  ) => {
    setNewReferentialActionForDelete(newAction);
  };
  const handleChangeSourceTable = (
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
    setSourceId(e.target.value);
  };
  const handleChangeTargetTable = (
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
    setTargetId(e.target.value);
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
    setTargetSelectedKey(
      targetKeyList.find((k) => k.id === e.target.value) || {
        id: "",
      },
    );
  };
  const handleSubmitNewEdge = () => {
    setEdges((edges) => {
      return [
        ...edges,
        {
          id: newEdgeId,
          source: sourceId,
          target: targetId,
          type: "foreignKeyEdge",
          data: {
            diagramId,
            index: edges.length,
            color: getRandomMuiColor(),
            isAutoNaming,
            relationshipName: newRelationshipName,
            relationType: newRelationshipType,
            referentialActionForUpdate: newReferentialActionForUpdate,
            referentialActionForDelete: newReferentialActionForDelete,
            targetSelectedKey,
            sourceColumns: sourceSelectedColumns,
          },
        },
      ];
    });
    handleClose();
  };

  useEffect(() => {
    if (open) {
      setNewEdgeId(nanoid());
      setIsAutoNaming(false);
      setNewRelationshipName("");
      const currentTableList = getNodes().map<TableList>((n) => ({
        id: n.id,
        name: n.data.tableName,
      }));
      setSourceList(currentTableList);
      setTargetList(currentTableList);
      setSourceId("");
      setTargetId("");
    }
  }, [open]);
  useEffect(() => {
    if (targetSelectedKey.id) {
      const { columns } = targetSelectedKey;
      if (columns) {
        setSourceSelectedColumns(columns.map(() => ["", undefined]));
      }
    } else {
      setSourceSelectedColumns([]);
    }
  }, [targetSelectedKey, targetSelectedKey.id]);
  useEffect(() => {
    if (
      isAutoNaming &&
      sourceNode?.data.tableName &&
      targetNode?.data.tableName
    ) {
      setNewRelationshipName(
        syncTableNameToRelationship(
          newEdgeId,
          sourceNode.data.tableName,
          targetNode.data.tableName,
          getEdges,
        ),
      );
    }
  }, [newEdgeId, sourceNode?.data.tableName, targetNode?.data.tableName]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{t("addNewRelationship")}</DialogTitle>
      <DialogContent>
        <Grid container spacing={1} sx={{ pt: 1 }}>
          <Grid size={6}>
            <FormControl fullWidth size="small">
              <InputLabel id={`${newEdgeId}-select-source-label`}>
                {`${t("tableWithForeignKey")}`}
              </InputLabel>
              <Select
                label={`${t("tableWithForeignKey")}`}
                labelId={`${newEdgeId}-select-source-label`}
                value={sourceId}
                id={`${newEdgeId}-select-source-input`}
                onChange={handleChangeSourceTable}
              >
                {sourceList.map((k) => (
                  <MenuItem key={k.id} value={k.id}>
                    {k.name}
                  </MenuItem>
                ))}
              </Select>
              {sourceId !== "" && (
                <IconButton
                  size="small"
                  onClick={() => setSourceId("")}
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
            <FormControl fullWidth size="small">
              <InputLabel id={`${newEdgeId}-select-target-label`}>
                {`${t("tableForReference")}`}
              </InputLabel>
              <Select
                label={`${t("tableForReference")}`}
                labelId={`${newEdgeId}-select-target-label`}
                value={targetId}
                id={`${newEdgeId}-select-target-input`}
                onChange={handleChangeTargetTable}
              >
                {targetList.map((k) => (
                  <MenuItem key={k.id} value={k.id}>
                    {k.name}
                  </MenuItem>
                ))}
              </Select>
              {targetId !== "" && (
                <IconButton
                  size="small"
                  onClick={() => setTargetId("")}
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
        </Grid>
        <Box
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          gap={1}
          pt={1}
          my={1}
        >
          <FormControl>
            <InputLabel id={`${newEdgeId}-select-type-label`}>
              {t("selectType")}
            </InputLabel>
            <Select
              label={t("selectType")}
              labelId={`${newEdgeId}-select-type-label`}
              value={newRelationshipType}
              id={`${newEdgeId}-select-type-input`}
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
            value={newRelationshipName}
            onChange={handleChangeRelationshipName}
            disabled={isAutoNaming}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={t("autoNamingRelationshipName")}>
                      <IconButton
                        onClick={handleClickAutoNaming}
                        aria-label={
                          isAutoNaming
                            ? "auto-set foreign key name"
                            : "setting foreign key name manually"
                        }
                        edge="end"
                        color="info"
                        disabled={!sourceId || !targetId}
                      >
                        <AutoAwesome
                          color={isAutoNaming ? "primary" : "disabled"}
                        />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
        {sourceId && targetId && (
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
                <InputLabel id={`${newEdgeId}-select-referential-action-label`}>
                  {t("forUpdate")}
                </InputLabel>
                <Select
                  label={t("forUpdate")}
                  labelId={`${newEdgeId}-select-referential-action-label`}
                  value={newReferentialActionForUpdate}
                  id={`${newEdgeId}-select-referential-action-input`}
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
                <InputLabel id={`${newEdgeId}-select-referential-action-label`}>
                  {t("forDelete")}
                </InputLabel>
                <Select
                  label={t("forDelete")}
                  labelId={`${newEdgeId}-select-referential-action-label`}
                  value={newReferentialActionForDelete}
                  id={`${newEdgeId}-select-referential-action-input`}
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
                <InputLabel id={`${newEdgeId}-select-target-columns-label`}>
                  {`${t("primaryKeyOnReferenceTable")} ${targetNode?.data.tableName}`}
                </InputLabel>
                <Select
                  label={`${t("primaryKeyOnReferenceTable")} ${targetNode?.data.tableName}`}
                  labelId={`${newEdgeId}-select-target-columns-label`}
                  value={targetSelectedKey.id}
                  id={`${newEdgeId}-select-type-input`}
                  onChange={handleChangeTargetSelectedKey}
                >
                  {targetKeyList.map((k) => (
                    <MenuItem key={k.id} value={k.id}>
                      {k.keyName}
                    </MenuItem>
                  ))}
                </Select>
                {targetSelectedKey.id !== "" && (
                  <IconButton
                    size="small"
                    onClick={() =>
                      setTargetSelectedKey({
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
                      <TableRow key={i}>
                        <TableCell padding="none">
                          <Select
                            id={`${newEdgeId}-columns-relation-selector`}
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
                    {targetSelectedKey.columns?.map((c) => (
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
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t("cancel")}</Button>
        <Button
          onClick={handleSubmitNewEdge}
          disabled={!sourceId || !targetId || !newRelationshipName}
        >
          {t("add")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
