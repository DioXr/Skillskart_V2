const mongoose = require('mongoose');
const Roadmap = require('../models/Roadmap');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

function getDepth(nodeId, edgesMap, memo) {
  if (memo[nodeId] !== undefined) return memo[nodeId];
  const children = edgesMap[nodeId] || [];
  if (children.length === 0) {
    memo[nodeId] = 1;
    return 1;
  }
  let maxChildDepth = 0;
  for (const child of children) {
    maxChildDepth = Math.max(maxChildDepth, getDepth(child, edgesMap, memo));
  }
  memo[nodeId] = 1 + maxChildDepth;
  return memo[nodeId];
}

function getLayoutedElements(nodes, edges) {
  const edgesMap = {};
  const nodeDegrees = {};
  
  nodes.forEach(n => {
      edgesMap[n.id] = [];
      nodeDegrees[n.id] = 0;
  });

  edges.forEach(e => {
      if (!edgesMap[e.source]) edgesMap[e.source] = [];
      edgesMap[e.source].push(e.target);
      nodeDegrees[e.target] = (nodeDegrees[e.target] || 0) + 1;
  });

  let roots = nodes.filter(n => nodeDegrees[n.id] === 0).map(n => n.id);
  if (roots.length === 0 && nodes.length > 0) roots = [nodes[0].id];

  const depths = {};
  nodes.forEach(n => getDepth(n.id, edgesMap, depths));

  const layoutedNodes = [];
  const layoutedEdges = [];
  
  let currentY = 50;
  const spineX = 500; 
  const placedNodes = new Set();

  const placeSpine = (nodeId) => {
      if (placedNodes.has(nodeId)) return;
      placedNodes.add(nodeId);

      const nodeObj = nodes.find(n => n.id === nodeId);
      if (!nodeObj) return;

      nodeObj.data = { ...nodeObj.data, isSpine: true };

      layoutedNodes.push({
          ...nodeObj,
          position: { x: spineX, y: currentY }
      });

      const children = edgesMap[nodeId] || [];
      if (children.length === 0) return;

      children.sort((a, b) => (depths[b] || 0) - (depths[a] || 0));
      const nextSpine = children[0];
      const branches = children.slice(1);

      let leftY = currentY;
      let rightY = currentY;
      
      branches.forEach((branchId, index) => {
          if (placedNodes.has(branchId)) return;
          placedNodes.add(branchId);
          const branchObj = nodes.find(n => n.id === branchId);
          if (!branchObj) return;
          
          const isRight = index % 2 === 0;
          let branchX, branchY, srcHandle, targetHandle;

          if (isRight) {
              branchX = spineX + 350;
              branchY = rightY;
              rightY += 150;
              srcHandle = 's-right';
              targetHandle = 't-left';
          } else {
              branchX = spineX - 350;
              branchY = leftY;
              leftY += 150;
              srcHandle = 's-left';
              targetHandle = 't-right';
          }

          branchObj.data = { ...branchObj.data, isSpine: false };
          
          layoutedNodes.push({
              ...branchObj,
              position: { x: branchX, y: branchY }
          });

          const origEdge = edges.find(e => e.source === nodeId && e.target === branchId);
          if (origEdge) {
              layoutedEdges.push({
                  ...origEdge,
                  sourceHandle: srcHandle,
                  targetHandle: targetHandle,
                  type: 'step',
                  className: 'branch-edge'
              });
          }
      });

      const spineEdge = edges.find(e => e.source === nodeId && e.target === nextSpine);
      if (spineEdge) {
          layoutedEdges.push({
              ...spineEdge,
              sourceHandle: 's-bottom',
              targetHandle: 't-top',
              type: 'step',
              className: 'spine-edge'
          });
      }

      currentY += Math.max(150, (Math.ceil(branches.length/2) * 150) + 150);
      placeSpine(nextSpine);
  };

  roots.forEach(root => placeSpine(root));

  // Style ALL edges to ensure they aren't default/thin
  edges.forEach(e => {
    if (!layoutedEdges.find(le => le.id === e.id)) {
        layoutedEdges.push({ 
            ...e, 
            type: 'step',
            className: 'branch-edge'
        });
    }
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
}

async function fixAllLayouts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for NEON REVOLUTION...");

        const all = await Roadmap.find({});
        console.log(`Found ${all.length} roadmaps to upgrade to HIGH-FIDEILTY.`);

        for (const r of all) {
            console.log(`Upgrading: ${r.title}...`);
            const { nodes, edges } = getLayoutedElements(
                JSON.parse(JSON.stringify(r.nodes)),
                JSON.parse(JSON.stringify(r.edges))
            );
            r.nodes = nodes;
            r.edges = edges;
            await r.save();
        }

        console.log("🔥 THE NEON REVOLUTION IS COMPLETE: Your roadmaps are finally alive!");
        process.exit(0);
    } catch (err) {
        console.error("Layout Fix Error:", err);
        process.exit(1);
    }
}

fixAllLayouts();
