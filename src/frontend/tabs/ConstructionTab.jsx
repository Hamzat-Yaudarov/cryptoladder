import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import '../styles/tabs.css';

export function ConstructionTab() {
  const { user } = useContext(AppContext);
  const [city, setCity] = useState(null);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConstructionData();
  }, [user]);

  const loadConstructionData = async () => {
    try {
      if (!user) return;
      const response = await fetch(`/api/city/stats?user_id=${user.telegram_id}`);

      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setCity(data.city);
      setReferralCount(data.referralCount || 0);
      setLoading(false);
    } catch (error) {
      console.error('Error loading construction data:', error);
      setLoading(false);
    }
  };

  const getUpgradeInfo = () => {
    if (referralCount >= 70) {
      return {
        level: 5,
        houses: 5,
        maxReferrals: '70+',
        nextLevel: null,
      };
    }
    if (referralCount >= 35) {
      return {
        level: 4,
        houses: 4,
        maxReferrals: '35-69',
        nextLevel: { referralsNeeded: 70 - referralCount, level: 5, houses: 5 },
      };
    }
    if (referralCount >= 15) {
      return {
        level: 3,
        houses: 3,
        maxReferrals: '15-34',
        nextLevel: { referralsNeeded: 35 - referralCount, level: 4, houses: 4 },
      };
    }
    if (referralCount > 0) {
      return {
        level: 2,
        houses: 2,
        maxReferrals: '1-14',
        nextLevel: { referralsNeeded: 15 - referralCount, level: 3, houses: 3 },
      };
    }
    return {
      level: 1,
      houses: 2,
      maxReferrals: '0',
      nextLevel: { referralsNeeded: 15, level: 3, houses: 3 },
    };
  };

  if (loading || !user) {
    return <div className="tab-container"><div className="spinner"></div></div>;
  }

  const upgradeInfo = getUpgradeInfo();

  return (
    <div className="tab-container construction-tab">
      <div className="tab-header">
        <h1>🏗️ Строительство</h1>
      </div>

      <div className="current-city">
        <h2>Текущее состояние города</h2>
        <div className="city-build-card">
          <div className="city-level-display">
            <div className="level-number">Уровень {upgradeInfo.level}</div>
            <div className="houses-display">
              {[...Array(upgradeInfo.houses)].map((_, i) => (
                <span key={i} className="house-icon">🏠</span>
              ))}
            </div>
          </div>
          <div className="city-stats-detail">
            <p><strong>Домов:</strong> {upgradeInfo.houses}</p>
            <p><strong>Уровни дохода:</strong> {upgradeInfo.level}</p>
            <p><strong>Реферралы:</strong> {referralCount}</p>
          </div>
        </div>
      </div>

      <div className="upgrade-progression">
        <h2>📈 Прогресс развития</h2>
        <div className="progression-bar">
          <div className="bar-fill" style={{ width: `${Math.min((referralCount / 70) * 100, 100)}%` }}></div>
        </div>
        <p className="progression-text">{referralCount} / 70 рефералов для максимального уровня</p>
      </div>

      <div className="upgrade-options">
        <h2>🛠️ Доступные улучшения</h2>

        <div className="upgrade-card">
          <h3>🏠 Дом</h3>
          <p className="upgrade-description">Добавляет новый уровень дохода в твой город</p>
          <div className="upgrade-requirements">
            <p><strong>Требуется:</strong> Приглашение рефералов</p>
            <p><strong>Автоматически улучшается</strong> при достижении порога рефералов</p>
          </div>
          <div className="upgrade-rewards">
            <p>✓ +1 уровень дохода</p>
            <p>✓ Больше заводов работают на тебя</p>
            <p>✓ Увеличение прибыли</p>
          </div>
        </div>

        <div className="upgrade-card">
          <h3>🏭 Завод</h3>
          <p className="upgrade-description">Активируется за 10⭐️ на 24 часа</p>
          <div className="upgrade-cost">
            <p><strong>Стоимость:</strong> 10 ⭐️ / 24 часа</p>
          </div>
          <div className="upgrade-rewards">
            <p>✓ Приносит доход рефералам</p>
            <p>✓ Дает тебе от их прибыли</p>
            <p>✓ Увелич��вается с каждым рефералом</p>
          </div>
        </div>
      </div>

      {upgradeInfo.nextLevel && (
        <div className="next-upgrade">
          <h3>🎯 Следующее улучшение</h3>
          <div className="next-upgrade-card">
            <p className="next-level">Уровень {upgradeInfo.nextLevel.level}</p>
            <p className="next-houses">
              {[...Array(upgradeInfo.nextLevel.houses)].map((_, i) => (
                <span key={i} className="house-icon-small">🏠</span>
              ))}
            </p>
            <p className="upgrade-progress">
              Приглаши ещё <strong>{upgradeInfo.nextLevel.referralsNeeded}</strong> человек
            </p>
            <p className="upgrade-benefit">
              Получишь {upgradeInfo.nextLevel.houses} домов и {upgradeInfo.nextLevel.level} уровней дохода
            </p>
          </div>
        </div>
      )}

      <div className="upgrade-guide">
        <h3>💡 Как расширять город:</h3>
        <ol>
          <li>Скопируй реферальную ссылку в табе "Жители"</li>
          <li>Поделись ссылкой с друзьями в Telegram</li>
          <li>Каждый приглашённый друг = +1 к развитию города</li>
          <li>При достижении порога откроется новый уровень</li>
          <li>Больше домов = больше заработков от рефералов</li>
        </ol>
      </div>
    </div>
  );
}
