import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/'); };

  const isActive = (path) => location.pathname === path || (path === '/explore' && location.pathname.startsWith('/roadmap'));

  const navLink = (path, label) => (
    <Link to={path} style={{
      color: isActive(path) ? '#fff' : 'var(--text-muted)',
      fontWeight: isActive(path) ? '600' : '500',
      fontSize: '0.875rem',
      transition: 'color 0.15s',
      position: 'relative',
      padding: '4px 0',
    }}>
      {label}
      {isActive(path) && (
        <span style={{
          position: 'absolute', bottom: '-17px', left: '0', right: '0',
          height: '2px', background: 'var(--accent)', borderRadius: '1px'
        }} />
      )}
    </Link>
  );

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 0',
      borderBottom: '1px solid var(--card-border)',
    }} className="container">
      <Link to="/">
        <div style={{ fontWeight: '800', fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
          <span style={{ color: '#fff' }}>Skill</span>
          <span style={{ color: 'var(--accent)' }}>Kart</span>
        </div>
      </Link>

      <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
        {navLink('/explore', 'Explore')}
        {user && navLink('/dashboard', 'Dashboard')}
        {user && (user.role === 'admin' || user.role === 'subadmin' || user.isAdmin) && navLink('/admin', 'Admin')}

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '4px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'var(--accent)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700', color: '#fff'
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button onClick={handleLogout} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>Logout</button>
          </div>
        ) : (
          <Link to="/login">
            <button className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.8rem' }}>Sign In</button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
