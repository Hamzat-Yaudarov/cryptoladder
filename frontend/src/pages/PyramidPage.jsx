import React, { useEffect, useState } from 'react';
import Pyramid from '../components/Pyramid';
import '../styles/Pyramid.css';
import '../styles/tabs/ResidentsTab.css';

export default function PyramidPage({ telegramId }) {
  const [root, setRoot] = useState(null);
  const [originalRoot, setOriginalRoot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [depthLimit, setDepthLimit] = useState(5);

  useEffect(() => {
    if (!telegramId) return;
    fetchMine();
  }, [telegramId]);

  useEffect(() => {
    if (!originalRoot) return;
    setRoot(pruneDepth(originalRoot, depthLimit));
  }, [depthLimit, originalRoot]);

  const pruneDepth = (node, depth) => {
    if (!node) return null;
    if (depth <= 1) return { ...node, children: [] };
    return {
      ...node,
      children: (node.children || []).map((c) => pruneDepth(c, depth - 1)).filter(Boolean)
    };
  };

  const fetchMine = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/structure/mine', { headers: { 'X-Telegram-ID': telegramId.toString() } });
      const data = await res.json();
      const rootNode = data.root || null;
      setOriginalRoot(rootNode);
      setRoot(pruneDepth(rootNode, depthLimit));
    } catch (err) {
      console.error('Failed to fetch structure', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Client-side search over originalRoot
    if (!originalRoot) return;
    const q = query.trim().toLowerCase();
    if (!q) return setRoot(pruneDepth(originalRoot, depthLimit));

    const matchTree = (node) => {
      const name = (node.username || node.first_name || '').toString().toLowerCase();
      const found = name.includes(q);
      const children = (node.children || []).map(matchTree).filter(Boolean);
      if (found || children.length > 0) {
        return { ...node, children };
      }
      return null;
    };

    const matched = matchTree(originalRoot);
    setRoot(pruneDepth(matched, depthLimit));
  };

  return (
    <div className="pyramid-page">
      <div className="pyramid-controls">
        <input placeholder="Поиск по имени или username" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button onClick={handleSearch}>Найти</button>
        <label>Глубина:
          <select value={depthLimit} onChange={(e) => setDepthLimit(parseInt(e.target.value, 10))}>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
        </label>
        <button onClick={fetchMine}>Обновить</button>
      </div>

      {loading && <div>Загрузка...</div>}

      {!loading && root && (
        <div className="pyramid-wrap">
          <Pyramid roots={[root]} />
        </div>
      )}

      {!loading && !root && (
        <div>Ваша пирамида пуста</div>
      )}
    </div>
  );
}
