import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import RoadmapEditor from '../components/RoadmapEditor';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getLayoutedElements } from '../utils/layout';

const AdminPanelPage = () => {
  const { user, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [roadmaps, setRoadmaps] = useState([]);
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [aiTopic, setAiTopic] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [stats, setStats] = useState({ roadmaps: 0, users: 0, admins: 0 });

  useEffect(() => {
    if (!loading && !user) navigate('/login');
    if (user && !(user.role === 'admin' || user.role === 'subadmin' || user.isAdmin)) {
        navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
        fetchRoadmaps();
        if (user.role === 'admin') fetchUsers();
    }
  }, [user]);

  if (loading || !user) return (
    <div style={{ height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
      <p>Authenticating...</p>
    </div>
  );

  const fetchRoadmaps = async () => {
    try {
      const { data } = await axios.get('/api/roadmaps');
      setRoadmaps(data);
      setStats(prev => ({ ...prev, roadmaps: data.length }));
    } catch (error) {
      console.error('Error fetching roadmaps:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/auth/users', config);
      setUsers(data);
      setStats(prev => ({ 
        ...prev, 
        users: data.length,
        admins: data.filter(u => u.role !== 'user').length
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const deleteRoadmap = async (id) => {
    if (!window.confirm('Delete this roadmap?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/roadmaps/${id}`, config);
      fetchRoadmaps();
    } catch (error) {
      toast.error('Error deleting: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.patch(`/api/auth/users/${userId}/role`, { role: newRole }, config);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleRefund = async (userId) => {
    if (!window.confirm('Process a refund? This will instantly downgrade the user to the Free plan and reset credits.')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`/api/payment/refund/${userId}`, {}, config);
      toast.success(data.message || 'Refund successful!');
      fetchUsers();
    } catch (error) {
      toast.error('Refund failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const generateAiRoadmap = async () => {
    if (!aiTopic) return;
    setAiLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data: aiData } = await axios.post('/api/ai/generate', { topic: aiTopic }, config);
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(aiData.nodes, aiData.edges);
      const finalRoadmap = { ...aiData, nodes: layoutedNodes, edges: layoutedEdges };
      await axios.post('/api/roadmaps', finalRoadmap, config);
      setAiTopic('');
      setActiveTab('content');
      fetchRoadmaps();
      toast.success('Roadmap generated successfully!');
    } catch (error) {
      toast.error('AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  if (editingId) {
    return (
      <div className="container animate-fade-in" style={{ height: 'calc(100vh - 120px)', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Roadmap Editor</h2>
          <button className="btn-secondary" onClick={() => { setEditingId(null); fetchRoadmaps(); }}>Exit Editor</button>
        </div>
        <div style={{ height: '90%' }}>
          <RoadmapEditor 
            roadmapId={editingId} 
            onSaveComplete={(savedData) => { 
                if (savedData?._id) setEditingId(savedData._id);
                fetchRoadmaps(); 
            }} 
          />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'content', label: 'Roadmaps' },
    { id: 'ai', label: 'AI Generate' },
    ...(user.role === 'admin' ? [{ id: 'staff', label: 'Users' }] : []),
  ];

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div style={{ marginBottom: '32px', padding: '0 16px' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin Panel</h3>
        </div>

        {tabs.map(tab => (
          <div key={tab.id} className={`admin-nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '48px' }} className="animate-fade-in">
        
        {activeTab === 'overview' && (
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '32px' }}>Overview</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="card" style={{ padding: '28px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Roadmaps</p>
                <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>{stats.roadmaps}</div>
              </div>
              <div className="card" style={{ padding: '28px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Users</p>
                <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>{stats.users}</div>
              </div>
              <div className="card" style={{ padding: '28px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Staff</p>
                <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>{stats.admins}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Roadmaps</h1>
              <button className="btn-primary" onClick={() => setEditingId('new')}>+ Create</button>
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Title</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Created</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roadmaps.map(rmap => (
                    <tr key={rmap._id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: '600', fontSize: '0.9rem' }}>{rmap.title}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className={`badge badge-${rmap.category.toLowerCase()}`}>{rmap.category}</span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(rmap.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button className="btn-secondary" style={{ marginRight: '8px', padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => setEditingId(rmap._id)}>Edit</button>
                        <button className="btn-danger" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => deleteRoadmap(rmap._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div style={{ maxWidth: '640px' }}>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>AI Generate</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.9rem' }}>
              Enter a topic and generate a full roadmap with AI. The roadmap will include nodes, edges, descriptions, code snippets, and resources.
            </p>
            <div className="card" style={{ padding: '28px', display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                placeholder="e.g. Machine Learning, React Developer, DevOps" 
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                className="search-input"
                style={{ flex: 1 }}
              />
              <button className="btn-primary" onClick={generateAiRoadmap} disabled={aiLoading} style={{ padding: '10px 28px' }}>
                {aiLoading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '24px' }}>User Management</h1>
            <div className="card" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plan</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Credits</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: '600', fontSize: '0.9rem' }}>{u.name}</td>
                      <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className={`badge ${u.subscription?.plan !== 'free' ? 'badge-career' : 'badge-custom'}`}>
                          {u.subscription?.plan?.toUpperCase() || 'FREE'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.85rem' }}>
                        ✨ {u.aiCredits !== undefined ? u.aiCredits : 'N/A'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className={`badge ${u.role === 'admin' ? 'badge-career' : u.role === 'subadmin' ? 'badge-coding' : 'badge-custom'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                        {u.subscription?.plan !== 'free' && u.subscription?.plan && (
                          <button 
                            className="btn-danger" 
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }} 
                            onClick={() => handleRefund(u._id)}
                          >
                            Refund
                          </button>
                        )}
                        <select 
                          value={u.role}
                          disabled={u._id === user._id || user.role !== 'admin'}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--card-border)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem' }}
                        >
                          <option value="user">User</option>
                          <option value="subadmin">SubAdmin</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminPanelPage;
