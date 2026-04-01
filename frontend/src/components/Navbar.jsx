import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 0',
      borderBottom: '1px solid var(--surface-border)',
      marginBottom: '40px'
    }} className="container">
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ fontWeight: '800', fontSize: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
          <span style={{ color: 'var(--text-primary)' }}>Skill</span>
          <span style={{ color: 'var(--accent-color)' }}>Kart</span>
        </div>
      </Link>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '600' }}>Home</Link>
        <Link to="/explore" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '600' }}>Explore Paths</Link>
        
        {user ? (
          <>
            {(user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'subadmin' || user.isAdmin) && (
              <Link to="/admin" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: '800' }}>Admin Dashboard</Link>
            )}
            <Link to="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '600' }}>Dashboard</Link>
            <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Hi, {user.name.split(' ')[0]}</span>
            <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 20px' }}>Logout</button>
          </>
        ) : (
          <Link to="/login">
            <button className="btn-primary" style={{ padding: '8px 20px' }}>Sign In</button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
