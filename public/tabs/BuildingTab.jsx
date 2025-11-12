import React, { useState, useEffect } from 'react';
import '../styles/tabs.css';

const BuildingTab = ({ user, onRefresh }) => {
  const [upgrades, setUpgrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [city, setCity] = useState(null);

  useEffect(() => {
    fetchUpgrades();
  }, []);

  const fetchUpgrades = async () => {
    try {
      setLoading(true);
      const initData = window.Telegram?.WebApp?.initData || '';

      const [upgradesRes, cityRes] = await Promise.all([
        fetch('/api/building/upgrades', { headers: { Authorization: `Bearer ${initData}` } }),
        fetch('/api/city', { headers: { Authorization: `Bearer ${initData}` } }),
      ]);

      if (upgradesRes.ok) {
        const data = await upgradesRes.json();
        setUpgrades(data);
      }

      if (cityRes.ok) {
        const data = await cityRes.json();
        setCity(data);
      }
    } catch (error) {
      console.error('Error fetching upgrades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (level) => {
    try {
      setUpgrading(true);
      const initData = window.Telegram?.WebApp?.initData || '';

      const response = await fetch('/api/building/upgrade', {
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
      await fetchUpgrades();
      onRefresh();
      alert(`✅ Город улучшен до уровня ${level}!`);
    } catch (error) {
      console.error('Error upgrading:', error);
      alert('❌ Ошибка при улучшении города');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return <div className="tab-content">⏳ Загрузка строительства...</div>;
  }

  return (
    <div className="tab-content building-tab">
      <div className="building-header">
        <h2>🏗️ Строительство и улучшения</h2>
      </div>

      {city && (
        <div className="current-city">
          <div className="city-level-badge">
            <span className="level-label">Текущий уровень</span>
            <span className="level-number">{city.level}</span>
          </div>
          <div className="city-features">
            <div className="feature">
              <span className="feature-icon">🏠</span>
              <span className="feature-text">{city.total_houses} домов</span>
            </div>
            <div className="feature">
              <span className="feature-icon">📈</span>
              <span className="feature-text">До {city.level} уровней дохода</span>
            </div>
          </div>
        </div>
      )}

      <div className="upgrades-list">
        <h3>🔧 Доступные улучшения</h3>

        {upgrades.length === 0 ? (
          <div className="empty-state">
            <p>✅ Вы достигли максимального уровня города!</p>
            <p className="hint">Уровень 5 - это последний уровень развития</p>
          </div>
        ) : (
          <div className="upgrades-grid">
            {upgrades.map((upgrade) => (
              <div
                key={upgrade.level}
                className={`upgrade-card ${upgrade.available ? 'available' : 'locked'}`}
              >
                <div className="upgrade-level">
                  <span className="level-icon">🏢</span>
                  <span className="level-title">Уровень {upgrade.level}</span>
                </div>

                <div className="upgrade-features">
                  <div className="feature-item">
                    <span className="feature-label">Домов:</span>
                    <span className="feature-value">{upgrade.houses}</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-label">Уровней дохода:</span>
                    <span className="feature-value">{upgrade.level}</span>
                  </div>
                </div>

                <div className="upgrade-requirement">
                  {upgrade.available ? (
                    <span className="requirement-met">
                      ✅ Требование выполнено
                    </span>
                  ) : (
                    <span className="requirement-unmet">
                      📍 Нужно реф��реалов: {upgrade.minReferrals}+
                    </span>
                  )}
                </div>

                <button
                  className={`btn ${upgrade.available ? 'btn-success' : 'btn-disabled'}`}
                  onClick={() => handleUpgrade(upgrade.level)}
                  disabled={!upgrade.available || upgrading}
                >
                  {upgrading ? '⏳ Улучшаю...' : '🔨 Улучшить'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="factory-management">
        <h3>🏭 Управление заводом</h3>
        <div className="management-info">
          <div className="management-card">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <div className="card-title">Дневной доход</div>
              <div className="card-value">10 ⭐️</div>
            </div>
          </div>

          <div className="management-card">
            <div className="card-icon">⏱️</div>
            <div className="card-content">
              <div className="card-title">Длительность</div>
              <div className="card-value">24 часа</div>
            </div>
          </div>

          <div className="management-card">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <div className="card-title">Стоимость активации</div>
              <div className="card-value">10 ⭐️</div>
            </div>
          </div>
        </div>
      </div>

      <div className="upgrade-guide">
        <h3>📈 Путь развития</h3>
        <div className="guide-steps">
          <div className="guide-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <div className="step-title">Создайте город</div>
              <div className="step-desc">Начните с 2 домов и 1 завода</div>
            </div>
          </div>

          <div className="guide-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <div className="step-title">Пригласите жителей</div>
              <div className="step-desc">Получите рефереалов через пригласительную ссылку</div>
            </div>
          </div>

          <div className="guide-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <div className="step-title">Улучшайте город</div>
              <div className="step-desc">Расширяйте по мере роста числа рефереалов</div>
            </div>
          </div>

          <div className="guide-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <div className="step-title">Получайте доход</div>
              <div className="step-desc">Зарабатывайте от активности на всех уровнях</div>
            </div>
          </div>
        </div>
      </div>

      <div className="info-box">
        <h4>💡 Советы по развитию</h4>
        <ul>
          <li>Каждый новый уровень даёт дополнительный дом</li>
          <li>Большинство рефереалов = более высокий уровень города</li>
          <li>Каждый дом = 1 уровень, с которого вы получаете доход</li>
          <li>Пригласите минимум 70 человек для уровня 5</li>
        </ul>
      </div>
    </div>
  );
};

export default BuildingTab;
