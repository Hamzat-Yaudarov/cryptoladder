import React, { useState, useEffect } from 'react';
import '../../styles/tabs/income-tab.css';

function IncomeTab({ user, profile }) {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncomeData();
    const interval = setInterval(fetchIncomeData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchIncomeData = async () => {
    try {
      // Fetch profit summary
      const summaryRes = await fetch(`/api/profit/summary/${user.telegram_id}`);
      const summaryData = await summaryRes.json();
      setSummary(summaryData.summary);

      // Fetch transaction history
      const transRes = await fetch(`/api/transactions/${user.telegram_id}?limit=20`);
      const transData = await transRes.json();
      setTransactions(transData.transactions);

      // Fetch stats
      const statsRes = await fetch(`/api/stats/${user.telegram_id}`);
      const statsData = await statsRes.json();
      setStats(statsData.stats);
    } catch (error) {
      console.error('Error fetching income data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="income-tab">
        <div className="loading">
          <p>Loading income data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="income-tab">
      <div className="income-header">
        <h1 className="income-title">💸 Income Dashboard</h1>
      </div>

      {/* Income Stats */}
      {summary && (
        <div className="income-stats">
          <div className="stat-card hourly">
            <p className="stat-period">Last Hour</p>
            <p className="stat-value">{summary.hourly.toFixed(2)}⭐️</p>
          </div>
          <div className="stat-card daily">
            <p className="stat-period">Last 24 Hours</p>
            <p className="stat-value">{summary.daily.toFixed(2)}⭐️</p>
          </div>
          <div className="stat-card weekly">
            <p className="stat-period">Last 7 Days</p>
            <p className="stat-value">{summary.weekly.toFixed(2)}⭐️</p>
          </div>
        </div>
      )}

      {/* Overall Stats */}
      {stats && (
        <div className="overall-stats">
          <h2 className="section-title">📊 Overall Statistics</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <p className="stat-label">Total Earned</p>
              <p className="stat-number">{stats.total_earned.toFixed(2)}⭐️</p>
            </div>
            <div className="stat-item">
              <p className="stat-label">Daily Average</p>
              <p className="stat-number">{stats.daily_average.toFixed(2)}⭐️</p>
            </div>
            <div className="stat-item">
              <p className="stat-label">Active Referrals</p>
              <p className="stat-number">{stats.active_referrals}</p>
            </div>
            <div className="stat-item">
              <p className="stat-label">Factory Status</p>
              <p className="stat-number">
                {stats.factory_active ? '✅ Active' : '❌ Inactive'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Income Chart Placeholder */}
      <div className="income-chart">
        <h2 className="section-title">📈 Income Trend</h2>
        <div className="chart-placeholder">
          <p>Chart visualization coming soon</p>
          <p className="chart-hint">Check back later for detailed income graphs</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="transaction-history">
        <h2 className="section-title">📜 Transaction History</h2>
        
        {transactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="transaction-list">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="transaction-item">
                <div className="transaction-info">
                  <p className="transaction-type">
                    {getTransactionIcon(transaction.type)} {formatTransactionType(transaction.type)}
                  </p>
                  <p className="transaction-description">{transaction.description}</p>
                  <p className="transaction-date">
                    {formatDate(transaction.created_at)}
                  </p>
                </div>
                <p className={`transaction-amount ${transaction.type === 'addition' ? 'positive' : 'negative'}`}>
                  {transaction.type === 'addition' ? '+' : '-'}{transaction.amount.toFixed(2)}⭐️
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profit System Info */}
      <div className="profit-info">
        <h2 className="section-title">ℹ️ How Profits Work</h2>
        <div className="info-content">
          <p>Your income comes from:</p>
          <ul className="info-list">
            <li>
              <strong>Factory Income</strong> - Earned from your active factory and residents
            </li>
            <li>
              <strong>Referral Bonuses</strong> - 0.5⭐️ when referred users activate their factory
            </li>
            <li>
              <strong>Weekly Ranking Rewards</strong> - Top 5 referrers earn prizes
            </li>
          </ul>
          <p className="profit-note">
            💡 Keep your factory active to maximize your income!
          </p>
        </div>
      </div>
    </div>
  );
}

function getTransactionIcon(type) {
  const icons = {
    'factory_activation': '🏭',
    'referral_bonus': '🎁',
    'weekly_ranking_reward': '🏆',
    'addition': '➕',
  };
  return icons[type] || '💰';
}

function formatTransactionType(type) {
  const names = {
    'factory_activation': 'Factory Activation',
    'referral_bonus': 'Referral Bonus',
    'weekly_ranking_reward': 'Ranking Reward',
    'addition': 'Balance Addition',
  };
  return names[type] || type;
}

function formatDate(date) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default IncomeTab;
