import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section style={{ paddingTop: '100px', paddingBottom: '120px', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle background glow */}
        <div style={{
          position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '500px',
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '100px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', marginBottom: '28px', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: '600' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
              Open-source roadmap platform
            </div>

            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', fontWeight: '800', letterSpacing: '-0.035em', marginBottom: '20px', lineHeight: '1.1' }}>
              The roadmap to become<br />
              <span style={{ color: 'var(--accent)' }}>anything</span> you want
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.7', maxWidth: '520px', margin: '0 auto 36px auto' }}>
              Interactive learning paths, progress tracking, and AI-generated roadmaps. Build skills systematically, not randomly.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '64px' }}>
              <Link to="/explore">
                <button className="btn-primary" style={{ padding: '13px 32px', fontSize: '0.95rem' }}>Explore Roadmaps</button>
              </Link>
              <Link to="/login">
                <button className="btn-secondary" style={{ padding: '13px 28px', fontSize: '0.95rem' }}>Get Started Free</button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { value: '10+', label: 'Curated Roadmaps' },
                { value: 'AI', label: 'Powered Generation' },
                { value: '100%', label: 'Free & Open' },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.02em' }}>{item.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500', marginTop: '2px' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ borderTop: '1px solid var(--card-border)', background: 'var(--bg-subtle)' }}>
        <div className="container" style={{ padding: '80px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>Everything you need to level up</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto', fontSize: '0.95rem' }}>A complete system for structured learning, not another list of links.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {[
              { icon: '◆', color: 'var(--accent)', title: 'Role-Based Roadmaps', desc: 'Step-by-step visual paths for Frontend, Backend, DevOps, AI/ML, and more. Follow the industry-proven order of learning.' },
              { icon: '◉', color: 'var(--success)', title: 'Interactive Progress Tracking', desc: 'Right-click any topic to mark it as done, in progress, or skip. See your completion percentage and identify knowledge gaps.' },
              { icon: '✦', color: 'var(--purple)', title: 'Custom Roadmaps', desc: 'Create your own learning paths from scratch or generate one with AI. No restrictions — build exactly what you need.' },
            ].map((feat, i) => (
              <div key={i} className="card card-hover" style={{ padding: '32px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${feat.color}15`, marginBottom: '20px', fontSize: '1.1rem', color: feat.color }}>
                  {feat.icon}
                </div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '10px', fontWeight: '700' }}>{feat.title}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.9rem' }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section>
        <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>Ready to start learning?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '0.95rem' }}>Join thousands of developers tracking their growth.</p>
          <Link to="/explore">
            <button className="btn-accent" style={{ padding: '13px 36px', fontSize: '0.95rem' }}>Browse All Roadmaps</button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
