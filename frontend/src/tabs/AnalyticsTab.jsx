import React, { useEffect, useState, useRef } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import '../styles/Analytics.css';

export default function AnalyticsTab({ userData, refreshUser, telegramId }) {
  const [distribution, setDistribution] = useState([]);
  const [total, setTotal] = useState(0);
  const [animatingStars, setAnimatingStars] = useState([]);
  const balanceRef = useRef(null);

  useEffect(() => {
    fetchDistribution();
  }, [telegramId]);

  const fetchDistribution = async () => {
    try {
      const params = new URLSearchParams({ telegram_id: telegramId.toString() });
      const res = await fetch(`/api/residents/distribution?${params}`, { headers: { 'X-Telegram-ID': telegramId.toString() } });
      const data = await res.json();
      // data: array with level, player_count, level_total_profit
      setDistribution(data || []);
      const sum = (data || []).reduce((s, r) => s + parseFloat(r.level_total_profit || 0), 0);
      setTotal(sum.toFixed(2));
    } catch (err) {
      console.error('Failed to fetch distribution', err);
    }
  };

  // Start animation of stars flowing to balance every N seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // create a star animation instance
      const id = Date.now();
      setAnimatingStars(s => [...s, id]);
      // after animation, refreshUser to update balance
      setTimeout(() => {
        setAnimatingStars(s => s.filter(x => x !== id));
        if (refreshUser) refreshUser();
      }, 1800);
    }, 6000);

    return () => clearInterval(interval);
  }, [refreshUser]);

  return (
    <div className="analytics-tab">
      <h2>📊 Статистика доходов</h2>

      <div className="analytics-grid">
        <Card className="analytics-card">
          <h3>Доход по уровням (в сутки)</h3>

          <div className="level-list">
            {distribution.map((row) => (
              <div key={row.level} className="level-row">
                <div className="level-label">{row.level} уровень</div>
                <div className="level-count">{row.player_count} активных</div>
                <div className="level-profit">{parseFloat(row.level_total_profit).toFixed(2)}⭐️ / сутки</div>
              </div>
            ))}
          </div>

          <div className="analytics-total">
            <div>Всего</div>
            <div className="total-value">+{total}⭐️ / сутки</div>
            <div className="total-note">(поступает равномерно каждый час)</div>
          </div>
        </Card>

        <Card className="balance-card-analytics">
          <h3>Баланс и поступления</h3>
          <div className="balance-display">
            <div className="balance-value">{Math.floor(userData?.balance || 0)}⭐️</div>
            <div className="balance-sub">Текущий баланс</div>
          </div>

          <div className="analytics-actions">
            <Button onClick={fetchDistribution}>Обновить</Button>
            <Button onClick={() => { if (refreshUser) refreshUser(); }}>Обновить баланс</Button>
          </div>

          <div className="star-animation-area">
            {animatingStars.map((id) => (
              <div key={id} className="flowing-star">⭐️</div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
