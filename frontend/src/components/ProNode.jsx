import React from 'react';
import { Handle, Position } from '@xyflow/react';

const NODE_COLORS = ['color-blue', 'color-purple', 'color-pink', 'color-amber', 'color-green', 'color-red'];

function hashColor(label) {
  let hash = 0;
  for (let i = 0; i < (label || '').length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  return NODE_COLORS[Math.abs(hash) % NODE_COLORS.length];
}

const handleStyle = { background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)', width: '6px', height: '6px' };

const ProNode = ({ data, selected }) => {
  const status = data.status || 'not-started';
  const statusClass = status !== 'not-started' ? `status-${status}` : '';
  const colorClass = data.isSpine ? 'is-spine' : hashColor(data.label);

  return (
    <div className={`pro-node ${colorClass} ${statusClass} ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} id="t-top" style={handleStyle} />
      <Handle type="target" position={Position.Left} id="t-left" style={handleStyle} />
      <Handle type="target" position={Position.Right} id="t-right" style={handleStyle} />
      <Handle type="target" position={Position.Bottom} id="t-bottom" style={handleStyle} />

      {/* Status Badges */}
      {status === 'done' && (
        <div className="status-badge status-badge-done" title="Completed">✓</div>
      )}
      {status === 'in-progress' && (
        <div className="status-badge status-badge-progress" title="In Progress">●</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', justifyContent: 'center' }}>
        <p className="pro-node-label">{data.label}</p>
      </div>

      <Handle type="source" position={Position.Bottom} id="s-bottom" style={handleStyle} />
      <Handle type="source" position={Position.Left} id="s-left" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="s-right" style={handleStyle} />
    </div>
  );
};

export default ProNode;
