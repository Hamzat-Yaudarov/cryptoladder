import React, { useState } from 'react';
import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import '../styles/Home.css';

export function Home() {
  const { user, error: initError, refreshUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [structure, setStructure] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    const loadStructure = async () => {
      try {
        const res = await fetch(`/api/pyramid/structure/${user.id}?depth=3`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.structure) {
          // build tree
          const rows = data.structure;
          const map = {};
          rows.forEach(r => { map[r.id] = { ...r, children: [] }; });
          let root = map[user.id] || { id: user.id, children: [] };
          rows.forEach(r => {
            if (r.parent_id && map[r.parent_id]) {
              map[r.parent_id].children.push(map[r.id]);
            }
          });
          setStructure(root);
        }
      } catch (err) {
        console.error('Error loading structure:', err);
      }
    };
    loadStructure();
  }, [user?.id]);

  const renderNode = (node) => {
    if (!node) return null;
    return (
      <ul className="pyramid-node">
        <li>
          <div className="node-card">
            <div className="node-name">{node.username || `#${node.id}`}</div>
            <div className="node-position">pos: {node.position_in_parent || 0}</div>
          </div>
          {node.children && node.children.length > 0 && (
            <div className="node-children">
              {node.children.map(child => (
                <div key={child.id}>{renderNode(child)}</div>
              ))}
            </div>
          )}
        </li>
      </ul>
    );
  };

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
    } catch (error) {
      setMessage(`❌ Ошибка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

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
        {balance < 3 && (
          <div className="info-message">
            💡 Для участия нужно пополнить баланс на 3 ⭐️
          </div>
        )}

        {balance >= 3 && !user.parent_id && (
          <button
            className="btn btn-primary"
            onClick={handleBuyPlace}
            disabled={loading}
          >
            {loading ? '⏳ Покупка...' : '🏆 Купить место (3 ⭐️)'}
          </button>
        )}

        {user.parent_id && balance >= 10 && (
          <button
            className="btn btn-success"
            onClick={handleActivate}
            disabled={loading || user.is_activated_today}
          >
            {loading
              ? '⏳ Активация...'
              : user.is_activated_today
              ? '✅ Активирован на сегодня'
              : '⚡ Активирова��ь (10 ⭐️)'}
          </button>
        )}

        {user.parent_id && balance < 10 && (
          <div className="info-message">
            ⚠️ Недостаточно звёзд для активации (нужно 10)
          </div>
        )}
      </div>

      {message && <div className="message-alert">{message}</div>}

      <div className="structure-preview">
        <h3>📊 Ваша позиция</h3>
        <div className="pyramid-position">
          {user.parent_id ? (
            <div className="position-info">
              ✅ Вы в с��руктуре пирамиды
              <br />
              <small>Позиция: {user.position_in_parent}/3</small>
            </div>
          ) : (
            <div className="position-info">
              ⏳ Купите место, чтобы присоединиться к пирамиде
            </div>
          )}

          <div className="pyramid-visual">
            {structure ? renderNode(structure) : <div className="loading-spinner small" />}
          </div>
        </div>
      </div>
    </div>
  );
}
