import React from 'react';
import { Handle, Position } from '@xyflow/react';

const SubtopicNode = ({ data, selected }) => {
  const status = data.status || 'not-started';

  const handleStyle = {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    width: '5px', height: '5px',
  };

  return (
    <div style={{
      padding: '7px 13px',
      borderRadius: '8px',
      background: status === 'done'
        ? 'rgba(34,197,94,0.08)'
        : 'rgba(255,255,255,0.03)',
      border: status === 'done'
        ? '1px solid rgba(34,197,94,0.3)'
        : '1px solid rgba(255,255,255,0.1)',
      boxShadow: selected
        ? '0 0 0 2px rgba(148,163,184,0.5), 0 2px 10px rgba(0,0,0,0.3)'
        : '0 1px 4px rgba(0,0,0,0.15)',
      minWidth: '110px',
      maxWidth: '175px',
      position: 'relative',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    }}>
      <Handle type="target" position={Position.Top} id="t-top" style={handleStyle} />
      <Handle type="target" position={Position.Left} id="t-left" style={handleStyle} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        {/* Status dot */}
        <div style={{
          width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
          background: status === 'done' ? '#22c55e' : status === 'in-progress' ? '#f59e0b' : 'rgba(255,255,255,0.2)',
          boxShadow: status === 'done' ? '0 0 6px rgba(34,197,94,0.5)' : 'none',
        }} />
        <div style={{
          fontSize: '0.76rem', fontWeight: '600',
          color: status === 'done' ? '#86efac' : '#cbd5e1',
          lineHeight: '1.3', fontFamily: "'Inter', sans-serif",
          textDecoration: status === 'done' ? 'line-through' : 'none',
          textDecorationColor: 'rgba(134,239,172,0.5)',
        }}>
          {data.label}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} id="s-bottom" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="s-right" style={handleStyle} />
    </div>
  );
};

export default SubtopicNode;
