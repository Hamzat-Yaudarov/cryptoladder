import React, { useState, useEffect } from 'react';
import '../styles/tabs.css';

const CityTab = ({ user, onRefresh }) => {
  const [city, setCity] = useState(null);
  const [factory, setFactory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [creatingCity, setCreatingCity] = useState(false);

  useEffect(() => {
    fetchCityData();
  }, []);

  const fetchCityData = async () => {
    try {
      setLoading(true);
      const initData = window.Telegram?.WebApp?.initData || '';

      const [cityRes, factoryRes] = await Promise.all([
        fetch('/api/city', { headers: { Authorization: `Bearer ${initData}` } }),
        fetch('/api/factory', { headers: { Authorization: `Bearer ${initData}` } }),
      ]);

      if (cityRes.ok) {
        const cityData = await cityRes.json();
        setCity(cityData);
      }

      if (factoryRes.ok) {
        const factoryData = await factoryRes.json();
        setFactory(factoryData);
      }
    } catch (error) {
      console.error('Error fetching city data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCity = async () => {
    try {
      setCreatingCity(true);
      const initData = window.Telegram?.WebApp?.initData || '';

      const response = await fetch('/api/city/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${initData}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`❌ ${error.error}`);
        return;
      }

      const result = await response.json();
      setCity(result.city);
      onRefresh();
      alert('✅ Город успешно создан!');
    } catch (error) {
      console.error('Error creating city:', error);
      alert('❌ Ошибка при создании города');
    } finally {
      setCreatingCity(false);
    }
  };

  const handleActivateFactory = async () => {
    try {
      setActivating(true);
      const initData = window.Telegram?.WebApp?.initData || '';

      const response = await fetch('/api/factory/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${initData}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`❌ ${error.error}`);
        return;
      }

      const result = await response.json();
      setFactory(result.factory);
      onRefresh();
      alert('✅ Завод активирован на 24 часа!');
    } catch (error) {
      console.error('Error activating factory:', error);
      alert('❌ Ошибка при активации завода');
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return <div className="tab-content">⏳ Загрузка города...</div>;
  }

  if (!city) {
    return (
      <div className="tab-content city-tab">
        <div className="city-empty">
          <h2>🏙️ Создайте свой город</h2>
          <p>Стоимость создания города: <strong>3 ⭐️</strong></p>
          <p>Вы получите: 2 дома + 1 завод</p>

          <button
            className="btn btn-primary btn-lg"
            onClick={handleCreateCity}
            disabled={creatingCity || user.balance < 3}
          >
            {creatingCity ? '⏳ Создание...' : '🔨 Создать город'}
          </button>

          <div className="info-box">
            <h3>📚 Как это работает:</h3>
            <ul>
              <li>🏠 Дома дают вам уровни дохода</li>
              <li>🏭 Заводы генерируют прибыль</li>
              <li>👥 Пригласите жителей (рефереалов)</li>
              <li>💰 Получайте доход от активности</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const isFactoryActive = factory?.is_active;
  const factoryExpiryTime = factory?.activated_until ? new Date(factory.activated_until) : null;
  const timeUntilExpiry = factoryExpiryTime ? Math.max(0, (factoryExpiryTime - new Date()) / 1000 / 3600) : 0;

  return (
    <div className="tab-content city-tab">
      <div className="city-header">
        <div className="city-title">
          <h2>🏙️ Ваш город</h2>
          <p className="city-level">Уровень {city.level}</p>
        </div>
      </div>

      <div className="balance-card">
        <div className="balance-value">{user.balance.toFixed(2)}</div>
        <div className="balance-label">⭐️ Баланс</div>
      </div>

      <div className="city-stats">
        <div className="stat-item">
          <span className="stat-icon">🏠</span>
          <div className="stat-info">
            <span className="stat-label">Домов</span>
            <span className="stat-value">{city.total_houses}</span>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-icon">👥</span>
          <div className="stat-info">
            <span className="stat-label">Жителей</span>
            <span className="stat-value">{city.residents?.length || 0}</span>
          </div>
        </div>
      </div>

      <div className="factory-section">
        <h3>🏭 Завод</h3>
        {isFactoryActive ? (
          <div className="factory-active">
            <p>✅ Завод активен</p>
            <p className="time-left">⏱️ Осталось: {timeUntilExpiry.toFixed(1)} часов</p>
            <p className="daily-profit">Дневной доход: <strong>10 ⭐️</strong></p>
          </div>
        ) : (
          <div className="factory-inactive">
            <p>❌ Завод неактивен</p>
            <p className="cost">Стоимость активации: <strong>10 ⭐️/сутки</strong></p>
            <button
              className="btn btn-success"
              onClick={handleActivateFactory}
              disabled={activating || user.balance < 10}
            >
              {activating ? '⏳ Активирую...' : '▶️ Активировать'}
            </button>
          </div>
        )}
      </div>

      <div className="city-structure">
        <h3>🏘️ Структура города</h3>
        <div className="houses-grid">
          {city.houses?.map((house, idx) => (
            <div key={idx} className="house-card">
              <div className="house-level">Уровень {house.level}</div>
              {house.resident_id ? (
                <div className="house-resident">👤 {house.resident_id}</div>
              ) : (
                <div className="house-empty">Пусто</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="info-box">
        <h4>💡 Советы</h4>
        <ul>
          <li>Активируйте завод для получения дохода</li>
          <li>Пригласите больше жителей для расширения города</li>
          <li>Повышайте уровень города для дополнительных домов</li>
        </ul>
      </div>
    </div>
  );
};

export default CityTab;
