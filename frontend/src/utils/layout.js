import dagre from 'dagre';
import { Position } from '@xyflow/react';

const NODE_WIDTH = 300;
const NODE_HEIGHT = 100;

/**
 * Uses the Dagre library to compute a proper hierarchical tree layout
 * for a set of React Flow nodes and edges.
 * 
 * Direction: Top-to-Bottom (TB) strictly enforced.
 */
export const getLayoutedElements = (nodes, edges) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: 'TB',
    nodesep: 150,     // Horizontal spacing between nodes on same rank
    ranksep: 200,     // Vertical spacing between ranks (levels)
    edgesep: 80,      // Spacing between edges
    marginx: 80,
    marginy: 80,
  });

  // Add all nodes to the dagre graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Add all edges to the dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Run the layout algorithm
  dagre.layout(dagreGraph);

  // Map back the computed positions to React Flow nodes
  const layoutedNodes = nodes.map((node) => {
    const dagreNode = dagreGraph.node(node.id);

    if (!dagreNode) {
      // Orphan node that dagre couldn't place — put it off to the side
      return {
        ...node,
        position: { x: 0, y: 0 },
        targetPosition: Position.Top,
        sourcePosition: Position.Bottom,
      };
    }

    return {
      ...node,
      // Dagre gives center coordinates; React Flow uses top-left origin
      position: {
        x: dagreNode.x - NODE_WIDTH / 2,
        y: dagreNode.y - NODE_HEIGHT / 2,
      },
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
    };
  });

  // Normalize ALL edges for consistent top-to-bottom rendering
  const layoutedEdges = edges.map((edge) => {
    return {
      ...edge,
      // FORCE consistent handles — Dagre positions everything TB,
      // so all edges must flow from bottom of source to top of target
      sourceHandle: 's-bottom',
      targetHandle: 't-top',
      type: 'smoothstep',
      className: edge.className || 'spine-edge'
    };
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
};
