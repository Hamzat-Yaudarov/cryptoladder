import React, { useState } from 'react';
import './Pyramid.css';

function Node({ node }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <li className="pyramid-node">
      <div className="node-card" onClick={() => setExpanded(v => !v)}>
        <div className="node-avatar">👤</div>
        <div className="node-info">
          <div className="node-name">{node.first_name || node.username || `user${node.id}`}</div>
          {node.username && <div className="node-username">@{node.username}</div>}
        </div>
        {hasChildren && (
          <div className={`node-toggle ${expanded ? 'open' : ''}`}>{expanded ? '▾' : '▸'}</div>
        )}
      </div>

      {hasChildren && expanded && (
        <ul className="node-children">
          {node.children.map((child) => (
            <Node key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function Pyramid({ roots }) {
  if (!roots || roots.length === 0) return <div className="pyramid-empty">Пирамидa пуста</div>;

  return (
    <div className="pyramid-container">
      <ul className="pyramid-root-list">
        {roots.map((root) => (
          <Node key={root.id} node={root} />
        ))}
      </ul>
    </div>
  );
}
