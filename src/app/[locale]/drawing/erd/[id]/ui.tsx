"use client";

import {
  useDrawingFetchData,
  useDrawingFetchNodeAndEdge,
  useDrawingIsFirstLoading,
  useDrawingLoadingStatus,
} from "@/src/components/provider/DrawingProvider";
import { Box, useColorScheme } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  NodeChange,
  EdgeChange,
  Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import EntityNode from "@/src/components/custom/drawing/TableNodeItem";
import { NodeRelationEdge, TableNodeData } from "@/src/types/model/TableNode";
import { useLoaderDispatch } from "@/src/components/provider/LoaderProvider";

const nodeTypes = { tableNode: EntityNode };

export default function ERD({ id }: { id: string }) {
  const s = useColorScheme();
  const erdInitialize = useDrawingFetchData();
  const nodeAndEdgeInitialize = useDrawingFetchNodeAndEdge();
  const isFirstLoading = useDrawingIsFirstLoading();
  const isLoading = useDrawingLoadingStatus();
  const loader = useLoaderDispatch();
  const [nodes, setNodes] = useState<TableNodeData[]>([]);
  const [edges, setEdges] = useState<NodeRelationEdge[]>([]);

  const onNodesChange = useCallback(
    (changes: NodeChange<TableNodeData>[]) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange<NodeRelationEdge>[]) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  useEffect(() => {
    erdInitialize!(id, true);
    nodeAndEdgeInitialize!(id);
  }, []);

  useEffect(() => {
    if (isFirstLoading && isLoading) {
      loader!({ type: "show" });
    } else {
      loader!({ type: "hide" });
    }
  }, [loader, isFirstLoading, isLoading]);

  return (
    <>
      <Box width={"100%"} height={"calc(100vh - 64px)"}>
        <ReactFlow
          colorMode={s.mode}
          nodeTypes={nodeTypes}
          fitView
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        >
          <Background variant={BackgroundVariant.Lines} />
          <Controls />
        </ReactFlow>
      </Box>
    </>
  );
}
