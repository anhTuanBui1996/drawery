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
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import EntityNode from "@/src/components/custom/drawing/TableNodeItem";
import RelationEdge from "@/src/components/custom/drawing/RelationEdgeItem";
import { NodeRelationEdge, TableNodeData } from "@/src/types/model/TableNode";
import { useLoaderDispatch } from "@/src/components/provider/LoaderProvider";

const nodeTypes = { tableNode: EntityNode };
const edgeTypes = { foreignKeyEdge: RelationEdge };

export default function ERD({ id }: { id: string }) {
  const s = useColorScheme();
  const erdInitialize = useDrawingFetchData();
  const nodeAndEdgeInitialize = useDrawingFetchNodeAndEdge();
  const isFirstLoading = useDrawingIsFirstLoading();
  const isLoading = useDrawingLoadingStatus();
  const loader = useLoaderDispatch();
  const [nodes, _, onNodesChange] = useNodesState<TableNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<NodeRelationEdge>([]);

  const getNodeColor = (node: TableNodeData) => node.data.color;
  const getNodeClassName = (node: TableNodeData) => node.type;
  const onConnect = useCallback(
    (params: Connection) => {
      // Tìm node nguồn và node đích dựa trên ID từ Connection
      const sourceNode = nodes.find((node) => node.id === params.source);
      const targetNode = nodes.find((node) => node.id === params.target);

      const sourceTableName = sourceNode?.data.tableName || "Source";
      const targetTableName = targetNode?.data.tableName || "Target";

      // Sinh tên quan hệ tự động (hoặc để trống tùy bạn)
      const generatedRelationName = `FK_${sourceTableName}_${targetTableName}_0`;
      const newEdge: NodeRelationEdge = {
        ...params,
        type: "foreignKeyEdge",
        id: `${params.source}-${params.target}-${Date.now()}`,
        data: {
          diagramId: id,
          relationType: "N - 1",
          relationshipName: generatedRelationName, // Đã lấy được tên bảng động ở đây
          isAutoNaming: true,
          referentialAction: "noAction",
          sourceColumns: [],
          targetColumns: [],
        },
      };
      setEdges((edgesSnapshot) => addEdge(newEdge, edgesSnapshot));
    },
    [id, nodes],
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
    </>
  );
}
