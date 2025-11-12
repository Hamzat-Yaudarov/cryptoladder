import React from 'react';
import '../styles/Pyramid.css';

function PersonCard({ node }) {
  return (
    <div className="person-card">
      <div className="person-avatar">👤</div>
      <div className="person-name">{node.first_name || node.username || `user${node.id}`}</div>
      {node.username && <div className="person-username">@{node.username}</div>}
    </div>
  );
}

// Build levels up to maxDepth (breadth-first)
function buildLevels(root, maxDepth = 5) {
  if (!root) return [];
  const levels = [];
  let current = [root];
  let depth = 0;
  while (current.length > 0 && depth < maxDepth) {
    levels.push(current);
    const next = [];
    for (const node of current) {
      if (node.children && node.children.length > 0) {
        next.push(...node.children);
      }
    }
    current = next;
    depth++;
  }
  return levels;
}

export default function Pyramid({ roots, maxDepth = 5 }) {
  const root = roots && roots[0];
  if (!root) return <div className="pyramid-empty">Пирамида пуста</div>;

  const levels = buildLevels(root, maxDepth);
  const maxColumns = Math.max(...levels.map(l => l.length));

  return (
    <div className="pyramid-visual">
      <div className="level-row level-root">
        <div className="level-cell level-center">
          <PersonCard node={root} />
        </div>
      </div>

      {levels.slice(1).map((lvl, idx) => (
        <div key={idx} className="level-row" style={{ gridTemplateColumns: `repeat(${maxColumns}, 1fr)` }}>
          {Array.from({ length: maxColumns }).map((_, col) => {
            const node = lvl[col];
            return (
              <div key={col} className="level-cell">
                {node ? <PersonCard node={node} /> : <div className="empty-cell" />}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
