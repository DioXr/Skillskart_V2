import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DashboardPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [enrolledRoadmaps, setEnrolledRoadmaps] = useState([]);
  const [customRoadmaps, setCustomRoadmaps] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState(null);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user?.token}` } };
        const [progressRes, customRes, subRes] = await Promise.allSettled([
          axios.get('/api/progress/my/status', config),
          axios.get('/api/custom-roadmaps', config),
          axios.get('/api/payment/subscription', config),
        ]);
        if (progressRes.status === 'fulfilled') setEnrolledRoadmaps(progressRes.value.data);
        if (customRes.status === 'fulfilled') setCustomRoadmaps(customRes.value.data);
        if (subRes.status === 'fulfilled') setSubscriptionData(subRes.value.data);
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
      toast.success('Roadmap deleted.');
    } catch (error) {
      toast.error('Failed to delete roadmap.');
    }
  };

  const handleSelfRefund = async () => {
    if (!window.confirm("Are you sure you want to cancel your plan and request a refund? You will safely return to the Free Tier instantly.")) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('/api/payment/my/refund', {}, config);
      toast.success("Refund successful. Premium features disabled.");
      // Soft refresh dashboard state
      setSubscriptionData(prev => ({ ...prev, plan: 'free', aiCredits: 5 }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Refund failed to process. Try again.");
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
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
          <div className="stat-card" style={{ borderLeft: '3px solid var(--accent)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>AI Credits</p>
            <div style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--accent)' }}>{subscriptionData?.aiCredits || 0}</div>
          </div>
        </div>

        {/* Subscription Plan Card */}
        {subscriptionData && (
          <div className="card" style={{ padding: '20px 24px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
            borderColor: subscriptionData.plan === 'pro' ? 'rgba(59,130,246,0.2)' : subscriptionData.plan === 'team' ? 'rgba(168,85,247,0.2)' : 'var(--card-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                background: subscriptionData.plan === 'pro' ? 'rgba(59,130,246,0.1)' : subscriptionData.plan === 'team' ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
              }}>
                {subscriptionData.plan === 'pro' ? '⚡' : subscriptionData.plan === 'team' ? '🚀' : '🌱'}
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Current Plan</div>
                <div style={{ fontWeight: '800', fontSize: '1rem', color: subscriptionData.plan === 'pro' ? '#3b82f6' : subscriptionData.plan === 'team' ? '#a855f7' : 'var(--text)' }}>
                  {subscriptionData.plan.charAt(0).toUpperCase() + subscriptionData.plan.slice(1)}
                </div>
              </div>
              <div style={{ paddingLeft: '16px', borderLeft: '1px solid var(--card-border)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>AI Credits</div>
                <div style={{ fontWeight: '700', color: subscriptionData.aiCredits <= 1 ? '#ef4444' : 'var(--text)' }}>
                  {subscriptionData.aiCredits === 999999 ? '∞' : subscriptionData.aiCredits}
                  <span style={{ fontWeight: '400', color: 'var(--text-muted)', fontSize: '0.8rem' }}> remaining</span>
                </div>
                {subscriptionData.plan !== 'free' && subscriptionData.limits && (
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ width: '80px', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (subscriptionData.monthlyCreditsUsed / subscriptionData.limits.monthlyAiCredits) * 100)}%`, height: '100%', background: 'var(--accent)', borderRadius: '2px' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            {subscriptionData.plan === 'free' ? (
              <Link to="/pricing">
                <button className="btn-secondary" style={{ padding: '8px 20px', fontSize: '0.85rem', color: 'var(--accent)', border: '1px solid var(--accent)' }}>Upgrade to Pro</button>
              </Link>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link to="/pricing">
                  <button className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.82rem' }}>Manage Plan</button>
                </Link>
                <button onClick={handleSelfRefund} className="btn-danger" style={{ padding: '8px 18px', fontSize: '0.82rem' }}>Cancel & Refund</button>
              </div>
            )}
          </div>
        )}

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
