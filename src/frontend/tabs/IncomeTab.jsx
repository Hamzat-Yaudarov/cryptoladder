import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import '../styles/tabs.css';

export function IncomeTab() {
  const { user } = useContext(AppContext);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalIncome: 0,
    todayIncome: 0,
    weekIncome: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    try {
      if (!user) return;
      const response = await fetch(`/api/transactions?user_id=${user.telegram_id}`);

      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setTransactions(data);
      calculateStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setLoading(false);
    }
  };

  const calculateStats = (trans) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    let totalIncome = 0;
    let todayIncome = 0;
    let weekIncome = 0;

    trans.forEach((t) => {
      if (t.type === 'profit_distribution' || t.type === 'weekly_reward' || t.type === 'referral_bonus') {
        const amount = parseFloat(t.amount) || 0;
        totalIncome += amount;

        const tDate = new Date(t.created_at);
        if (tDate >= today) {
          todayIncome += amount;
        }
        if (tDate >= weekAgo) {
          weekIncome += amount;
        }
      }
    });

    setStats({
      totalIncome: totalIncome.toFixed(2),
      todayIncome: todayIncome.toFixed(2),
      weekIncome: weekIncome.toFixed(2),
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'profit_distribution':
        return '📈';
      case 'weekly_reward':
        return '🎖️';
      case 'referral_bonus':
        return '🎁';
      case 'factory_activation':
        return '🏭';
      default:
        return '💰';
    }
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      profit_distribution: 'Прибыль от заводов',
      weekly_reward: 'Еженедельная награда',
      referral_bonus: 'Бонус реферала',
      factory_activation: 'Активация завода',
    };
    return labels[type] || type;
  };

  if (loading || !user) {
    return <div className="tab-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="tab-container income-tab">
      <div className="tab-header">
        <h1>💸 Доход</h1>
      </div>

      <div className="income-stats">
        <div className="stat-card">
          <div className="stat-label">Сегодня</div>
          <div className="stat-amount">{stats.todayIncome} ⭐️</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">За неделю</div>
          <div className="stat-amount">{stats.weekIncome} ⭐️</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Всего заработано</div>
          <div className="stat-amount">{stats.totalIncome} ⭐️</div>
        </div>
      </div>

      <div className="transactions-section">
        <h2>📋 История операций</h2>

        {transactions.length === 0 ? (
          <div className="empty-state">
            <p>📭 Нет операций</p>
            <p>Активируй завод и приглашай друзей, чтобы начать зарабатывать</p>
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.map((trans, index) => (
              <div key={index} className="transaction-item">
                <div className="transaction-left">
                  <span className="transaction-icon">{getTransactionIcon(trans.type)}</span>
                  <div className="transaction-info">
                    <div className="transaction-type">{getTransactionTypeLabel(trans.type)}</div>
                    <div className="transaction-time">
                      {new Date(trans.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className={`transaction-amount ${trans.amount >= 0 ? 'positive' : 'negative'}`}>
                  {trans.amount >= 0 ? '+' : ''}{parseFloat(trans.amount).toFixed(2)} ⭐️
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="income-info">
        <h3>💡 Как это работает:</h3>
        <ul>
          <li>🏭 <strong>Активируй завод</strong> на 24 часа за 10⭐️</li>
          <li>👥 <strong>Приглашай жителей</strong> через реферальную ссылку</li>
          <li>💰 <strong>Получай доход</strong> от их активных заводов</li>
          <li>📊 <strong>Доход выплачивается каждый час</strong> по всем уровням мегаполиса</li>
          <li>🎖️ <strong>Еженедельные награды</strong> за рейтинг рефералов</li>
        </ul>
      </div>
    </div>
  );
}
