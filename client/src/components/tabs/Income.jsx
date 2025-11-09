import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import '../styles/Income.css';

export function Income() {
  const { user } = useUser();
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadEarnings();
    }
  }, [user?.id]);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/activation/earnings/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setEarnings(data.earnings);
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalByLevel = () => {
    if (!earnings?.byLevel) return [];
    return earnings.byLevel;
  };

  const getTotalEarnings = () => {
    if (!earnings?.earnings) return 0;
    return earnings.earnings.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
  };

  const getEarningsByType = () => {
    if (!earnings?.earnings) return {};
    const grouped = {};
    earnings.earnings.forEach((item) => {
      if (!grouped[item.type]) {
        grouped[item.type] = 0;
      }
      grouped[item.type] += parseFloat(item.total || 0);
    });
    return grouped;
  };

  const typeLabels = {
    activation: '💎 От активаций',
    referral_bonus: '🎁 От рефералов',
    system: '⚙️ Системный доход',
  };

  const byType = getEarningsByType();
  const totalEarnings = getTotalEarnings();
  const byLevel = getTotalByLevel();

  return (
    <div className="income-container">
      <div className="total-earnings-card">
        <div className="total-label">Всего заработано</div>
        <div className="total-amount">{totalEarnings.toFixed(2)} ⭐️</div>
      </div>

      <div className="earnings-breakdown">
        <h3>📊 Источники дохода</h3>
        {loading ? (
          <div className="loading-spinner"></div>
        ) : Object.keys(byType).length === 0 ? (
          <div className="empty-state">
            <p>Доход ещё не начислен</p>
            <p className="empty-hint">Активируйтесь и приглашайте друзей</p>
          </div>
        ) : (
          <div className="earnings-grid">
            {Object.entries(byType).map(([type, amount]) => (
              <div key={type} className="earning-item">
                <div className="earning-type">{typeLabels[type] || type}</div>
                <div className="earning-amount">{amount.toFixed(2)} ⭐️</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {byLevel.length > 0 && (
        <div className="levels-earnings">
          <h3>🎯 Доход по уровням</h3>
          <div className="levels-chart">
            {byLevel.map((item, idx) => (
              <div key={`level-${item.level}`} className="level-earnings-row">
                <div className="level-label">Уровень {item.level}</div>
                <div className="level-bar-container">
                  <div
                    className="level-bar"
                    style={{
                      width: `${Math.min(100, (parseFloat(item.total || 0) / totalEarnings) * 100)}%`,
                    }}
                  ></div>
                </div>
                <div className="level-amount">{parseFloat(item.total || 0).toFixed(2)} ⭐️</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="earnings-info">
        <h3>ℹ️ Как работает система заработка</h3>
        <div className="info-text">
          <p>🔹 <strong>Активация (10 ⭐️ в день)</strong></p>
          <ul>
            <li>Уровень 1 — 35% доход</li>
            <li>Уровень 2 — 21% доход</li>
            <li>Уровень 3 — 14% доход</li>
            <li>Уровень 4 — 8% доход</li>
            <li>Уровень 5 — 4% доход</li>
          </ul>
          
          <p>🔹 <strong>Реферальные бонусы</strong></p>
          <ul>
            <li>0.5 ⭐️ за каждую первую активацию приглашённого</li>
            <li>Глубина доступа зависит от кол-ва рефералов</li>
          </ul>

          <p>🔹 <strong>Условия</strong></p>
          <ul>
            <li>Доход начисляется только активным игрокам</li>
            <li>Активация действует 24 часа</li>
            <li>Должны быть в активной сети</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
