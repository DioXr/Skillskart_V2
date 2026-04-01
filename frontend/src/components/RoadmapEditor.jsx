import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import axios from 'axios';
import ProNode from './ProNode';
import '@xyflow/react/dist/style.css';

const nodeTypes = { proNode: ProNode };

const RoadmapEditor = ({ roadmapId, onSaveComplete }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Career');
  const [description, setDescription] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeDesc, setNodeDesc] = useState('');
  const [nodeCode, setNodeCode] = useState('');
  const [nodeResources, setNodeResources] = useState([]);

  useEffect(() => {
    if (roadmapId && roadmapId !== 'new') {
      fetchRoadmap();
    }
  }, [roadmapId]);

  const fetchRoadmap = async () => {
    try {
      const { data } = await axios.get(`/api/roadmaps/${roadmapId}`);
      setTitle(data.title);
      setCategory(data.category);
      setDescription(data.description || '');
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    } catch (error) {
      console.error('Error fetching roadmap:', error);
    }
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#00e5ff' } }, eds)),
    [setEdges]
  );

  const addNode = () => {
    const newNode = {
      id: `node_${Date.now()}`,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: 'New Skill', description: '' },
      style: { background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '8px', padding: '10px', width: 150 },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const onNodeClick = (_, node) => {
    setSelectedNode(node);
    setNodeLabel(node.data.label || '');
    setNodeDesc(node.data.description || '');
    setNodeCode(node.data.codeSnippet || '');
    setNodeResources(node.data.resources || []);
  };

  const updateNodeData = () => {
    if (!selectedNode) return;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: { 
                ...node.data, 
                label: nodeLabel, 
                description: nodeDesc, 
                codeSnippet: nodeCode,
                resources: nodeResources
            },
          };
        }
        return node;
      })
    );
    setSelectedNode(null);
  };

  const saveRoadmap = async () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const roadmapData = {
      title,
      category,
      description,
      nodes,
      edges,
    };

    try {
      if (roadmapId === 'new') {
        await axios.post('/api/roadmaps', roadmapData, config);
      } else {
        await axios.put(`/api/roadmaps/${roadmapId}`, roadmapData, config);
      }
      alert('Roadmap Saved Successfully!');
      onSaveComplete();
    } catch (error) {
      alert('Error saving roadmap: ' + error.response?.data?.message);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: '20px' }}>
      {/* Editor Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', display: 'flex', gap: '20px' }}>
          <input 
            type="text" 
            placeholder="Roadmap Title (e.g. Python Developer)" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ flex: 2, background: 'transparent', border: '1px solid #333', padding: '10px', borderRadius: '5px', color: '#fff' }}
          />
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ flex: 1, background: '#111', border: '1px solid #333', padding: '10px', borderRadius: '5px', color: '#fff' }}
          >
            <option value="Career">Career</option>
            <option value="Coding">Coding</option>
            <option value="Design">Design</option>
            <option value="Custom">Custom</option>
          </select>
          <button className="btn-primary" onClick={saveRoadmap}>Save All Changes</button>
        </div>

        <div className="glass-panel" style={{ flex: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 5 }}>
            <button className="btn-secondary" onClick={addNode}>+ Add Skill Node</button>
          </div>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
            colorMode="dark"
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={20} size={1} />
          </ReactFlow>
        </div>
      </div>

      {/* Sidebar for Node Details */}
      <div className="glass-panel" style={{ width: '300px', padding: '20px' }}>
        <h3>Node Inspector</h3>
        {selectedNode ? (
          <div>
            <p style={{ color: '#888', fontSize: '0.8rem' }}>ID: {selectedNode.id}</p>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Label</label>
              <input 
                type="text" 
                value={nodeLabel}
                onChange={(e) => setNodeLabel(e.target.value)}
                style={{ width: '100%', background: '#222', border: '1px solid #444', padding: '8px', color: '#fff' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', color: 'var(--accent-color)' }}>Code Snippet</label>
              <textarea 
                rows="4"
                value={nodeCode}
                onChange={(e) => setNodeCode(e.target.value)}
                style={{ width: '100%', background: '#111', border: '1px solid #444', padding: '8px', color: '#00ff88', fontFamily: 'monospace', fontSize: '0.8rem' }}
                placeholder="e.g. git commit -m 'Initial'"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', color: 'var(--accent-color)' }}>Resources ({nodeResources.length})</label>
              <button className="btn-secondary" style={{ fontSize: '0.7rem', padding: '4px 8px', marginBottom: '10px' }} onClick={() => {
                const label = prompt('Resource Label:');
                const url = prompt('Resource URL:');
                const type = prompt('Type (video/docs/article/code):', 'article');
                if (label && url) setNodeResources([...nodeResources, { label, url, type }]);
              }}>+ Add Link</button>
              <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                {nodeResources.map((r, i) => (
                    <div key={i} style={{ fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between', marginBottom: '4px', background: '#222', padding: '4px' }}>
                        <span>{r.label}</span>
                        <span style={{ color: 'red', cursor: 'pointer' }} onClick={() => setNodeResources(nodeResources.filter((_, idx)=> idx !== i))}>X</span>
                    </div>
                ))}
              </div>
            </div>

            <button className="btn-primary" style={{ width: '100%' }} onClick={updateNodeData}>Update Milestone</button>
          </div>
        ) : (
          <p style={{ color: '#666' }}>Select a node on the canvas to edit its details.</p>
        )}
      </div>
    </div>
  );
};

export default RoadmapEditor;
