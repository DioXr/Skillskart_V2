import React from 'react';
import { Handle, Position } from '@xyflow/react';

const ProNode = ({ data, selected }) => {
  // 🎨 SURPRISE COLORING BASED ON CATEGORY OR TAGS
  const getCategoryColor = () => {
    const label = data.label.toLowerCase();
    if (label.includes('career') || data.category === 'Career') return '#bf5af2'; // Amethyst Purple
    if (label.includes('language') || data.category === 'Language') return '#0a84ff'; // Sapphire Blue
    if (label.includes('tool') || label.includes('git') || label.includes('docker')) return '#30d158'; // Emerald Green
    return '#00e5ff'; // Signature Cyan
  };

  const accentColor = getCategoryColor();

  return (
    <div className={`pro-node-minimal ${selected ? 'selected' : ''}`} style={{
      padding: '12px 24px',
      borderRadius: '30px', /* Pill shaped like roadmap.sh */
      background: 'rgba(20, 20, 20, 0.9)',
      backdropFilter: 'blur(8px)',
      border: `1.5px solid ${selected ? accentColor : 'rgba(255, 255, 255, 0.15)'}`,
      boxShadow: selected ? `0 0 15px ${accentColor}44` : '0 4px 15px rgba(0,0,0,0.4)',
      minWidth: '160px',
      textAlign: 'center',
      color: '#fff',
      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      position: 'relative',
      cursor: 'pointer'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: accentColor, border: 'none', width: '6px', height: '6px' }} />
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', letterSpacing: '0.3px' }}>
            {data.label}
        </h4>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: accentColor, border: 'none', width: '6px', height: '6px' }} />
      
      {/* Subtle Bottom Accent */}
      <div style={{ 
          position: 'absolute', 
          bottom: '4px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          width: '20px', 
          height: '2px', 
          borderRadius: '2px',
          background: accentColor,
          opacity: selected ? 0.8 : 0.3
      }} />
    </div>
  );
};

export default ProNode;
