import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import '../styles/tabs/IncomeTab.css';

export default function IncomeTab({ userData, telegramId }) {
  const [profitHistory, setProfitHistory] = useState([]);
  const [profitToday, setProfitToday] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfitData();
  }, [telegramId]);

  const fetchProfitData = async () => {
    try {
      const params = new URLSearchParams({ telegram_id: telegramId.toString() });
      
      const [historyData, todayData] = await Promise.all([
        fetch(`/api/profit-history?${params}`, { headers: { 'X-Telegram-ID': telegramId.toString() } }).then(r => r.json()),
        fetch(`/api/profit-today?${params}`, { headers: { 'X-Telegram-ID': telegramId.toString() } }).then(r => r.json()),
      ]);
      
      setProfitHistory(historyData || []);
      setProfitToday(todayData.profit_today || 0);
    } catch (error) {
      console.error('Failed to fetch profit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (profitHistory.length === 0) {
      return { total: 0, average: 0, highest: 0 };
    }

    const total = profitHistory.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const average = total / profitHistory.length;
    const highest = Math.max(...profitHistory.map(p => parseFloat(p.amount)));

    return { total: total.toFixed(2), average: average.toFixed(2), highest: highest.toFixed(2) };
  };

  const stats = calculateStats();

  // Group profit by level
  const profitByLevel = {};
  profitHistory.forEach(record => {
    const level = record.level;
    if (!profitByLevel[level]) {
      profitByLevel[level] = 0;
    }
    profitByLevel[level] += parseFloat(record.amount);
  });

  if (!userData?.is_city_active) {
    return (
      <div className="income-tab">
        <Card className="not-active-card">
          <div className="not-active-content">
            <div className="not-active-emoji">🏘️</div>
            <p className="not-active-message">Создайте город, чтобы начать зарабатывать</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="income-tab">
      <h1 className="income-title">💸 Мой доход</h1>

      <Card className="income-summary-card">
        <div className="summary-header">
          <h3 className="summary-title">📊 Статистика доходов</h3>
          <button className="refresh-btn" onClick={fetchProfitData}>🔄</button>
        </div>

        <div className="income-stats">
          <div className="income-stat">
            <span className="stat-label">Сегодня</span>
            <span className="stat-value">{profitToday.toFixed(2)}⭐️</span>
          </div>
          <div className="income-stat">
            <span className="stat-label">Всего</span>
            <span className="stat-value">{stats.total}⭐️</span>
          </div>
          <div className="income-stat">
            <span className="stat-label">Среднее</span>
            <span className="stat-value">{stats.average}⭐️</span>
          </div>
          <div className="income-stat">
            <span className="stat-label">Макс</span>
            <span className="stat-value">{stats.highest}⭐️</span>
          </div>
        </div>
      </Card>

      {Object.keys(profitByLevel).length > 0 && (
        <Card className="profit-by-level-card">
          <h3 className="level-title">📈 Доход по уровням</h3>
          <div className="level-breakdown">
            {Object.keys(profitByLevel).map((level) => (
              <div key={level} className="level-row">
                <span className="level-name">Уровень {level}</span>
                <div className="level-bar">
                  <div 
                    className="level-bar-fill" 
                    style={{ width: `${(profitByLevel[level] / parseFloat(stats.total)) * 100}%` }}
                  ></div>
                </div>
                <span className="level-value">{profitByLevel[level].toFixed(2)}⭐️</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {profitHistory.length > 0 ? (
        <Card className="history-card">
          <h3 className="history-title">📜 История выплат (последние 50)</h3>
          <div className="profit-table">
            <div className="table-header">
              <div className="table-cell">Источник</div>
              <div className="table-cell">Уровень</div>
              <div className="table-cell">Сумма</div>
              <div className="table-cell">Время</div>
            </div>
            {profitHistory.slice(0, 50).map((record, idx) => (
              <div key={idx} className="table-row">
                <div className="table-cell">От завода</div>
                <div className="table-cell">Lv.{record.level}</div>
                <div className="table-cell profit">{parseFloat(record.amount).toFixed(2)}⭐️</div>
                <div className="table-cell time">
                  {new Date(record.created_at).toLocaleTimeString('ru-RU')}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="no-history-card">
          <div className="no-history-content">
            <div className="no-history-emoji">📭</div>
            <p className="no-history-message">Запустите завод и приглашайте жителей, чтобы начать получать доход</p>
          </div>
        </Card>
      )}
    </div>
  );
}
