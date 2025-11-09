import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import '../styles/Home.css';

export function Home() {
  const { user, error: initError, refreshUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [structure, setStructure] = useState([]);

  const handleActivate = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setMessage('');

      const response = await fetch(`/api/activation/activate/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(`❌ ${data.error}`);
        return;
      }

      setMessage('✅ Активация успешна!');
      await refreshUser();
      await loadStructure();
    } catch (error) {
      setMessage(`❌ Ошибка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPlace = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setMessage('');

      const response = await fetch(`/api/activation/buy-place/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(`❌ ${data.error}`);
        return;
      }

      setMessage('✅ Место куплено!');
      await refreshUser();
      await loadStructure();
    } catch (error) {
      setMessage(`❌ Ошибка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadStructure = async () => {
    if (!user?.id) return;
    try {
      const resp = await fetch(`/api/pyramid/structure/${user.id}?depth=3`);
      if (!resp.ok) return;
      const data = await resp.json();
      setStructure(data.structure || []);
    } catch (err) {
      console.error('Error loading structure:', err);
    }
  };

  useEffect(() => {
    loadStructure();
  }, [user?.id]);

  if (initError) {
    return (
      <div className="home-error">
        <div className="error-icon">⚠️</div>
        <p className="error-message">{initError}</p>
        <p className="error-hint">Убедитесь, что вы открыли приложение через Telegram</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="home-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  const balance = parseFloat(user.balance || 0);
  const statusText = user.is_activated_today ? '✅ Активирован' : '⏳ Неактивирован';
  const statusClass = user.is_activated_today ? 'active' : 'inactive';

  const buildTree = (nodes) => {
    const map = {};
    nodes.forEach((n) => { map[n.id] = { ...n, children: [] }; });
    let root = map[user.id] || null;
    nodes.forEach((n) => {
      if (n.parent_id && map[n.parent_id]) {
        map[n.parent_id].children.push(map[n.id]);
      }
    });
    return root ? [root] : [];
  };

  const renderNode = (node) => {
    return (
      <li key={node.id} className="pyramid-node">
        <div className="node-card">
          <div className="node-name">{node.username || `#${node.telegram_id}`}</div>
          <div className="node-meta">{node.position_in_parent ? `pos ${node.position_in_parent}` : ''}</div>
        </div>
        {node.children && node.children.length > 0 && (
          <ul className="pyramid-children">
            {node.children.map((c) => renderNode(c))}
          </ul>
        )}
      </li>
    );
  };

  const tree = buildTree(structure);

  return (
    <div className="home-container">
      <div className="balance-card">
        <div className="balance-label">Ваш баланс</div>
        <div className="balance-amount">
          {balance.toFixed(2)} ⭐️
        </div>
      </div>

      <div className="status-card">
        <div className="status-header">Статус активации</div>
        <div className={`status-badge ${statusClass}`}>
          {statusText}
        </div>
        {user.last_activation && (
          <div className="last-activation">
            Последняя активация:{' '}
            {new Date(user.last_activation).toLocaleString('ru-RU')}
          </div>
        )}
      </div>

      <div className="referral-info">
        <div className="info-item">
          <span className="info-label">👥 Рефералы:</span>
          <span className="info-value">{user.referral_count || 0}</span>
        </div>
        <div className="info-item">
          <span className="info-label">💰 Доход:</span>
          <span className="info-value">{user.total_earnings?.toFixed(2) || '0.00'} ⭐️</span>
        </div>
      </div>

      <div className="action-buttons">
        {/* Always show buy place when user is not in structure; disable if insufficient balance */}
        {!user.parent_id && (
          <button
            className="btn btn-primary"
            onClick={handleBuyPlace}
            disabled={loading || balance < 3}
            title={balance < 3 ? 'Недостаточно звёзд (нужно 3)' : 'Купить место (3 ⭐️)'}
          >
            {loading ? '⏳ Покупка...' : '🏆 Купить место (3 ⭐️)'}
          </button>
        )}

        {/* Activation button is visible when user has a place in structure */}
        {user.parent_id && (
          <button
            className="btn btn-success"
            onClick={handleActivate}
            disabled={loading || user.is_activated_today || balance < 10}
            title={balance < 10 ? 'Недостаточно звёзд (нужно 10)' : 'Активировать (10 ⭐️)'}
          >
            {loading
              ? '⏳ Активация...'
              : user.is_activated_today
              ? '✅ Активирован на сегодня'
              : '⚡ Активировать (10 ⭐️)'}
          </button>
        )}

        {message && <div className="message-alert">{message}</div>}
      </div>

      <div className="structure-preview">
        <h3>📊 Ваша позиция</h3>
        <div className="pyramid-position">
          {tree.length === 0 ? (
            <div className="position-info">⏳ Структура недоступна</div>
          ) : (
            <ul className="pyramid-root">{tree.map((n) => renderNode(n))}</ul>
          )}
        </div>
      </div>
    </div>
  );
}
