import React, { useState, useEffect } from 'react';
import '../styles/tabs.css';

const IncomeTab = ({ user }) => {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [byLevel, setByLevel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState(null);

  useEffect(() => {
    fetchIncomeData();
  }, []);

  const fetchIncomeData = async () => {
    try {
      setLoading(true);
      const initData = window.Telegram?.WebApp?.initData || '';

      const response = await fetch('/api/income/history', {
        headers: { Authorization: `Bearer ${initData}` },
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history);
        setStats(data.stats);
        setByLevel(data.byLevel);
      }
    } catch (error) {
      console.error('Error fetching income data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="tab-content">⏳ Загрузка доходов...</div>;
  }

  const filteredHistory = filterLevel
    ? history.filter((item) => item.level === filterLevel)
    : history;

  return (
    <div className="tab-content income-tab">
      <div className="income-header">
        <h2>💸 История доходов</h2>
      </div>

      {stats && (
        <div className="income-stats">
          <div className="stat-card">
            <div className="stat-label">Всего получено</div>
            <div className="stat-value">{(stats.totalProfit || 0).toFixed(2)} ⭐️</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Операций</div>
            <div className="stat-value">{stats.transactionCount || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Средний доход</div>
            <div className="stat-value">{(stats.avgAmount || 0).toFixed(4)} ⭐️</div>
          </div>
        </div>
      )}

      {byLevel && byLevel.length > 0 && (
        <div className="income-by-level">
          <h3>📊 Доход по уровням</h3>
          <div className="level-filters">
            <button
              className={`filter-btn ${!filterLevel ? 'active' : ''}`}
              onClick={() => setFilterLevel(null)}
            >
              Все уровни
            </button>
            {byLevel.map((item) => (
              <button
                key={item.level}
                className={`filter-btn ${filterLevel === item.level ? 'active' : ''}`}
                onClick={() => setFilterLevel(item.level)}
              >
                Уровень {item.level}
              </button>
            ))}
          </div>

          <div className="level-breakdown">
            {byLevel.map((item) => (
              <div key={item.level} className="level-item">
                <div className="level-info">
                  <span className="level-name">Уровень {item.level}</span>
                  <span className="level-count">{item.count} транзакций</span>
                </div>
                <div className="level-amount">{(item.total || 0).toFixed(2)} ⭐️</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="income-history">
        <h3>📜 История</h3>
        {filteredHistory.length === 0 ? (
          <div className="empty-state">
            <p>Пока нет доходов</p>
            <p className="hint">Активируйте завод и пригласите жителей для получения дохода 👆</p>
          </div>
        ) : (
          <div className="history-list">
            {filteredHistory.map((item, idx) => (
              <div key={idx} className="history-item">
                <div className="history-icon">
                  {item.level === 1 && '🏠'}
                  {item.level === 2 && '🏘️'}
                  {item.level === 3 && '🏢'}
                  {item.level === 4 && '🏗️'}
                  {item.level === 5 && '🌆'}
                </div>
                <div className="history-info">
                  <div className="history-title">
                    Доход из уровня {item.level}
                  </div>
                  <div className="history-time">
                    {new Date(item.created_at).toLocaleString('ru-RU')}
                  </div>
                </div>
                <div className="history-amount">
                  +{item.amount.toFixed(4)} ⭐️
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="info-box">
        <h4>💡 О распределении прибыли</h4>
        <ul>
          <li>Доход приходит только от активных заводов ниже вас</li>
          <li>Прибыль распределяется по уровням близости</li>
          <li>Доход поступает ежечасно (1/24 от дневного дохода)</li>
          <li>Чем больше жителей на уровне, тем больше общая прибыль</li>
        </ul>
      </div>
    </div>
  );
};

export default IncomeTab;
