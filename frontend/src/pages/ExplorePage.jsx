import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ExplorePage = () => {
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: roadmapData } = await axios.get('/api/roadmaps');
        setRoadmaps(roadmapData);

        if (user) {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          const { data: progressData } = await axios.get('/api/progress/my/status', config);
          
          // Map to an object { roadmapId: percentage }
          const progressMap = {};
          progressData.forEach(p => {
            progressMap[p._id] = p.percentage;
          });
          setUserProgress(progressMap);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const filteredRoadmaps = roadmaps.filter(rmap => {
    const matchesFilter = filter === 'All' || rmap.category === filter;
    const matchesSearch = rmap.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (rmap.description && rmap.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <div className="hero-gradient" style={{ textAlign: 'center', paddingTop: '80px', paddingBottom: '60px' }}>
        <div className="container">
          <h1 style={{ fontSize: '4rem', marginBottom: '16px', fontWeight: '800' }}>
            The Modern <span style={{ background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Curriculum</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
            Professionally curated roadmaps for industry-leading careers and programming mastery. 
          </p>
          
          <div style={{ position: 'relative', display: 'inline-block', width: '100%', maxWidth: '500px' }}>
            <input 
              type="text" 
              placeholder="Search pathways..." 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '60px', paddingBottom: '100px' }}>
        {/* Filter Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '60px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '50px', width: 'fit-content', margin: '0 auto 60px auto', border: '1px solid var(--surface-border)' }}>
          {['All', 'Career', 'Coding', 'Design'].map(cat => (
            <button 
              key={cat}
              onClick={() => setFilter(cat)}
              style={{ 
                padding: '10px 24px', 
                borderRadius: '40px', 
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                background: filter === cat ? 'var(--gradient-1)' : 'transparent',
                color: filter === cat ? 'white' : 'var(--text-secondary)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px', opacity: 0.5 }}>
            <h3>Loading paths to success...</h3>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
              {filteredRoadmaps.map(rmap => {
                const progress = userProgress[rmap._id];
                return (
                  <Link to={`/roadmap/${rmap._id}`} key={rmap._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="glass-panel card-hover" style={{ padding: '0', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                      {/* Card Header (Structured Icon-less) */}
                      <div style={{ height: '8px', background: rmap.category === 'Career' ? 'var(--accent-color)' : rmap.category === 'Coding' ? '#ffd700' : '#b388ff' }} />
                      
                      <div style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <span className={`badge badge-${rmap.category.toLowerCase().replace(' ', '-')}`}>
                            {rmap.category}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                            {rmap.nodes?.length || 0} Milestones
                          </span>
                        </div>
                        
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', lineHeight: '1.2', fontWeight: '800' }}>{rmap.title}</h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.9rem', marginBottom: '24px', flex: 1 }}>
                          {rmap.description || 'Embark on a structured, expert-led journey to master this domain with industry standards.'}
                        </p>

                        {/* Progress Preview */}
                        {progress !== undefined && (
                          <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', fontWeight: '800' }}>
                                <span style={{ color: 'var(--accent-color)' }}>{progress}% COMPLETED</span>
                             </div>
                             <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-color)' }} />
                             </div>
                          </div>
                        )}
                        
                        {progress === undefined && (
                          <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)', fontWeight: '700', fontSize: '0.85rem' }}>
                            Start Pathway <span>→</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {filteredRoadmaps.length === 0 && (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <h2 style={{ opacity: 0.5 }}>No roadmaps found...</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your search or filters.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
