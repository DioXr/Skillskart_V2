import React from 'react';
import { Handle, Position } from '@xyflow/react';

const CheckpointNode = ({ data, selected }) => {
  const status = data.status || 'not-started';

  const handleStyle = {
    background: '#334155',
    border: '1.5px solid rgba(255,255,255,0.2)',
    width: '7px', height: '7px',
  };

  return (
    <div style={{
      padding: '10px 20px',
      borderRadius: '8px',
      background: status === 'done' ? 'rgba(34,197,94,0.08)' : 'rgba(15,23,42,0.9)',
      border: status === 'done'
        ? '1.5px solid rgba(34,197,94,0.4)'
        : '1.5px dashed rgba(148,163,184,0.35)',
      boxShadow: selected
        ? '0 0 0 2px #94a3b8, 0 4px 20px rgba(0,0,0,0.4)'
        : '0 2px 8px rgba(0,0,0,0.3)',
      minWidth: '200px',
      maxWidth: '280px',
      position: 'relative',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    }}>
      <Handle type="target" position={Position.Top} id="t-top" style={handleStyle} />
      <Handle type="target" position={Position.Left} id="t-left" style={handleStyle} />

      {/* Status badge */}
      {status === 'done' && (
        <div style={{
          position: 'absolute', top: '-8px', right: '-8px',
          width: '20px', height: '20px', borderRadius: '50%',
          background: '#22c55e', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '0.65rem', color: '#fff', fontWeight: '700',
          boxShadow: '0 2px 6px rgba(34,197,94,0.4)',
        }}>✓</div>
      )}

      {/* Checkpoint icon + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
          background: status === 'done' ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
          border: status === 'done' ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.85rem',
        }}>
          {status === 'done' ? '🏆' : '🚩'}
        </div>
        <div>
          <div style={{
            fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase',
            letterSpacing: '0.8px', color: '#64748b', marginBottom: '2px',
          }}>
            Checkpoint
          </div>
          <div style={{
            fontSize: '0.82rem', fontWeight: '700', color: '#e2e8f0',
            lineHeight: '1.3', fontFamily: "'Inter', sans-serif",
          }}>
            {data.label}
          </div>
        </div>
      </div>

      {/* Project suggestion */}
      {data.projectSuggestion && (
        <div style={{
          marginTop: '8px', padding: '6px 10px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '6px',
          fontSize: '0.7rem', color: '#94a3b8',
          borderLeft: '2px solid rgba(255,255,255,0.1)',
        }}>
          💡 {data.projectSuggestion}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} id="s-bottom" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="s-right" style={handleStyle} />
    </div>
  );
};

export default CheckpointNode;
