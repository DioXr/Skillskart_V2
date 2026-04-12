import React, { useState, useCallback, useEffect } from 'react';
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
import { useToast } from '../context/ToastContext';
import ProNode from '../components/ProNode';
import '@xyflow/react/dist/style.css';

const nodeTypes = {
  proNode: ProNode,
  topicNode: ProNode,
  checkpointNode: ProNode,
  subtopicNode: ProNode,
  default: ProNode,
};

const EDGE_STYLES = {
  'spine-edge':      { stroke: '#3b82f6', strokeWidth: 2.5 },
  'branch-edge':     { stroke: 'rgba(148,163,184,0.4)', strokeWidth: 1.5, strokeDasharray: '4 3' },
  'checkpoint-edge': { stroke: 'rgba(100,116,139,0.5)', strokeWidth: 1.5, strokeDasharray: '6 4' },
};

const RoadmapFlowPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const isCustom = location.pathname.startsWith('/custom/');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [roadmap, setRoadmap] = useState(null);
  const [nodeStatuses, setNodeStatuses] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const [saving, setSaving] = useState(false);

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
        data: { ...node.data, status: statusMap[node.id] || 'not-started' },
        // Ensure type defaults to topicNode for new AI-generated maps
        type: node.type || 'topicNode',
      }));

      const styledEdges = (roadmapData.edges || []).map(edge => {
        const edgeStyle = EDGE_STYLES[edge.className] || EDGE_STYLES['spine-edge'];
        return {
          ...edge,
          type: 'smoothstep',
          style: { ...edgeStyle, ...(edge.style || {}) },
          animated: edge.className === 'spine-edge',
        };
      });

      setNodes(styledNodes);
      setEdges(styledEdges);
    } catch (error) {
      console.error('Error fetching roadmap:', error);
      toast.error('Failed to load roadmap.');
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
    if (!user) { toast.warning('Please log in to save progress.'); return; }
    setSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const completedNodes = Object.entries(nodeStatuses)
        .filter(([_, status]) => status === 'done')
        .map(([nodeId]) => nodeId);
      await axios.post('/api/progress/save', { roadmapId: id, completedNodes }, config);
      toast.success('Progress saved! ✓');
    } catch (error) {
      toast.error('Failed to save progress. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const totalNodes = roadmap?.nodes?.length || 0;
  const doneCount = Object.values(nodeStatuses).filter(s => s === 'done').length;
  const inProgressCount = Object.values(nodeStatuses).filter(s => s === 'in-progress').length;
  const skippedCount = Object.values(nodeStatuses).filter(s => s === 'skipped').length;
  const donePercent = totalNodes ? Math.round((doneCount / totalNodes) * 100) : 0;

  // Node type details for sidebar
  const getNodeDetails = (node) => {
    if (!node) return null;
    const d = node.data;
    const nodeType = node.type || 'topicNode';

    return { nodeType, d };
  };

  const difficultyColors = { beginner: '#22c55e', intermediate: '#f59e0b', advanced: '#ef4444' };
  const phaseColors = { foundation: '#f59e0b', core: '#3b82f6', advanced: '#a855f7', mastery: '#ef4444' };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '120px', color: 'var(--text-muted)' }}>
      <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 16px auto', border: '3px solid var(--card-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p>Loading roadmap...</p>
    </div>
  );

  if (!roadmap) return (
    <div className="container" style={{ textAlign: 'center', padding: '120px' }}>
      <h2 style={{ marginBottom: '12px' }}>Roadmap Not Found</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>This roadmap doesn't exist or you don't have access.</p>
      <Link to="/explore"><button className="btn-primary">Back to Explore</button></Link>
    </div>
  );

  const nodeDetails = getNodeDetails(selectedNode);

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--card-border)' }}>
        <div className="container" style={{ paddingTop: '28px', paddingBottom: '24px' }}>
          <Link to={isCustom ? '/dashboard' : '/explore'} style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
            ← {isCustom ? 'Back to Dashboard' : 'Back to Explore'}
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '1.8rem' }}>{roadmap.title}</h1>
                {isCustom && <span className="badge badge-custom" style={{ marginTop: '4px' }}>Custom</span>}
              </div>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '550px', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {roadmap.description}
              </p>
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {totalNodes} topics
                </span>
                {roadmap.nodes?.some(n => n.data?.estimatedHours) && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ~{roadmap.nodes.reduce((acc, n) => acc + (n.data?.estimatedHours || 0), 0)}h total
                  </span>
                )}
              </div>
            </div>
            <button
              className={saving ? 'btn-secondary' : 'btn-primary'}
              onClick={saveProgress}
              disabled={!user || saving}
              id="save-progress-btn"
              style={{ padding: '10px 22px', fontSize: '0.875rem' }}
            >
              {saving ? 'Saving...' : user ? '💾 Save Progress' : 'Login to Track'}
            </button>
          </div>

          {/* Progress bar */}
          {user && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {[
                    { label: `Done (${doneCount})`, color: '#22c55e' },
                    { label: `In Progress (${inProgressCount})`, color: '#f59e0b' },
                    { label: `Skipped (${skippedCount})`, color: 'var(--text-muted)' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                      {item.label}
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: '0.8rem', color: donePercent === 100 ? '#22c55e' : 'var(--accent)', fontWeight: '700' }}>
                  {donePercent}% complete
                </span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  width: `${donePercent}%`, height: '100%',
                  background: donePercent === 100 ? '#22c55e' : 'linear-gradient(90deg, var(--accent), #6366f1)',
                  borderRadius: '2px', transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Flow + Sidebar */}
      <div className="container" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
        <div style={{ height: 'calc(100vh - 300px)', minHeight: '500px', display: 'flex', gap: '16px' }}>

          {/* ReactFlow Canvas */}
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
                minZoom={0.2}
                maxZoom={2}
              >
                <Controls position="bottom-left" showInteractive={false} />
                <MiniMap
                  nodeColor={(node) => {
                    if (node.data?.status === 'done') return '#22c55e';
                    if (node.type === 'checkpointNode') return '#334155';
                    if (node.type === 'subtopicNode') return '#1e293b';
                    const phaseC = phaseColors[node.data?.phase] || '#3b82f6';
                    return phaseC;
                  }}
                  maskColor="rgba(0,0,0,0.85)"
                  style={{ backgroundColor: '#0a0a0f', borderRadius: '8px', border: '1px solid var(--card-border)' }}
                />
                <Background variant="dots" gap={24} size={1} color="rgba(255,255,255,0.03)" />
              </ReactFlow>
            ) : (
              <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '2rem', opacity: 0.4 }}>🗺️</div>
                <p>This roadmap has no topics yet.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="card" style={{ width: '350px', padding: '0', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {selectedNode && nodeDetails ? (
              <div className="animate-fade-in" style={{ padding: '24px' }}>
                {/* Node type badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px',
                    padding: '3px 9px', borderRadius: '4px',
                    background: nodeDetails.nodeType === 'checkpointNode' ? 'rgba(100,116,139,0.12)' :
                                nodeDetails.nodeType === 'subtopicNode' ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.1)',
                    color: nodeDetails.nodeType === 'checkpointNode' ? '#94a3b8' :
                           nodeDetails.nodeType === 'subtopicNode' ? 'var(--text-muted)' : 'var(--accent)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    {nodeDetails.nodeType === 'checkpointNode' ? '🚩 Checkpoint' :
                     nodeDetails.nodeType === 'subtopicNode' ? '◦ Subtopic' : '◆ Topic'}
                  </span>

                  {nodeDetails.d.phase && (
                    <span style={{ fontSize: '0.62rem', fontWeight: '600', padding: '3px 9px', borderRadius: '4px', background: `${phaseColors[nodeDetails.d.phase]}15`, color: phaseColors[nodeDetails.d.phase] }}>
                      {nodeDetails.d.phase}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', lineHeight: '1.3', fontWeight: '700' }}>
                  {nodeDetails.d.label}
                </h3>

                {/* Difficulty + Hours */}
                {(nodeDetails.d.difficulty || nodeDetails.d.estimatedHours) && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {nodeDetails.d.difficulty && (
                      <span style={{
                        fontSize: '0.72rem', fontWeight: '700', padding: '3px 10px', borderRadius: '6px',
                        background: `${difficultyColors[nodeDetails.d.difficulty]}15`,
                        color: difficultyColors[nodeDetails.d.difficulty],
                        border: `1px solid ${difficultyColors[nodeDetails.d.difficulty]}30`,
                      }}>
                        {nodeDetails.d.difficulty.charAt(0).toUpperCase() + nodeDetails.d.difficulty.slice(1)}
                      </span>
                    )}
                    {nodeDetails.d.estimatedHours && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        ⏱ ~{nodeDetails.d.estimatedHours} hours
                      </span>
                    )}
                  </div>
                )}

                {/* Description */}
                {nodeDetails.d.description && (
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ lineHeight: '1.7', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {nodeDetails.d.description}
                    </p>
                  </div>
                )}

                {/* Project Suggestion (checkpoint) */}
                {nodeDetails.d.projectSuggestion && (
                  <div style={{ marginBottom: '20px', padding: '12px 14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#22c55e', marginBottom: '6px' }}>
                      💡 Project Idea
                    </p>
                    <p style={{ fontSize: '0.83rem', color: '#86efac', lineHeight: '1.5' }}>
                      {nodeDetails.d.projectSuggestion}
                    </p>
                  </div>
                )}

                {/* Code Snippet */}
                {nodeDetails.d.codeSnippet && (
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Code Example
                    </p>
                    <div style={{
                      background: 'rgba(0,0,0,0.5)', padding: '14px 16px', borderRadius: '8px',
                      fontFamily: 'JetBrains Mono, Consolas, monospace', fontSize: '0.76rem',
                      color: '#a5f3fc', overflowX: 'auto', whiteSpace: 'pre-wrap',
                      border: '1px solid rgba(255,255,255,0.06)', lineHeight: '1.6',
                    }}>
                      {nodeDetails.d.codeSnippet}
                    </div>
                  </div>
                )}

                {/* Resources */}
                {nodeDetails.d.resources?.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Resources
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {nodeDetails.d.resources.map((res, idx) => (
                        <a
                          key={idx}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '9px 13px', background: 'rgba(255,255,255,0.02)',
                            border: '1px solid var(--card-border)', borderRadius: '8px',
                            color: 'var(--text-secondary)', fontSize: '0.82rem',
                            display: 'flex', alignItems: 'center', gap: '10px',
                            transition: 'all 0.15s', textDecoration: 'none',
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; e.currentTarget.style.color = 'var(--text)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >
                          <span style={{ fontSize: '0.7rem', opacity: 0.6, flexShrink: 0 }}>
                            {res.type === 'video' ? '▶' : res.type === 'docs' ? '📖' : res.type === 'course' ? '🎓' : '↗'}
                          </span>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {res.label}
                          </span>
                          {res.type && (
                            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', flexShrink: 0, opacity: 0.7 }}>
                              {res.type}
                            </span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '20px', lineHeight: '1.5' }}>
                  Right-click a node to mark its status.
                </p>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 32px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '1.3rem' }}>
                  🗺️
                </div>
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.95rem' }}>
                  Select a topic
                </h4>
                <p style={{ fontSize: '0.82rem', lineHeight: '1.6', maxWidth: '220px' }}>
                  Click any node to see details, resources, and code examples. Right-click to update status.
                </p>
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
            <span style={{ color: '#22c55e' }}>✓</span> Mark Done
          </button>
          <button className="context-menu-item" onClick={() => setNodeStatus(contextMenu.nodeId, 'in-progress')}>
            <span style={{ color: '#f59e0b', fontSize: '0.7rem' }}>●</span> In Progress
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
