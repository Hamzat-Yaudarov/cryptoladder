import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import '../styles/tabs/BuildTab.css';

const CITY_LEVELS = {
  1: { houses: 2, referral_range: '0-14', factory_count: 1 },
  2: { houses: 2, referral_range: '0-14', factory_count: 1 },
  3: { houses: 3, referral_range: '15-34', factory_count: 1 },
  4: { houses: 4, referral_range: '35-69', factory_count: 1 },
  5: { houses: 5, referral_range: '70+', factory_count: 1 },
};

export default function BuildTab({ userData, refreshUser, telegramId }) {
  const [cityData, setCityData] = useState(null);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchCityData();
  }, [telegramId]);

  const fetchCityData = async () => {
    try {
      const params = new URLSearchParams({ telegram_id: telegramId.toString() });
      const data = await fetch(`/api/city?${params}`, { 
        headers: { 'X-Telegram-ID': telegramId.toString() } 
      }).then(r => r.json());
      setCityData(data);
    } catch (error) {
      console.error('Failed to fetch city data:', error);
    }
  };

  const handleUpgradeCity = async () => {
    setUpgrading(true);
    try {
      const data = await fetch('/api/city/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-ID': telegramId.toString(),
        },
        body: JSON.stringify({ telegram_id: telegramId.toString() }),
      }).then(r => r.json());

      if (data.error) {
        alert(`Ошибка: ${data.error}`);
      } else {
        await Promise.all([fetchCityData(), refreshUser()]);
        alert('✅ Город улучшен!');
      }
    } catch (error) {
      alert(`Ошибка: ${error.message}`);
    } finally {
      setUpgrading(false);
    }
  };

  if (!userData?.is_city_active) {
    return (
      <div className="build-tab">
        <Card className="not-active-card">
          <div className="not-active-content">
            <div className="not-active-emoji">🔨</div>
            <p className="not-active-message">Создайте город, чтобы начать строительство</p>
          </div>
        </Card>
      </div>
    );
  }

  const currentLevel = userData.city_level;
  const nextLevel = currentLevel + 1;
  const canUpgrade = nextLevel <= 5 && userData.total_referrals >= (CITY_LEVELS[nextLevel]?.referral_range || '∞');

  return (
    <div className="build-tab">
      <h1 className="build-title">🏗 Строительство города</h1>

      <Card className="current-level-card">
        <div className="level-display">
          <div className="level-number">Уровень {currentLevel}</div>
          <div className="level-info">
            <div className="level-stat">
              <span className="stat-icon">🏠</span>
              <span className="stat-text">Домов: {cityData?.houses || 0}</span>
            </div>
            <div className="level-stat">
              <span className="stat-icon">👥</span>
              <span className="stat-text">Уровней дохода: {userData.city_level}</span>
            </div>
            <div className="level-stat">
              <span className="stat-icon">🏭</span>
              <span className="stat-text">Заводов: {cityData?.factory_count || 0}</span>
            </div>
          </div>
        </div>

        {currentLevel < 5 && (
          <div className="upgrade-requirements">
            <h3 className="requirements-title">📋 Требования для уровня {nextLevel}:</h3>
            <div className="requirement">
              <span className="requirement-label">👥 Приглашено реферралов:</span>
              <div className="requirement-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${Math.min((userData.total_referrals / parseInt(CITY_LEVELS[nextLevel].referral_range.split('-')[1] || '100')) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="progress-text">
                  {userData.total_referrals} / {CITY_LEVELS[nextLevel].referral_range}
                </span>
              </div>
            </div>

            <div className="upgrade-benefits">
              <h4 className="benefits-title">🎁 Получите при улучшении:</h4>
              <ul className="benefits-list">
                <li>🏠 Новый дом (+1 уровень дохода)</li>
                <li>👥 Возможность более глубокой структуры</li>
                <li>💰 Больше пот��нциального дохода</li>
              </ul>
            </div>

            <Button
              onClick={handleUpgradeCity}
              disabled={upgrading || !canUpgrade}
              className="upgrade-btn"
            >
              {upgrading ? '⏳ Улучшение...' : '⬆️ Улучшить город'}
            </Button>

            {!canUpgrade && (
              <p className="upgrade-requirement-text">
                ⚠️ Нужно {CITY_LEVELS[nextLevel].referral_range} реферралов
              </p>
            )}
          </div>
        )}

        {currentLevel === 5 && (
          <div className="max-level-message">
            <div className="max-level-emoji">🏆</div>
            <p className="max-level-text">Вы достигли максимального уровня города!</p>
          </div>
        )}
      </Card>

      <Card className="level-progression-card">
        <h3 className="progression-title">📊 Прогресс города</h3>
        <div className="level-chart">
          {[1, 2, 3, 4, 5].map((level) => (
            <div 
              key={level} 
              className={`level-item ${level <= currentLevel ? 'completed' : level === currentLevel + 1 ? 'next' : ''}`}
            >
              <div className="level-badge">Lv.{level}</div>
              <div className="level-desc">
                {CITY_LEVELS[level]?.houses} домов<br/>
                {CITY_LEVELS[level]?.referral_range} реф.
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="building-info-card">
        <h3 className="info-title">💡 Информация о строительстве</h3>
        <div className="info-section">
          <h4>🏠 Дома</h4>
          <p>Каждый дом представляет уровень, с которого вы получаете доход. Максимум 5 уровней.</p>
        </div>
        <div className="info-section">
          <h4>🏭 Заводы</h4>
          <p>Каждый завод может быть активирован на 24 часа. Активный завод приносит прибыль вашим жителям.</p>
        </div>
        <div className="info-section">
          <h4>👥 Жители</h4>
          <p>Приглашайте больше друзей - они заселяются в ваши дома и приносят вам доход от своих заводов.</p>
        </div>
      </Card>
    </div>
  );
}
