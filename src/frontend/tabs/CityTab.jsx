import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import '../styles/tabs.css';

export function CityTab() {
  const { user } = useContext(AppContext);
  const [city, setCity] = useState(null);
  const [factory, setFactory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setLoading(true);
    loadCityData();
    const interval = setInterval(loadCityData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const loadCityData = async () => {
    try {
      if (!user) return;
      const response = await fetch(`/api/city/stats?user_id=${user.telegram_id}`);
      if (response.ok) {
        const data = await response.json();
        setCity(data.city);
        setFactory(data.activeFactory);
      }
    } catch (error) {
      console.error('Error loading city:', error);
    } finally {
      setLoading(false);
    }
  };

  const activateFactory = async () => {
    try {
      setActivating(true);
      const response = await fetch(`/api/factory/activate?user_id=${user.telegram_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('✅ Завод активирован на 24 часа!');
        await loadCityData();
      } else {
        const error = await response.json();
        setMessage(`❌ ${error.error}`);
      }
    } catch (error) {
      setMessage('❌ Ошибка при активации завода');
    } finally {
      setActivating(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading || !user) {
    return <div className="tab-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="tab-container city-tab">
      <div className="city-header">
        <h1>🏙️ Твой Город</h1>
        <div className="city-level">Уровень {city?.level || 1}</div>
      </div>

      <div className="balance-card">
        <div className="balance-title">Баланс</div>
        <div className="balance-amount">
          {city?.balance?.toFixed(2) || '0.00'} <span className="star">⭐️</span>
        </div>
      </div>

      <div className="city-stats">
        <div className="stat-item">
          <span className="stat-icon">🏠</span>
          <span className="stat-label">Дома</span>
          <span className="stat-value">{city?.houses || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🏭</span>
          <span className="stat-label">Заводы</span>
          <span className="stat-value">1</span>
        </div>
      </div>

      <div className="factory-section">
        <h2>🏭 Завод</h2>
        {factory?.is_active ? (
          <div className="factory-active">
            <div className="status-badge active">✓ Активен</div>
            <p>Работает до: {new Date(factory.deactivates_at).toLocaleTimeString()}</p>
            <div className="profit-info">
              <p>Заводы приносят прибыль и доход рефералам</p>
            </div>
          </div>
        ) : (
          <div className="factory-inactive">
            <div className="status-badge inactive">✗ Неактивен</div>
            <p>Для получения прибыли активируй завод</p>
            <div className="cost-info">
              <p>Стоимость: <strong>10 ⭐️ / 24ч</strong></p>
            </div>
            <button
              className="btn btn-primary"
              onClick={activateFactory}
              disabled={activating || !city || city.balance < 10}
            >
              {activating ? 'Активируется...' : '🚀 Активировать завод'}
            </button>
          </div>
        )}
      </div>

      {message && <div className="message-banner">{message}</div>}

      <div className="city-info">
        <h3>💡 Как получать прибыль:</h3>
        <ul>
          <li>✓ Активируй завод (10⭐️ за 24 часа)</li>
          <li>✓ Приглашай жителей через реферальную ссылку</li>
          <li>✓ Их заводы будут приносить тебе доход</li>
          <li>✓ Чем больше рефералов → выше город → больше уровней дохода</li>
        </ul>
      </div>

      <div className="payout-section">
        <h3>💰 Информация о выплатах</h3>
        <p>Прибыль выплачивается каждый час автоматически на твой баланс</p>
        <p className="payout-note">Проверь историю в табе "Доход"</p>
      </div>
    </div>
  );
}
