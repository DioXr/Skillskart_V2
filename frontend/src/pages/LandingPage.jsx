import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="container animate-fade-in" style={{ textAlign: 'center', paddingTop: '80px', paddingBottom: '80px' }}>
      <h1 style={{ fontSize: '4.5rem', lineHeight: '1.1', marginBottom: '24px' }}>
        Master Your <span style={{ background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Future</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
        Interactive roadmaps for software careers and language learning. 
        Track your progress, unlock achievements, and level up your skills with our premium SaaS platform.
      </p>
      
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '80px' }}>
        <Link to="/explore">
          <button className="btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
            Explore Roadmaps 🚀
          </button>
        </Link>
        <Link to="/login">
          <button className="btn-secondary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
            Get Started Free
          </button>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', textAlign: 'left' }}>
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🚀</div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Career Tracks</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>Follow step-by-step interactive flowcharts to become a Full Stack Developer, Data Scientist, and more.</p>
        </div>
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🗣️</div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Language Mastery</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>Structured paths to master new languages, from basic vocabulary to fluent conversation.</p>
        </div>
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>💾</div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Track Progress</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>Save your state in the cloud. Check off nodes as you learn and visualize your continuous journey.</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
