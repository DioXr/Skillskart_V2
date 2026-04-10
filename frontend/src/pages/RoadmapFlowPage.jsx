import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ProNode from '../components/ProNode';
import '@xyflow/react/dist/style.css';

const nodeTypes = { proNode: ProNode };

const RoadmapFlowPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isCustom = location.pathname.startsWith('/custom/');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [roadmap, setRoadmap] = useState(null);
  const [nodeStatuses, setNodeStatuses] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => { fetchData(); }, [id, user]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const fetchData = async () => {
    try {
      const apiUrl = isCustom ? `/api/custom-roadmaps/${id}` : `/api/roadmaps/${id}`;
      const config = user ? { headers: { Authorization: `Bearer ${user.token}` } } : {};
      const { data: roadmapData } = await axios.get(apiUrl, config);
      setRoadmap(roadmapData);

      let statusMap = {};
      if (user) {
        try {
          const { data } = await axios.get(`/api/progress/${id}`, config);
          if (Array.isArray(data)) {
            data.forEach(item => {
              if (typeof item === 'string') statusMap[item] = 'done';
              else if (item.nodeId) statusMap[item.nodeId] = item.status;
            });
          }
        } catch (e) { /* No progress yet */ }
      }
      setNodeStatuses(statusMap);

      const styledNodes = (roadmapData.nodes || []).map(node => ({
        ...node,
        data: { ...node.data, status: statusMap[node.id] || 'not-started' }
      }));

      const normalizedEdges = (roadmapData.edges || []).map(edge => ({
        ...edge,
        sourceHandle: 's-bottom',
        targetHandle: 't-top',
        type: 'smoothstep',
        style: { stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1.5 },
      }));

      setNodes(styledNodes);
      setEdges(normalizedEdges);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onNodeClick = (_, node) => { setSelectedNode(node); setContextMenu(null); };

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id, nodeLabel: node.data.label });
  }, []);

  const onPaneClick = useCallback(() => { setSelectedNode(null); setContextMenu(null); }, []);

  const setNodeStatus = (nodeId, status) => {
    setNodeStatuses(prev => {
      const updated = { ...prev };
      if (status === 'reset') delete updated[nodeId];
      else updated[nodeId] = status;
      return updated;
    });
    setNodes(nds => nds.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, status: status === 'reset' ? 'not-started' : status } } : n
    ));
    setContextMenu(null);
  };

  const saveProgress = async () => {
    if (!user) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const completedNodes = Object.entries(nodeStatuses)
        .filter(([_, status]) => status === 'done')
        .map(([nodeId]) => nodeId);
      await axios.post('/api/progress/save', { roadmapId: id, completedNodes }, config);
      alert('Progress saved!');
    } catch (error) {
      alert('Failed to save progress.');
    }
  };

  const totalNodes = roadmap?.nodes?.length || 0;
  const doneCount = Object.values(nodeStatuses).filter(s => s === 'done').length;
  const inProgressCount = Object.values(nodeStatuses).filter(s => s === 'in-progress').length;
  const skippedCount = Object.values(nodeStatuses).filter(s => s === 'skipped').length;
  const donePercent = totalNodes ? Math.round((doneCount / totalNodes) * 100) : 0;

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '120px', color: 'var(--text-muted)' }}>
      <p>Loading roadmap...</p>
    </div>
  );

  if (!roadmap) return (
    <div className="container" style={{ textAlign: 'center', padding: '120px' }}>
      <h2 style={{ marginBottom: '12px' }}>Roadmap Not Found</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>This roadmap doesn't exist.</p>
      <Link to="/explore"><button className="btn-primary">Back to Explore</button></Link>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--card-border)' }}>
        <div className="container" style={{ paddingTop: '28px', paddingBottom: '24px' }}>
          <Link to="/explore" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
            ← Back to Explore
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{roadmap.title}</h1>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '550px', fontSize: '0.9rem', lineHeight: '1.5' }}>{roadmap.description}</p>
            </div>
            <button className="btn-primary" onClick={saveProgress} disabled={!user}>
              {user ? 'Save Progress' : 'Login to Track'}
            </button>
          </div>

          {/* Progress */}
          {user && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div className="legend">
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: 'var(--success)' }} />
                    <span>Done ({doneCount})</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: 'var(--warning)' }} />
                    <span>In Progress ({inProgressCount})</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: 'var(--text-muted)' }} />
                    <span>Skipped ({skippedCount})</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', color: donePercent === 100 ? 'var(--success)' : 'var(--accent)', fontWeight: '700' }}>{donePercent}% complete</span>
              </div>
              <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${donePercent}%`, height: '100%', background: donePercent === 100 ? 'var(--success)' : 'var(--accent)', transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Flow + Sidebar */}
      <div className="container" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
        <div style={{ height: 'calc(100vh - 280px)', minHeight: '480px', display: 'flex', gap: '16px' }}>
          <div className="card" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {nodes.length > 0 ? (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onNodeContextMenu={onNodeContextMenu}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
                colorMode="dark"
                nodesDraggable={false}
                nodesConnectable={false}
              >
                <Controls position="bottom-left" />
                <MiniMap nodeColor="#333" maskColor="rgba(0,0,0,0.85)" style={{ backgroundColor: '#111', borderRadius: '8px' }} />
                <Background variant="dots" gap={24} size={1} color="rgba(255,255,255,0.04)" />
              </ReactFlow>
            ) : (
              <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                <p>This roadmap has no topics yet.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="card" style={{ width: '340px', padding: '0', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {selectedNode ? (
              <div className="animate-fade-in" style={{ padding: '28px' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '10px' }}>Topic Details</p>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '20px', lineHeight: '1.3' }}>{selectedNode.data.label}</h3>

                <div style={{ marginBottom: '24px' }}>
                  <p style={{ lineHeight: '1.7', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    {selectedNode.data.description || 'No description available for this topic.'}
                  </p>
                </div>

                {selectedNode.data.codeSnippet && (
                  <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '8px' }}>Code Example</p>
                    <div style={{
                      background: 'rgba(0,0,0,0.4)',
                      padding: '16px',
                      borderRadius: '8px',
                      fontFamily: 'JetBrains Mono, Consolas, monospace',
                      fontSize: '0.78rem',
                      color: '#a5f3fc',
                      overflowX: 'auto',
                      whiteSpace: 'pre-wrap',
                      border: '1px solid rgba(255,255,255,0.04)',
                      lineHeight: '1.6'
                    }}>
                      {selectedNode.data.codeSnippet}
                    </div>
                  </div>
                )}

                {selectedNode.data.resources?.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '10px' }}>Resources</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {selectedNode.data.resources.map((res, idx) => (
                        <a key={idx} href={res.url} target="_blank" rel="noopener noreferrer" style={{
                          padding: '10px 14px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--card-border)',
                          borderRadius: '8px',
                          color: 'var(--text-secondary)',
                          fontSize: '0.83rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          transition: 'all 0.15s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'var(--text)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >
                          <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                            {res.type === 'video' ? '▶' : '↗'}
                          </span>
                          {res.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '24px', lineHeight: '1.5' }}>
                  Right-click a node to change its status.
                </p>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--text-muted)' }}>
                  ◆
                </div>
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '6px', fontSize: '0.95rem' }}>Select a topic</h4>
                <p style={{ fontSize: '0.82rem', lineHeight: '1.5', maxWidth: '220px' }}>Click to see details. Right-click to update status.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: '6px 14px 4px', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            {contextMenu.nodeLabel}
          </div>
          <div className="context-menu-divider" />
          <button className="context-menu-item" onClick={() => setNodeStatus(contextMenu.nodeId, 'done')}>
            <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>✓</span> Done
          </button>
          <button className="context-menu-item" onClick={() => setNodeStatus(contextMenu.nodeId, 'in-progress')}>
            <span style={{ color: 'var(--warning)', fontSize: '0.7rem' }}>●</span> In Progress
          </button>
          <button className="context-menu-item" onClick={() => setNodeStatus(contextMenu.nodeId, 'skipped')}>
            <span style={{ color: 'var(--text-muted)' }}>—</span> Skip
          </button>
          <div className="context-menu-divider" />
          <button className="context-menu-item" onClick={() => setNodeStatus(contextMenu.nodeId, 'reset')}>
            <span style={{ color: 'var(--text-muted)' }}>↺</span> Reset
          </button>
        </div>
      )}
    </div>
  );
};

export default RoadmapFlowPage;
