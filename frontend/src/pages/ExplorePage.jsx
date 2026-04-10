import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CATEGORY_COLORS = {
  Career: { bg: 'var(--accent-subtle)', color: 'var(--accent)', border: 'rgba(59,130,246,0.15)' },
  Coding: { bg: 'var(--warning-subtle)', color: 'var(--warning)', border: 'rgba(245,158,11,0.15)' },
  Design: { bg: 'var(--purple-subtle)', color: 'var(--purple)', border: 'rgba(168,85,247,0.15)' },
  Custom: { bg: 'var(--success-subtle)', color: 'var(--success)', border: 'rgba(34,197,94,0.15)' },
};

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
          const progressMap = {};
          progressData.forEach(p => { progressMap[p._id] = p.percentage; });
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

  const categories = ['All', 'Career', 'Coding'];

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--card-border)', paddingTop: '48px', paddingBottom: '40px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Explore Roadmaps</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                {roadmaps.length} curated paths across different roles and technologies
              </p>
            </div>
            <input
              type="text"
              placeholder="Search roadmaps..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ maxWidth: '320px' }}
            />
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '32px', paddingBottom: '80px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '32px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                border: filter === cat ? 'none' : '1px solid var(--card-border)',
                cursor: 'pointer',
                fontWeight: filter === cat ? '600' : '500',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                background: filter === cat ? 'var(--accent)' : 'rgba(255,255,255,0.03)',
                color: filter === cat ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
            <p>Loading roadmaps...</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
              {filteredRoadmaps.map(rmap => {
                const progress = userProgress[rmap._id];
                const catColor = CATEGORY_COLORS[rmap.category] || CATEGORY_COLORS.Custom;
                return (
                  <Link to={`/roadmap/${rmap._id}`} key={rmap._id}>
                    <div className="card card-hover" style={{ padding: '0', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {/* Color accent top bar */}
                      <div style={{ height: '3px', background: catColor.color }} />

                      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <span className={`badge badge-${rmap.category.toLowerCase()}`}>
                            {rmap.category}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                            {rmap.nodes?.length || 0} topics
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', fontWeight: '700', lineHeight: '1.3' }}>{rmap.title}</h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.85rem', flex: 1, marginBottom: '20px' }}>
                          {rmap.description || 'A structured learning path to master this domain.'}
                        </p>

                        {/* Footer */}
                        <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px', marginTop: 'auto' }}>
                          {progress !== undefined ? (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>Progress</span>
                                <span style={{ fontSize: '0.75rem', color: progress === 100 ? 'var(--success)' : 'var(--accent)', fontWeight: '700' }}>{progress}%</span>
                              </div>
                              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? 'var(--success)' : 'var(--accent)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500' }}>Start learning</span>
                              <span style={{ color: 'var(--accent)', fontSize: '1rem' }}>→</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {filteredRoadmaps.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                <h3 style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>No roadmaps found</h3>
                <p>Try adjusting your search or filters.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
