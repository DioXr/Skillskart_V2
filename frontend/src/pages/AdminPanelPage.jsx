import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import RoadmapEditor from '../components/RoadmapEditor';
import { useAuth } from '../context/AuthContext';

const AdminPanelPage = () => {
  const { user, loading } = useAuth();
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
    // For backward compatibility while users migrate sessions
    if (user && !(user.role === 'admin' || user.role === 'subadmin' || user.isAdmin)) {
        navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
        fetchRoadmaps();
        if (user.role === 'admin') {
            fetchUsers();
        }
    }
  }, [user]);

  if (loading || !user) return (
    <div style={{ height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ marginBottom: '20px' }}>⏳</div>
            <h2>Authenticating your workspace...</h2>
        </div>
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
    if (!window.confirm('Are you sure you want to delete this roadmap?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/roadmaps/${id}`, config);
      fetchRoadmaps();
    } catch (error) {
      alert('Error deleting: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.patch(`/api/auth/users/${userId}/role`, { role: newRole }, config);
      fetchUsers();
    } catch (error) {
      alert('Failed to update role');
    }
  };

  const generateAiRoadmap = async () => {
    if (!aiTopic) return;
    setAiLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post('/api/ai/generate', { topic: aiTopic }, config);
      
      // Open editor with new AI roadmap
      // Since it's not saved yet, we'll need to handle it. For now, let's just save it immediately and reload.
      await axios.post('/api/roadmaps', data, config);
      setAiTopic('');
      setActiveTab('content');
      fetchRoadmaps();
      alert('AI Pathway Generated Successfully!');
    } catch (error) {
      alert('AI Generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  if (editingId) {
    return (
      <div className="container animate-fade-in" style={{ height: 'calc(100vh - 120px)', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Roadmap Builder</h2>
          <button className="btn-secondary" onClick={() => { setEditingId(null); fetchRoadmaps(); }}>Exit Editor</button>
        </div>
        <div style={{ height: '90%' }}>
          <RoadmapEditor roadmapId={editingId} onSaveComplete={() => { setEditingId(null); fetchRoadmaps(); }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
      {/* 🛠️ Admin Sidebar */}
      <div className="admin-sidebar shadow-lg">
        <div style={{ marginBottom: '40px', padding: '0 20px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '2px' }}>CONTROL<br/>CENTER</h2>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: '800', marginTop: '5px' }}>
                {user.role === 'admin' ? 'SYSTEM OVERLORD' : 'CONTENT COMMANDER'}
            </div>
        </div>

        <div className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <span>📊</span> Overview
        </div>
        <div className={`admin-nav-item ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>
            <span>🗺️</span> Content Manager
        </div>
        <div className={`admin-nav-item ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
            <span>🧠</span> AI Pathfinder
        </div>
        {user.role === 'admin' && (
            <div className={`admin-nav-item ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>
                <span>🛡️</span> Staff Management
            </div>
        )}
      </div>

      {/* 🖥️ Main Content Area */}
      <div style={{ flex: 1, padding: '60px' }} className="animate-fade-in">
        
        {activeTab === 'overview' && (
            <div>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '40px' }}>Dashboard Overview</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
                    <div className="glass-panel" style={{ padding: '40px' }}>
                        <h4 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Global Pathways</h4>
                        <div style={{ fontSize: '3.5rem', fontWeight: '800' }}>{stats.roadmaps}</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '40px' }}>
                        <h4 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Total Learners</h4>
                        <div style={{ fontSize: '3.5rem', fontWeight: '800' }}>{stats.users}</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '40px' }}>
                        <h4 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Active Staff</h4>
                        <div style={{ fontSize: '3.5rem', fontWeight: '800' }}>{stats.admins}</div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'content' && (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Content Manager</h1>
                    <button className="btn-primary" onClick={() => setEditingId('new')}>+ Create New Path</button>
                </div>
                <div className="glass-panel">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--surface-border)', opacity: 0.5, fontSize: '0.8rem' }}>
                                <th style={{ padding: '20px' }}>TITLE</th>
                                <th style={{ padding: '20px' }}>CATEGORY</th>
                                <th style={{ padding: '20px' }}>CREATED</th>
                                <th style={{ padding: '20px', textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roadmaps.map(rmap => (
                                <tr key={rmap._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '20px', fontWeight: '800' }}>{rmap.title}</td>
                                    <td style={{ padding: '20px' }}>
                                        <span className={`badge badge-${rmap.category.toLowerCase()}`}>{rmap.category}</span>
                                    </td>
                                    <td style={{ padding: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{new Date(rmap.createdAt).toLocaleDateString()}</td>
                                    <td style={{ padding: '20px', textAlign: 'right' }}>
                                        <button className="btn-secondary" style={{ marginRight: '10px' }} onClick={() => setEditingId(rmap._id)}>Edit</button>
                                        <button className="btn-danger" onClick={() => deleteRoadmap(rmap._id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'ai' && (
            <div style={{ maxWidth: '800px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>AI Pathfinder</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>
                    Enter any learning topic and let SkillKart AI generate a high-performance, branched roadmap with resources instantly.
                </p>
                <div className="glass-panel" style={{ padding: '40px', display: 'flex', gap: '20px' }}>
                    <input 
                        type="text" 
                        placeholder="e.g. Astro-Physics, Machine Learning, UI/UX" 
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--surface-border)', padding: '15px', borderRadius: '12px', color: '#fff', fontSize: '1.1rem' }}
                    />
                    <button 
                        className="btn-primary" 
                        onClick={generateAiRoadmap} 
                        disabled={aiLoading}
                        style={{ padding: '0 40px' }}
                    >
                        {aiLoading ? 'Generating...' : 'Generate ⚡'}
                    </button>
                </div>
            </div>
        )}

        {activeTab === 'staff' && (
            <div>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '40px' }}>Staff Management</h1>
                <div className="glass-panel">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--surface-border)', opacity: 0.5, fontSize: '0.8rem' }}>
                                <th style={{ padding: '20px' }}>NAME</th>
                                <th style={{ padding: '20px' }}>EMAIL</th>
                                <th style={{ padding: '20px' }}>ROLE</th>
                                <th style={{ padding: '20px', textAlign: 'right' }}>MANAGE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '20px', fontWeight: '800' }}>{u.name}</td>
                                    <td style={{ padding: '20px', color: 'var(--text-secondary)' }}>{u.email}</td>
                                    <td style={{ padding: '20px' }}>
                                        <span style={{ 
                                            padding: '4px 10px', 
                                            borderRadius: '20px', 
                                            fontSize: '0.7rem', 
                                            fontWeight: '800',
                                            background: u.role === 'admin' ? 'var(--accent-color)' : u.role === 'subadmin' ? '#ffd700' : 'rgba(255,255,255,0.1)',
                                            color: u.role === 'user' ? '#fff' : '#000'
                                        }}>
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px', textAlign: 'right' }}>
                                        <select 
                                            value={u.role}
                                            disabled={u._id === user._id}
                                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                            style={{ background: '#111', color: '#fff', border: '1px solid var(--surface-border)', padding: '8px', borderRadius: '8px' }}
                                        >
                                            <option value="user">User</option>
                                            <option value="subadmin">SubAdmin</option>
                                            <option value="admin">SuperAdmin</option>
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
