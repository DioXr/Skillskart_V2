import React, { useState, useCallback, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
import { useAuth } from '../context/AuthContext';
import ProNode from '../components/ProNode';
import '@xyflow/react/dist/style.css';

const nodeTypes = { proNode: ProNode };

const RoadmapFlowPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [roadmap, setRoadmap] = useState(null);
  const [completedNodes, setCompletedNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id, user]);

  const fetchData = async () => {
    try {
      // 1. Fetch Roadmap Structure
      const { data: roadmapData } = await axios.get(`/api/roadmaps/${id}`);
      setRoadmap(roadmapData);

      // 2. Fetch User Progress if logged in
      let progressData = [];
      if (user) {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get(`/api/progress/${id}`, config);
        progressData = data;
        setCompletedNodes(data);
      }

      // 3. Apply styles based on progress
      const styledNodes = (roadmapData.nodes || []).map(node => ({
        ...node,
        style: {
          ...node.style,
          border: progressData.includes(node.id) ? '2px solid #00ff88' : node.style?.border,
          boxShadow: progressData.includes(node.id) ? '0 0 15px rgba(0, 255, 136, 0.3)' : 'none'
        }
      }));

      setNodes(styledNodes);
      setEdges(roadmapData.edges || []);
    } catch (error) {
      console.error('Error fetching roadmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onNodeClick = (_, node) => {
    setSelectedNode(node);
  };

  const toggleNodeCompletion = (nodeId) => {
    if (!user) {
      alert('Please log in to track progress!');
      navigate('/login');
      return;
    }

    setCompletedNodes(prev => {
      const isCompleted = prev.includes(nodeId);
      const newProgress = isCompleted
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId];

      // Update node visual state immediately
      setNodes(nds => nds.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            style: {
              ...n.style,
              border: !isCompleted ? '2px solid #00ff88' : '1px solid #333',
              boxShadow: !isCompleted ? '0 0 15px rgba(0, 255, 136, 0.3)' : 'none'
            }
          };
        }
        return n;
      }));

      return newProgress;
    });
  };

  const saveProgress = async () => {
    if (!user) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('/api/progress/save', {
        roadmapId: id,
        completedNodes
      }, config);
      alert('Progress saved to your account! 🚀');
    } catch (error) {
      alert('Failed to save progress.');
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '100px', color: '#888' }}>
      <div className="spinner" style={{ marginBottom: '20px' }}>⏳</div>
      <h2>Loading your learning path...</h2>
    </div>
  );

  if (!roadmap) return (
    <div className="container" style={{ textAlign: 'center', padding: '100px' }}>
      <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔍</div>
      <h2>Roadmap Not Found</h2>
      <p style={{ color: '#888', marginBottom: '30px' }}>
        This roadmap ID doesn't exist in our database yet.
        If you are an admin, you can create it in the Admin Panel!
      </p>
      <Link to="/explore">
        <button className="btn-primary">Back to Explore</button>
      </Link>
    </div>
  );

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '40px', minHeight: '100vh' }}>
      {/* Breadcrumb & Title */}
      <div style={{ paddingTop: '40px', marginBottom: '32px' }}>
        <Link to="/explore" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span>←</span> Back to Explore
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', fontWeight: '800' }}>{roadmap.title}</h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: '1.5' }}>{roadmap.description}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={saveProgress} disabled={!user}>
              {user ? '🚀 Save Progress' : 'Login to Track'}
            </button>
          </div>
        </div>
      </div>

      {/* Global Progress Bar */}
      {user && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Overall Progress</span>
            <span style={{ color: 'var(--accent-color)' }}>{Math.round((completedNodes.length / (roadmap.nodes?.length || 1)) * 100)}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{
              width: `${(completedNodes.length / (roadmap.nodes?.length || 1)) * 100}%`,
              height: '100%',
              background: 'var(--gradient-1)',
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
          </div>
        </div>
      )}

      <div style={{ height: '70vh', minHeight: '600px', display: 'flex', gap: '24px' }}>
        <div className="glass-panel" style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: '500px' }}>
          {(nodes.length > 0) ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              colorMode="dark"
            >
              <Controls />
              <MiniMap nodeStrokeColor="#00e5ff" nodeColor="#111" maskColor="rgba(0,0,0,0.7)" style={{ backgroundColor: '#111' }} />
              <Background variant="dots" gap={20} size={1} color="#333" />
            </ReactFlow>
          ) : (
            <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#666' }}>
              <p>This roadmap has no steps yet. Add them in the Admin Panel!</p>
            </div>
          )}
        </div>

        {/* Details Sidebar */}
        <div className="glass-panel" style={{ width: '380px', padding: '40px', overflowY: 'auto' }}>
          {selectedNode ? (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ padding: '8px', background: 'rgba(0, 229, 255, 0.1)', borderRadius: '8px', color: 'var(--accent-color)' }}>
                  🎯
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{selectedNode.data.label}</h3>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '1px', marginBottom: '12px' }}>Learning Objective</label>
                <p style={{ lineHeight: '1.7', fontSize: '1rem', color: '#ccc', marginBottom: '24px' }}>
                  {selectedNode.data.description || 'Our experts are currently curating the detailed steps for this module.'}
                </p>

                {/* 💻 Code Snippet Section */}
                {selectedNode.data.codeSnippet && (
                  <div style={{ marginBottom: '24px' }}>
                     <label style={{ display: 'block', color: 'var(--accent-color)', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '1px', marginBottom: '12px' }}>Code Implementation</label>
                     <div style={{ 
                        background: '#000', 
                        padding: '16px', 
                        borderRadius: '12px', 
                        fontFamily: 'monospace', 
                        fontSize: '0.85rem', 
                        color: '#00ff88',
                        border: '1px solid rgba(0, 255, 136, 0.1)',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap'
                     }}>
                        {selectedNode.data.codeSnippet}
                     </div>
                  </div>
                )}

                {/* Resource Links */}
                {selectedNode.data.resources && selectedNode.data.resources.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                     <label style={{ display: 'block', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '1px', marginBottom: '16px' }}>Study Materials</label>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {selectedNode.data.resources.map((res, idx) => (
                           <a key={idx} href={res.url} target="_blank" rel="noopener noreferrer" style={{ 
                              padding: '12px 16px', 
                              backgroundColor: 'rgba(255,255,255,0.03)', 
                              border: '1px solid var(--surface-border)', 
                              borderRadius: '8px',
                              color: 'var(--text-primary)',
                              textDecoration: 'none',
                              fontSize: '0.9rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              transition: 'all 0.2s'
                           }}
                           onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-color)'}
                           onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--surface-border)'}
                           >
                              <span style={{ opacity: 0.7 }}>
                                 {res.type === 'video' ? '🎥' : res.type === 'docs' ? '📖' : '🔗'}
                              </span>
                              {res.label}
                           </a>
                        ))}
                     </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 'auto' }}>
                <button
                  onClick={() => toggleNodeCompletion(selectedNode.id)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: completedNodes.includes(selectedNode.id) ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                    background: completedNodes.includes(selectedNode.id) ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    color: completedNodes.includes(selectedNode.id) ? '#00ff88' : '#fff',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {completedNodes.includes(selectedNode.id) ? '✓ Completed' : ' Mark as Done'}
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '16px' }}>
                  {completedNodes.includes(selectedNode.id) ? 'Great job! Click Save Progress above to sync.' : 'Tip: Select your next target after finishing this.'}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#666', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '24px', opacity: 0.3 }}>🗺️</div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '12px' }}>Select a Milestone</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Click on any node in the flowchart to reveal deep-dive learning resources.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoadmapFlowPage;
