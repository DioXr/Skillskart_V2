import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [enrolledRoadmaps, setEnrolledRoadmaps] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user?.token}` } };
        const { data } = await axios.get('/api/progress/my/status', config);
        setEnrolledRoadmaps(data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setPageLoading(false);
      }
    };
    if (user) {
        fetchDashboard();
    } else if (!loading) {
        setPageLoading(false);
    }
  }, [user, loading]);

  if (loading || !user) return (
    <div style={{ height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ marginBottom: '20px' }}>⏳</div>
            <h2>Authenticating your workspace...</h2>
        </div>
    </div>
  );



  if (pageLoading) return <div className="container" style={{ padding: '100px', textAlign: 'center' }}>Loading your dashboard...</div>;

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{ padding: '60px 0', borderBottom: '1px solid var(--surface-border)', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '16px', fontWeight: '800' }}>
            Welcome back, <span style={{ background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name.split(' ')[0]}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
            Continue your professional growth. You have {enrolledRoadmaps.length} active roadmaps in progress.
        </p>
        {(user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'subadmin' || user.isAdmin) && (
          <Link to="/admin" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: '800' }}>Admin Dashboard</Link>
        )}
      </div>



      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '60px' }}>
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
            <h5 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '8px' }}>Active Paths</h5>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent-color)' }}>{enrolledRoadmaps.length}</div>
        </div>
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
            <h5 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '8px' }}>Completed Steps</h5>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent-color)' }}>
                {enrolledRoadmaps.reduce((acc, curr) => acc + curr.completedNodes.length, 0)}
            </div>
        </div>
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
            <h5 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '8px' }}>User Rank</h5>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent-color)' }}>
                {(user.role || (user.isAdmin ? 'admin' : 'user')).toUpperCase()}
            </div>
        </div>
      </div>

      <h2 style={{ marginBottom: '32px', fontSize: '2rem' }}>My Enrolled Pathways</h2>

      {enrolledRoadmaps.length === 0 ? (
        <div className="glass-panel" style={{ padding: '80px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📖</div>
            <h3>You haven't started any roadmaps yet.</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Explore professionally curated paths and start your learning journey today.</p>
            <Link to="/explore">
                <button className="btn-primary">Explore All Paths</button>
            </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
          {enrolledRoadmaps.map(roadmap => (
            <div key={roadmap._id} className="glass-panel card-hover" style={{ padding: '40px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <span className={`badge badge-${roadmap.category.toLowerCase().replace(' ', '-')}`}>{roadmap.category}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{roadmap.percentage}% Complete</span>
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '12px', fontWeight: '800' }}>{roadmap.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '32px', flex: 1, lineHeight: '1.6' }}>
                    {roadmap.description?.substring(0, 100)}...
                </p>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginBottom: '32px', overflow: 'hidden' }}>
                    <div style={{ width: `${roadmap.percentage}%`, height: '100%', background: 'var(--gradient-1)', transition: 'width 0.4s ease' }} />
                </div>

                <Link to={`/roadmap/${roadmap._id}`} style={{ textDecoration: 'none' }}>
                    <button className="btn-secondary" style={{ width: '100%', padding: '14px' }}>Resume Learning <span>→</span></button>
                </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
