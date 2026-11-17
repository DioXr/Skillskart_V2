import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinkStyle = (path) => ({
    color: isActive(path) ? 'var(--text)' : 'var(--text-muted)',
    fontSize: '0.875rem',
    fontWeight: isActive(path) ? '600' : '500',
    textDecoration: 'none',
    transition: 'color 0.15s',
    paddingBottom: '2px',
    borderBottom: isActive(path) ? '2px solid var(--accent)' : '2px solid transparent',
  });

  const planConfig = {
    pro:  { label: 'PRO',  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: '⚡' },
    team: { label: 'TEAM', color: '#a855f7', bg: 'rgba(168,85,247,0.12)', icon: '🚀' },
    free: { label: null, color: null, bg: null, icon: null },
  };
  const plan = user?.subscription?.plan || 'free';
  const planInfo = planConfig[plan];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 1000,
      background: 'rgba(10,10,15,0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--card-border)',
    }}>
      <div className="container" style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
          <span style={{ fontWeight: '800', fontSize: '1.25rem', letterSpacing: '-0.02em', color: 'var(--text)' }}>
            Skills<span style={{ color: '#3b82f6' }}>kart</span>
          </span>
        </Link>

        {/* Right side - Nav & User Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link to="/explore" style={navLinkStyle('/explore')}>Explore</Link>
          {user && <Link to="/dashboard" style={navLinkStyle('/dashboard')}>Dashboard</Link>}
          {!user && <Link to="/pricing" style={navLinkStyle('/pricing')}>Pricing</Link>}
          {user && plan === 'free' && (
            <Link to="/pricing" style={{ 
              textDecoration: 'none', 
              color: '#3b82f6', 
              fontSize: '0.85rem', 
              fontWeight: '700', 
              background: 'rgba(59,130,246,0.1)', 
              padding: '6px 14px', 
              borderRadius: '30px',
              border: '1px solid rgba(59,130,246,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ⚡ Upgrade
            </Link>
          )}
          {user && (user.role === 'admin' || user.role === 'subadmin') ? (
            <Link to="/admin" style={navLinkStyle('/admin')}>Admin</Link>
          ) : null}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '10px' }}>
              {/* User Avatar Circle */}
              <div 
                title={user.name} 
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: '#3b82f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem', color: '#fff', fontWeight: '700',
                  cursor: 'default'
              }}>
                {user.name?.charAt(0)?.toUpperCase()}
              </div>

              {/* Logout Button */}
              <button 
                onClick={handleLogout} 
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-muted)',
                  borderRadius: '20px',
                  padding: '6px 16px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '10px' }}>
              <Link to="/login">
                <button className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }} id="navbar-login-btn">Sign In</button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
