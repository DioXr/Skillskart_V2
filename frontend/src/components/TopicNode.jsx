import React from 'react';
import { Handle, Position } from '@xyflow/react';

const TopicNode = ({ data, selected }) => {
  const status = data.status || 'not-started';

  const phaseColors = {
    foundation: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.5)', accent: '#f59e0b' },
    core:       { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.5)',  accent: '#3b82f6' },
    advanced:   { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.5)', accent: '#a855f7' },
    mastery:    { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.5)',   accent: '#ef4444' },
  };

  const colors = phaseColors[data.phase] || phaseColors.core;

  const difficultyLabel = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
  const difficultyColor = { beginner: '#22c55e', intermediate: '#f59e0b', advanced: '#ef4444' };

  const handleStyle = {
    background: colors.accent,
    border: `1.5px solid ${colors.border}`,
    width: '7px', height: '7px',
  };

  const statusRing = {
    done: '2px solid #22c55e',
    'in-progress': '2px solid #f59e0b',
    skipped: '2px solid #6b7280',
  };

  return (
    <div style={{
      padding: '10px 16px',
      borderRadius: '10px',
      background: status === 'done' ? 'rgba(34,197,94,0.1)' : colors.bg,
      border: statusRing[status] || `1.5px solid ${colors.border}`,
      boxShadow: selected ? `0 0 0 2px ${colors.accent}, 0 4px 20px rgba(0,0,0,0.3)` : '0 2px 8px rgba(0,0,0,0.2)',
      minWidth: '160px',
      maxWidth: '220px',
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
      {status === 'in-progress' && (
        <div style={{
          position: 'absolute', top: '-8px', right: '-8px',
          width: '20px', height: '20px', borderRadius: '50%',
          background: '#f59e0b', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '0.5rem', color: '#fff',
          boxShadow: '0 2px 6px rgba(245,158,11,0.4)',
        }}>●</div>
      )}

      {/* Label */}
      <div style={{
        fontSize: '0.82rem', fontWeight: '700', color: '#f1f5f9',
        textAlign: 'center', lineHeight: '1.3',
        fontFamily: "'Inter', sans-serif",
      }}>
        {data.label}
      </div>

      {/* Difficulty + Hours */}
      {(data.difficulty || data.estimatedHours) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
          {data.difficulty && (
            <span style={{
              fontSize: '0.62rem', fontWeight: '600',
              color: difficultyColor[data.difficulty] || '#94a3b8',
              background: `${difficultyColor[data.difficulty] || '#94a3b8'}15`,
              padding: '2px 7px', borderRadius: '4px',
            }}>
              {difficultyLabel[data.difficulty]}
            </span>
          )}
          {data.estimatedHours && (
            <span style={{ fontSize: '0.62rem', color: '#64748b', background: 'rgba(255,255,255,0.04)', padding: '2px 7px', borderRadius: '4px' }}>
              ~{data.estimatedHours}h
            </span>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} id="s-bottom" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="s-right" style={handleStyle} />
    </div>
  );
};

export default TopicNode;
