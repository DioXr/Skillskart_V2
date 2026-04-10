import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import axios from 'axios';
import ProNode from './ProNode';
import { getLayoutedElements } from '../utils/layout';
import '@xyflow/react/dist/style.css';

const nodeTypes = { proNode: ProNode };

const RoadmapEditorInner = ({ roadmapId, onSaveComplete }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Career');
  const [description, setDescription] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeDesc, setNodeDesc] = useState('');
  const [nodeCode, setNodeCode] = useState('');
  const [nodeResources, setNodeResources] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flooding, setFlooding] = useState(false);
  const [resLabel, setResLabel] = useState('');
  const [resUrl, setResUrl] = useState('');
  const { user } = JSON.parse(localStorage.getItem('userInfo')) || {};
  const { fitView } = useReactFlow();

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
    (params) => setEdges((eds) => addEdge({ 
        ...params, 
        type: 'smoothstep', 
        animated: false, 
        className: 'branch-edge'
    }, eds)),
    [setEdges]
  );

  const addNode = () => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: 'proNode',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: 'New Skill', description: '', isSpine: false },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const onNodeClick = (_, node) => {
    setSelectedNode(node);
    setSelectedEdge(null); // Deselect edge when a node is clicked
    setNodeLabel(node.data.label || '');
    setNodeDesc(node.data.description || '');
    setNodeCode(node.data.codeSnippet || '');
    setNodeResources(node.data.resources || []);
  };

  const onEdgeClick = useCallback((_, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null); // Deselect node when an edge is clicked
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedEdge(null);
    setSelectedNode(null);
  }, []);

  const deleteSelectedEdge = useCallback(() => {
    if (!selectedEdge) return;
    setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
    setSelectedEdge(null);
  }, [selectedEdge, setEdges]);

  const deleteNode = useCallback((id) => {
    if (!window.confirm("Are you sure you want to delete this skill milestone?")) return;
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    if (selectedNode && selectedNode.id === id) setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  const onNodesDelete = useCallback((deleted) => {
    if (selectedNode && deleted.some(n => n.id === selectedNode.id)) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  const onEdgesDelete = useCallback((deleted) => {
    if (selectedEdge && deleted.some(e => e.id === selectedEdge.id)) {
      setSelectedEdge(null);
    }
  }, [selectedEdge]);

  const updateNodeField = (field, value) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          const updatedNode = {
            ...node,
            data: { ...node.data, [field]: value },
          };
          // Keep internal state in sync
          if (field === 'label') setNodeLabel(value);
          if (field === 'description') setNodeDesc(value);
          if (field === 'codeSnippet') setNodeCode(value);
          return updatedNode;
        }
        return node;
      })
    );
  };

  const addResource = () => {
    if (!resLabel || !resUrl) return;
    const newRes = { label: resLabel, url: resUrl, type: 'article' };
    const updatedRes = [...nodeResources, newRes];
    setNodeResources(updatedRes);
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return { ...node, data: { ...node.data, resources: updatedRes } };
        }
        return node;
      })
    );
    setResLabel('');
    setResUrl('');
  };

  const removeResource = (index) => {
    const updatedRes = nodeResources.filter((_, i) => i !== index);
    setNodeResources(updatedRes);
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return { ...node, data: { ...node.data, resources: updatedRes } };
        }
        return node;
      })
    );
  };

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
    // Auto-fit the view after layout settles
    setTimeout(() => fitView({ padding: 0.2, duration: 500 }), 100);
  }, [nodes, edges, setNodes, setEdges, fitView]);

  const handleFlood = async () => {
    if (!nodes.length) return;
    if (!window.confirm("Skills flooding will automatically write descriptions and resources for EVERY node in this roadmap. Overwrite current details?")) return;
    
    setFlooding(true);
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    
    try {
      const { data: fullRoadmap } = await axios.post('/api/ai/flood', {
        title: title,
        nodes: nodes
      }, config);

      console.log("🌊 AI Flood Data Received:", fullRoadmap);

      // 🏗️ GHOST REPAIR: If AI missed a field, don't crash—just use empty defaults
      const rawNodes = fullRoadmap.nodes || [];
      const rawEdges = fullRoadmap.edges || [];

      if (rawNodes.length === 0) {
          throw new Error("AI failed to generate any logical milestones. Try a more specific topic name.");
      }

      // 🛡️ ID SANITIZATION: Generate truly unique IDs to prevent key collisions
      const idMap = {};
      const sanitizedNodes = rawNodes.map((n, idx) => {
          const originalId = n.id || `temp_${idx}`;
          const newId = `node_f_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
          idMap[originalId] = newId; 
          
          // 🧬 Resource ID Sanitization
          const cleanResources = (n.data?.resources || []).map((r, rIdx) => ({
             ...r,
             id: `res_f_${Math.random().toString(36).substring(2, 6)}_${rIdx}_${Date.now()}`
          }));

          return { 
            ...n, 
            id: newId,
            type: n.type || 'proNode',
            data: {
              ...n.data,
              label: n.data?.label || "New Milestone",
              description: n.data?.description || "Curriculum details pending...",
              codeSnippet: n.data?.codeSnippet || `// ${n.data?.label || 'Example'}\n// Code sample coming soon\nconsole.log("Learn ${n.data?.label || 'this topic'}");`,
              resources: cleanResources.length > 0 ? cleanResources : [
                { label: `Search ${n.data?.label || 'this topic'}`, url: `https://www.google.com/search?q=${encodeURIComponent(n.data?.label || 'programming')}+tutorial`, type: 'website' }
              ]
            }
          };
      });

      const sanitizedEdges = rawEdges.map((e, idx) => {
          // 🚢 FUZZY LINKER: Match by ID first, then by Label (Skill Name)
          let sourceId = idMap[e.source] || e.source;
          let targetId = idMap[e.target] || e.target;

          // If ID lookup failed, try matching by Label (Skill Name)
          if (!sanitizedNodes.some(n => n.id === sourceId)) {
            const foundSource = sanitizedNodes.find(n => 
              n.data.label.toLowerCase() === e.source?.toLowerCase()
            );
            if (foundSource) sourceId = foundSource.id;
          }

          if (!sanitizedNodes.some(n => n.id === targetId)) {
            const foundTarget = sanitizedNodes.find(n => 
              n.data.label.toLowerCase() === e.target?.toLowerCase()
            );
            if (foundTarget) targetId = foundTarget.id;
          }

          return {
              ...e,
              id: `edge_f_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
              source: sourceId,
              target: targetId,
              sourceHandle: 's-bottom',
              targetHandle: 't-top',
              type: 'smoothstep',
              className: e.className || 'spine-edge'
          };
      }).filter(e => {
        // Final integrity check
        return sanitizedNodes.some(n => n.id === e.source) && 
               sanitizedNodes.some(n => n.id === e.target);
      });

      // 🔗 CHAIN LINK FALLBACK: Ensure NO node is an island
      sanitizedNodes.forEach((n, idx) => {
          const isConnected = sanitizedEdges.some(e => e.source === n.id || e.target === n.id);
          if (!isConnected && idx > 0) {
              sanitizedEdges.push({
                  id: `edge_chain_${Date.now()}_${idx}`,
                  source: sanitizedNodes[idx-1].id,
                  target: n.id,
                  sourceHandle: 's-bottom',
                  targetHandle: 't-top',
                  type: 'smoothstep',
                  className: 'spine-edge'
              });
          }
      });

      // 📐 Layout the new structure using Dagre
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(sanitizedNodes, sanitizedEdges);
      
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      // Auto-fit the view after flood
      setTimeout(() => fitView({ padding: 0.2, duration: 500 }), 200);
      
      alert(`🌊 Smart Flood Complete! Cultivated ${sanitizedNodes.length} professional milestones.`);
    } catch (error) {
      console.error("Smart Flood Critical Error:", error);
      alert(error.message || "AI architecting failed. Please try again.");
    } finally {
      setFlooding(false);
    }
  };

  const saveRoadmap = async () => {
    setSaving(true);
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

  // Find source and target node labels for selected edge display
  const getEdgeLabel = (edge) => {
    if (!edge) return '';
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    return `${sourceNode?.data?.label || '?'} → ${targetNode?.data?.label || '?'}`;
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: '20px' }}>
      {/* Editor Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="card" style={{ padding: '16px 20px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Roadmap title..." 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="search-input"
            style={{ flex: 2, minWidth: '200px' }}
          />
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ background: 'var(--card)', border: '1px solid var(--card-border)', padding: '10px', borderRadius: '8px', color: 'var(--text)', fontSize: '0.85rem' }}
          >
            <option value="Career">Career</option>
            <option value="Coding">Coding</option>
            <option value="Design">Design</option>
            <option value="Custom">Custom</option>
          </select>
          <button className="btn-secondary" onClick={onLayout} style={{ padding: '10px 16px', fontSize: '0.8rem' }}>Auto Layout</button>
          
          <button 
            className="btn-secondary" 
            onClick={() => setShowPreview(!showPreview)} 
            style={{ padding: '10px 16px', fontSize: '0.8rem', background: showPreview ? 'var(--accent)' : 'transparent', color: showPreview ? '#fff' : 'var(--text)' }}
          >
            {showPreview ? 'Exit Preview' : 'Preview'}
          </button>

          <button 
            className="btn-accent" 
            onClick={handleFlood} 
            disabled={flooding}
            style={{ padding: '10px 16px', fontSize: '0.8rem' }}
          >
            {flooding ? "Flooding..." : "Flood Content"}
          </button>

          <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.8rem' }} onClick={saveRoadmap} disabled={saving}>
             {saving ? 'Saving...' : (roadmapId === 'new' ? 'Create' : 'Save')}
          </button>
        </div>

        {showPreview ? (
            <div className="card animate-fade-in" style={{ flex: 1, padding: '20px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, background: 'var(--accent)', color: '#fff', padding: '4px 12px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '600' }}>
                    PREVIEW
                </div>
                <div style={{ height: '100%', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        fitView
                        colorMode="dark"
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={false}
                    >
                        <Background variant="dots" gap={20} size={1} />
                    </ReactFlow>
                </div>
            </div>
        ) : (
            <div className="card" style={{ flex: 1, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 5 }}>
                    <button className="btn-secondary" onClick={addNode} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>+ Add Node</button>
                </div>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onEdgeClick={onEdgeClick}
                    onPaneClick={onPaneClick}
                    onNodesDelete={onNodesDelete}
                    onEdgesDelete={onEdgesDelete}
                    nodeTypes={nodeTypes}
                    fitView
                    colorMode="dark"
                    deleteKeyCode={['Backspace', 'Delete']}
                    edgesReconnectable
                >
                    <Controls />
                    <MiniMap />
                    <Background variant="dots" gap={20} size={1} />
                </ReactFlow>
            </div>
        )}
      </div>

      {/* Node / Edge Inspector */}
      <div className="card" style={{ width: '340px', padding: '28px', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {selectedEdge ? 'Edge Inspector' : 'Node Inspector'}
        </h3>

        {/* ── Edge Inspector ── */}
        {selectedEdge ? (
          <div className="animate-fade-in">
            <div style={{ 
              padding: '20px', 
              background: 'rgba(10, 132, 255, 0.08)', 
              border: '1px solid rgba(10, 132, 255, 0.2)', 
              borderRadius: '12px', 
              marginBottom: '24px' 
            }}>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>Connection</label>
              <p style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                {getEdgeLabel(selectedEdge)}
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Edge Type</label>
              <p style={{ fontSize: '0.85rem', color: '#aaa', fontFamily: 'monospace' }}>
                {selectedEdge.className === 'spine-edge' ? '🔵 Spine (Main Path)' : '⚪ Branch (Sub-topic)'}
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Edge ID</label>
              <p style={{ fontSize: '0.65rem', color: '#555', fontFamily: 'monospace' }}>{selectedEdge.id}</p>
            </div>

            <button 
              onClick={deleteSelectedEdge}
              style={{ 
                width: '100%', 
                background: 'rgba(255, 68, 68, 0.1)', 
                color: '#ff4444', 
                border: '1px solid rgba(255, 68, 68, 0.2)', 
                padding: '14px', 
                borderRadius: '10px', 
                fontWeight: '800', 
                fontSize: '0.75rem', 
                textTransform: 'uppercase', 
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginTop: '8px'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 68, 68, 0.2)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)'; }}
            >
              🗑️ Delete Connection
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#666', marginTop: '16px' }}>
              Tip: You can also select an edge and press <kbd style={{ background: '#222', padding: '2px 6px', borderRadius: '4px', border: '1px solid #444' }}>Delete</kbd> or <kbd style={{ background: '#222', padding: '2px 6px', borderRadius: '4px', border: '1px solid #444' }}>Backspace</kbd>
            </p>
          </div>
        ) : selectedNode ? (
          /* ── Node Inspector ── */
          <div className="animate-fade-in">
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', marginBottom: '24px', fontFamily: 'monospace', opacity: 0.5 }}>UID: {selectedNode.id}</p>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Skill Node Label</label>
              <input 
                type="text" 
                value={nodeLabel}
                onChange={(e) => updateNodeField('label', e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', padding: '12px', borderRadius: '8px', color: '#fff', fontSize: '1rem', fontWeight: '600' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Curriculum Summary</label>
                <textarea 
                    rows="4"
                    value={nodeDesc}
                    onChange={(e) => updateNodeField('description', e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', padding: '12px', borderRadius: '8px', color: '#ccc', fontSize: '0.9rem', lineHeight: '1.6' }}
                    placeholder="Provide a deep-dive description..."
                />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#00ff88', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Code Benchmark</label>
              <textarea 
                rows="4"
                value={nodeCode}
                onChange={(e) => updateNodeField('codeSnippet', e.target.value)}
                style={{ width: '100%', background: '#000', border: '1px solid rgba(0,255,136,0.15)', padding: '14px', borderRadius: '8px', color: '#00ff88', fontFamily: 'monospace', fontSize: '0.85rem' }}
                placeholder="e.g. git flow init"
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Learning Assets ({nodeResources.length})</label>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {nodeResources.map((r, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ color: '#fff', opacity: 0.9 }}>{r.label}</span>
                        <span style={{ color: '#ff4d4d', cursor: 'pointer', fontWeight: '800' }} onClick={() => removeResource(i)}>✕</span>
                    </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" placeholder="Title" value={resLabel} onChange={(e) => setResLabel(e.target.value)} style={{ flex: 1, background: '#111', border: '1px solid #333', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', color: '#fff' }} />
                <input type="text" placeholder="URL" value={resUrl} onChange={(e) => setResUrl(e.target.value)} style={{ flex: 2, background: '#111', border: '1px solid #333', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', color: '#fff' }} />
                <button className="btn-secondary" onClick={addResource} style={{ padding: '0 12px' }}>+</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => deleteNode(selectedNode.id)}
                style={{ flex: 1, background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', border: '1px solid rgba(255, 68, 68, 0.2)', padding: '14px', borderRadius: '10px', fontWeight: '800', fontSize: '0.65rem', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Delete Milestone
              </button>
              <button 
                onClick={() => setSelectedNode(null)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.03)', color: '#fff', border: '1px solid var(--surface-border)', padding: '14px', borderRadius: '10px', fontWeight: '800', fontSize: '0.65rem', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* ── Empty State ── */
          <div style={{ height: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#666', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '24px', opacity: 0.1 }}>🛠️</div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1.1rem' }}>Architect your path</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Select a node on the canvas to configure deep-dive resources and implementation guides.</p>
            <p style={{ fontSize: '0.75rem', color: '#555', lineHeight: '1.5', marginTop: '16px' }}>Click an edge (connection line) to inspect or delete it.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Wrap with ReactFlowProvider so useReactFlow() works
const RoadmapEditor = (props) => (
  <ReactFlowProvider>
    <RoadmapEditorInner {...props} />
  </ReactFlowProvider>
);

export default RoadmapEditor;
