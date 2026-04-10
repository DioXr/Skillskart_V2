import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [enrolledRoadmaps, setEnrolledRoadmaps] = useState([]);
  const [customRoadmaps, setCustomRoadmaps] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user?.token}` } };
        const [progressRes, customRes] = await Promise.allSettled([
          axios.get('/api/progress/my/status', config),
          axios.get('/api/custom-roadmaps', config),
        ]);
        if (progressRes.status === 'fulfilled') setEnrolledRoadmaps(progressRes.value.data);
        if (customRes.status === 'fulfilled') setCustomRoadmaps(customRes.value.data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setPageLoading(false);
      }
    };
    if (user) fetchDashboard();
    else if (!loading) setPageLoading(false);
  }, [user, loading]);

  const deleteCustomRoadmap = async (rmId) => {
    if (!window.confirm('Delete this roadmap?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/custom-roadmaps/${rmId}`, config);
      setCustomRoadmaps(prev => prev.filter(r => r._id !== rmId));
    } catch (error) {
      alert('Failed to delete.');
    }
  };

  if (loading || !user) return (
    <div style={{ height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
      <p>Loading...</p>
    </div>
  );

  if (pageLoading) return <div className="container" style={{ padding: '100px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading dashboard...</div>;

  const completedSteps = enrolledRoadmaps.reduce((acc, curr) => acc + curr.completedNodes.length, 0);
  const avgProgress = enrolledRoadmaps.length > 0
    ? Math.round(enrolledRoadmaps.reduce((acc, curr) => acc + curr.percentage, 0) / enrolledRoadmaps.length)
    : 0;

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--card-border)' }}>
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>
                Welcome back, {user?.name.split(' ')[0]}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Track your progress across all your learning paths.
              </p>
            </div>
            <Link to="/custom/new">
              <button className="btn-accent" style={{ padding: '10px 22px', fontSize: '0.85rem' }}>+ Create Roadmap</button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '32px', paddingBottom: '80px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '40px' }}>
          <div className="stat-card stat-blue">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Active Paths</p>
            <div style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em' }}>{enrolledRoadmaps.length}</div>
          </div>
          <div className="stat-card stat-green">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Topics Done</p>
            <div style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em' }}>{completedSteps}</div>
          </div>
          <div className="stat-card stat-purple">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Avg. Progress</p>
            <div style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em' }}>{avgProgress}%</div>
          </div>
          <div className="stat-card stat-amber">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Custom Maps</p>
            <div style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em' }}>{customRoadmaps.length}</div>
          </div>
        </div>

        {/* My Custom Roadmaps */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem' }}>My Custom Roadmaps</h2>
          </div>

          {customRoadmaps.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                You haven't created any custom roadmaps yet.
              </p>
              <Link to="/custom/new">
                <button className="btn-primary" style={{ padding: '10px 24px' }}>Create Your First Roadmap</button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
              {customRoadmaps.map(rm => (
                <div key={rm._id} className="card card-hover" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className="badge badge-custom">Custom</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{rm.nodes?.length || 0} topics</span>
                  </div>
                  <h4 style={{ fontSize: '1rem', marginBottom: '6px', fontWeight: '700' }}>{rm.title}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px', lineHeight: '1.5', flex: 1 }}>
                    {rm.description?.substring(0, 80) || 'No description'}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--card-border)', paddingTop: '14px' }}>
                    <Link to={`/custom/${rm._id}`} style={{ flex: 1 }}>
                      <button className="btn-secondary" style={{ width: '100%', padding: '7px', fontSize: '0.8rem' }}>View</button>
                    </Link>
                    <Link to={`/custom/${rm._id}/edit`} style={{ flex: 1 }}>
                      <button className="btn-secondary" style={{ width: '100%', padding: '7px', fontSize: '0.8rem' }}>Edit</button>
                    </Link>
                    <button className="btn-danger" style={{ padding: '7px 12px', fontSize: '0.8rem' }} onClick={() => deleteCustomRoadmap(rm._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Enrolled Roadmaps */}
        <section>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Enrolled Roadmaps</h2>

          {enrolledRoadmaps.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                You haven't started any roadmaps yet. Explore and enroll in one.
              </p>
              <Link to="/explore">
                <button className="btn-primary">Explore Roadmaps</button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
              {enrolledRoadmaps.map(roadmap => (
                <Link to={`/roadmap/${roadmap._id}`} key={roadmap._id}>
                  <div className="card card-hover" style={{ padding: '24px', height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span className={`badge badge-${roadmap.category?.toLowerCase()}`}>{roadmap.category}</span>
                      <span style={{ fontSize: '0.75rem', color: roadmap.percentage === 100 ? 'var(--success)' : 'var(--accent)', fontWeight: '700' }}>{roadmap.percentage}%</span>
                    </div>
                    <h4 style={{ fontSize: '1.05rem', marginBottom: '16px', fontWeight: '700' }}>{roadmap.title}</h4>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${roadmap.percentage}%`, height: '100%',
                        background: roadmap.percentage === 100 ? 'var(--success)' : 'var(--accent)',
                        borderRadius: '2px', transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
