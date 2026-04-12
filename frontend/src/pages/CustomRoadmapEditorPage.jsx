import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
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
import { useAuth } from '../context/AuthContext';
import ProNode from '../components/ProNode';
import { getLayoutedElements } from '../utils/layout';
import '@xyflow/react/dist/style.css';

const nodeTypes = { proNode: ProNode };

const EditorInner = () => {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Custom');
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeDesc, setNodeDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (!isNew) {
      fetchRoadmap();
    }
  }, [id]);

  const fetchRoadmap = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`/api/custom-roadmaps/${id}`, config);
      setTitle(data.title);
      setDescription(data.description || '');
      setCategory(data.category || 'Custom');
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Could not load this roadmap.');
      navigate('/dashboard');
    }
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ 
      ...params, 
      type: 'smoothstep', 
      className: 'spine-edge' 
    }, eds)),
    [setEdges]
  );

  const addNode = () => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: 'proNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { label: 'New Topic', description: '' },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const onNodeClick = (_, node) => {
    setSelectedNode(node);
    setNodeLabel(node.data.label || '');
    setNodeDesc(node.data.description || '');
  };

  const onPaneClick = () => setSelectedNode(null);

  const updateNodeField = (field, value) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          const updated = { ...node, data: { ...node.data, [field]: value } };
          if (field === 'label') setNodeLabel(value);
          if (field === 'description') setNodeDesc(value);
          return updated;
        }
        return node;
      })
    );
  };

  const deleteNode = useCallback(() => {
    if (!selectedNode || !window.confirm('Delete this node?')) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  const onNodesDelete = useCallback((deleted) => {
    if (selectedNode && deleted.some(n => n.id === selectedNode.id)) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  const onEdgesDelete = useCallback((deleted) => {
    // Currently edges don't have a selection sidebar in this editor, but we handle it anyway
  }, []);

  const onLayout = useCallback(() => {
    const { nodes: ln, edges: le } = getLayoutedElements(nodes, edges);
    setNodes([...ln]);
    setEdges([...le]);
    setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 100);
  }, [nodes, edges, setNodes, setEdges, fitView]);

  const generateWithAI = async () => {
    if (!title || title.trim().length < 3) { toast.warning('Enter a valid title (at least 3 characters) first.'); return; }
    if (!window.confirm(`Generate a roadmap for "${title}" using AI? This will replace all current nodes.`)) return;
    setAiLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post('/api/ai/generate', { topic: title }, config);
      
      const rawNodes = data.nodes || [];
      const rawEdges = data.edges || [];

      // Update local credits if returned
      if (data.aiCredits !== undefined) {
        refreshUser();
      }

      // Sanitize IDs
      const idMap = {};
      const sanitizedNodes = rawNodes.map((n, idx) => {
        const newId = `node_c_${Date.now()}_${idx}`;
        idMap[n.id || `temp_${idx}`] = newId;
        return { ...n, id: newId, type: 'proNode' };
      });

      const sanitizedEdges = rawEdges.map((e, idx) => ({
        ...e,
        id: `edge_c_${Date.now()}_${idx}`,
        source: idMap[e.source] || e.source,
        target: idMap[e.target] || e.target,
        sourceHandle: 's-bottom',
        targetHandle: 't-top',
        type: 'smoothstep',
      })).filter(e => sanitizedNodes.some(n => n.id === e.source) && sanitizedNodes.some(n => n.id === e.target));

      const { nodes: ln, edges: le } = getLayoutedElements(sanitizedNodes, sanitizedEdges);
      setNodes(ln);
      setEdges(le);
      if (data.description) setDescription(data.description);
      setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 200);
    } catch (error) {
      const msg = error.response?.data?.message || 'AI generation failed. Try again.';
      if (error.response?.data?.outOfCredits) {
        toast.error('No AI credits left. Upgrade to Pro for more generations!');
      } else {
        toast.error(msg);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const saveRoadmap = async () => {
    if (!title || title.trim().length < 3) { toast.warning('Title must be at least 3 characters.'); return; }
    setSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      // 🛡️ PRE-SAVE SCHEMA GUARD: Ensure every node is technically valid for MongoDB constraints
      const validResourceTypes = ['video', 'article', 'docs', 'tool', 'code', 'file', 'course', 'book', 'website', 'other'];
      const validatedNodes = nodes.map(n => ({
        ...n,
        type: n.type || 'proNode',
        position: {
          x: n.position?.x ?? 0,
          y: n.position?.y ?? 0
        },
        data: {
          ...n.data,
          label: n.data?.label || "Untitled",
          status: n.data?.status || 'locked',
          nodeType: ['topic', 'subtopic', 'checkpoint', 'milestone'].includes(n.data?.nodeType) 
            ? n.data.nodeType 
            : 'topic',
          resources: (n.data?.resources || []).map(r => ({
            ...r,
            type: validResourceTypes.includes(String(r.type).toLowerCase()) ? String(r.type).toLowerCase() : 'other'
          }))
        }
      }));

      const data = { title, category, description, nodes: validatedNodes, edges };

      if (isNew) {
        const { data: savedData } = await axios.post('/api/custom-roadmaps', data, config);
        // Navigate to the new ID silently so the user can continue editing without a reload
        if (savedData?._id) {
          navigate(`/custom-roadmaps/edit/${savedData._id}`, { replace: true });
        }
      } else {
        await axios.put(`/api/custom-roadmaps/${id}`, data, config);
      }
      toast.success('Roadmap saved successfully! ✓');
      // No longer redirecting to /dashboard to allow user to continue refining
    } catch (error) {
      toast.error('Error saving: ' + (error.response?.data?.message || error.response?.data?.details || error.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '40px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ paddingTop: '32px', marginBottom: '20px' }}>
        <button className="btn-secondary" style={{ padding: '6px 16px', fontSize: '0.8rem', marginBottom: '16px' }} onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '16px' }}>{isNew ? 'Create Custom Roadmap' : 'Edit Roadmap'}</h1>
      </div>

      {/* Credits Display (Separate and Above) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <div style={{ 
          padding: '4px 12px', 
          background: 'rgba(10, 132, 255, 0.1)', 
          border: '1px solid rgba(10, 132, 255, 0.2)', 
          borderRadius: '20px',
          fontSize: '0.65rem',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: (user?.aiCredits || 10) > 0 ? 'var(--accent)' : '#ff4444'
        }}>
          ✨ {(user?.aiCredits === undefined ? 10 : user.aiCredits)} AI Credits Remaining
        </div>
      </div>

      {/* Toolbar */}
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
          <option value="Custom">Custom</option>
          <option value="Career">Career</option>
          <option value="Coding">Coding</option>
          <option value="Design">Design</option>
        </select>
        <button className="btn-secondary" onClick={onLayout} style={{ padding: '10px 16px', fontSize: '0.8rem' }}>Auto Layout</button>
        <button 
          className="btn-secondary" 
          onClick={generateWithAI} 
          disabled={aiLoading || ((user?.aiCredits !== undefined && user?.aiCredits <= 0) && user?.role !== 'admin')} 
          style={{ padding: '10px 16px', fontSize: '0.8rem' }}
        >
          {aiLoading ? 'Generating...' : 'AI Generate'}
        </button>
        <button className="btn-primary" onClick={saveRoadmap} disabled={saving} style={{ padding: '10px 20px', fontSize: '0.8rem' }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Description */}
      <div style={{ marginBottom: '16px' }}>
        <input 
          type="text" 
          placeholder="Add a description (optional)..." 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="search-input"
          style={{ width: '100%' }}
        />
      </div>

      {/* Flow + Sidebar */}
      <div style={{ height: '65vh', display: 'flex', gap: '16px' }}>
        <div className="card" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
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
            onPaneClick={onPaneClick}
            onNodesDelete={onNodesDelete}
            onEdgesDelete={onEdgesDelete}
            nodeTypes={nodeTypes}
            fitView
            colorMode="dark"
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Controls />
            <MiniMap nodeColor="#222" maskColor="rgba(0,0,0,0.8)" style={{ backgroundColor: '#111' }} />
            <Background variant="dots" gap={20} size={1} color="#222" />
          </ReactFlow>
        </div>

        {/* Node Editor Sidebar */}
        <div className="card" style={{ width: '300px', padding: '24px', overflowY: 'auto' }}>
          {selectedNode ? (
            <div className="animate-fade-in">
              <h3 style={{ fontSize: '1rem', marginBottom: '20px' }}>Edit Node</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Label</label>
                <input 
                  type="text" 
                  value={nodeLabel}
                  onChange={(e) => updateNodeField('label', e.target.value)}
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--card-border)', padding: '10px', borderRadius: '8px', color: 'var(--text)', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Description</label>
                <textarea 
                  rows="4"
                  value={nodeDesc}
                  onChange={(e) => updateNodeField('description', e.target.value)}
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--card-border)', padding: '10px', borderRadius: '8px', color: '#ccc', fontSize: '0.85rem', lineHeight: '1.5', resize: 'vertical' }}
                  placeholder="What to learn..."
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-danger" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }} onClick={deleteNode}>Delete</button>
                <button className="btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }} onClick={() => setSelectedNode(null)}>Done</button>
              </div>
            </div>
          ) : (
            <div style={{ height: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
              <h4 style={{ color: 'var(--text)', marginBottom: '8px', fontSize: '1rem' }}>Node Editor</h4>
              <p style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>Click a node to edit its label and description.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CustomRoadmapEditorPage = () => (
  <ReactFlowProvider>
    <EditorInner />
  </ReactFlowProvider>
);

export default CustomRoadmapEditorPage;
