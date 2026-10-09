"use client";

import {
  useDrawingEdges,
  useDrawingFetchData,
  useDrawingFetchNodeAndEdge,
  useDrawingIsFirstLoading,
  useDrawingLoadingStatus,
  useDrawingNodes,
  useDrawingStore,
  useDrawingUpdateNodes,
  useDrawingUpdateEdges,
} from "@/src/components/provider/DrawingProvider";
import { Box, useColorScheme } from "@mui/material";
import { useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  EdgeChange,
  NodeChange,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import EntityNode from "@/src/components/custom/drawing/TableNodeItem";
import RelationEdge from "@/src/components/custom/drawing/RelationEdgeItem";
import {
  NodeRelationEdge,
  TableNodeData,
} from "@/src/types/model/ExtendedNodeEdge";
import { useLoaderDispatch } from "@/src/components/provider/LoaderProvider";
import { getRandomMuiColor } from "@/src/utils/client";
import { nanoid } from "nanoid";

const nodeTypes = { tableNode: EntityNode };
const edgeTypes = { foreignKeyEdge: RelationEdge };

export default function Canvas({ id }: { id: string }) {
  const s = useColorScheme();
  const erdInitialize = useDrawingFetchData();
  const nodeAndEdgeInitialize = useDrawingFetchNodeAndEdge();
  const isFirstLoading = useDrawingIsFirstLoading();
  const isLoading = useDrawingLoadingStatus();
  const loader = useLoaderDispatch();

  // The store is the single source of truth: no local useNodesState/useEdgesState
  const nodes = useDrawingNodes();
  const edges = useDrawingEdges();
  const updateNode = useDrawingUpdateNodes();
  const updateEdge = useDrawingUpdateEdges();

  const getNodeColor = (node: TableNodeData) => node.data.color;
  const getNodeClassName = (node: TableNodeData) => node.type;

  // Read the latest state via getState() so callbacks stay stable and never go stale
  const onNodesChange = useCallback(
    (changes: NodeChange<TableNodeData>[]) => {
      updateNode(applyNodeChanges(changes, useDrawingStore.getState().nodes));
    },
    [updateNode],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<NodeRelationEdge>[]) => {
      updateEdge(applyEdgeChanges(changes, useDrawingStore.getState().edges));
    },
    [updateEdge],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const { nodes: currentNodes, edges: currentEdges } =
        useDrawingStore.getState();

      // Find source and target nodes from the connection ids
      const sourceNode = currentNodes.find((node) => node.id === params.source);
      const targetNode = currentNodes.find((node) => node.id === params.target);

      const sourceTableName = sourceNode?.data.tableName || "Source";
      const targetTableName = targetNode?.data.tableName || "Target";

      // Auto-generate the relationship name
      const generatedRelationName = `FK_${sourceTableName}_${targetTableName}_0`;
      const newEdge: NodeRelationEdge = {
        ...params,
        type: "foreignKeyEdge",
        id: `edge_${nanoid()}`,
        data: {
          diagramId: id,
          index: currentEdges.length,
          color: getRandomMuiColor(),
          relationType: "N - 1",
          relationshipName: generatedRelationName,
          isAutoNaming: true,
          referentialActionForUpdate: "noAction",
          referentialActionForDelete: "noAction",
          targetSelectedKey: {
            id: "",
          },
          sourceColumns: [],
        },
        selected: true,
      };
      updateEdge(addEdge(newEdge, currentEdges));
    },
    [id, updateEdge],
  );

  // Load diagram info and nodes/edges on mount
  useEffect(() => {
    erdInitialize(id, true);
    nodeAndEdgeInitialize(id);
  }, []);

  // Show the loader while loading data
  useEffect(() => {
    if (isFirstLoading && isLoading) {
      loader!({ type: "show" });
    } else {
      loader!({ type: "hide" });
    }
  }, [loader, isFirstLoading, isLoading]);

  return (
    <Box width={"100%"} height={"calc(100vh - 64px)"}>
      <ReactFlow
        colorMode={s.mode}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <MiniMap
          zoomable
          pannable
          nodeClassName={getNodeClassName}
          nodeColor={getNodeColor}
        />
        <Background variant={BackgroundVariant.Lines} />
        <Controls />
      </ReactFlow>
    </Box>
  );
}
