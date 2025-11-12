import React, { useState, useEffect } from 'react';
import '../../styles/tabs/profile-tab.css';

function ProfileTab({ user, profile }) {
  const [stats, setStats] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const statsRes = await fetch(`/api/stats/${user.telegram_id}`);
      const statsData = await statsRes.json();
      setStats(statsData.stats);

      const rankingsRes = await fetch('/api/rankings/weekly');
      const rankingsData = await rankingsRes.json();
      setRankings(rankingsData.rankings);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const city = profile.city;

  return (
    <div className="profile-tab">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-large">
            {profile.first_name?.charAt(0).toUpperCase() || '👤'}
          </div>
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{profile.first_name} {profile.last_name || ''}</h1>
          {user.username && <p className="profile-username">@{user.username}</p>}
          <p className="profile-id">ID: {user.telegram_id}</p>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="profile-stats">
          <h2 className="section-title">📊 Your Statistics</h2>
          <div className="stats-grid">
            <div className="stat-box">
              <p className="stat-icon">💰</p>
              <p className="stat-label">Total Earned</p>
              <p className="stat-value">{stats.total_earned.toFixed(2)}⭐️</p>
            </div>
            <div className="stat-box">
              <p className="stat-icon">📈</p>
              <p className="stat-label">Daily Average</p>
              <p className="stat-value">{stats.daily_average.toFixed(2)}⭐️</p>
            </div>
            <div className="stat-box">
              <p className="stat-icon">👥</p>
              <p className="stat-label">Referrals</p>
              <p className="stat-value">{stats.active_referrals}</p>
            </div>
            <div className="stat-box">
              <p className="stat-icon">🏭</p>
              <p className="stat-label">Factory</p>
              <p className="stat-value">
                {stats.factory_active ? '✅ Active' : '❌ Inactive'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* City Information */}
      <div className="city-info">
        <h2 className="section-title">🏙️ Your City</h2>
        <div className="city-details">
          <div className="detail-item">
            <p className="detail-label">City Level</p>
            <p className="detail-value">{city.level}</p>
          </div>
          <div className="detail-item">
            <p className="detail-label">Total Houses</p>
            <p className="detail-value">{city.total_houses}</p>
          </div>
          <div className="detail-item">
            <p className="detail-label">Current Balance</p>
            <p className="detail-value">{parseFloat(city.balance).toFixed(2)}⭐️</p>
          </div>
          <div className="detail-item">
            <p className="detail-label">Referral Code</p>
            <p className="detail-value code">{city.referral_code}</p>
          </div>
        </div>
      </div>

      {/* Weekly Rankings */}
      {!loading && rankings.length > 0 && (
        <div className="rankings-section">
          <h2 className="section-title">🏆 Weekly Rankings</h2>
          <div className="rankings-list">
            {rankings.map((rank, index) => {
              const isCurrentUser = rank.telegram_id === user.telegram_id;
              return (
                <div
                  key={rank.telegram_id}
                  className={`ranking-item ${isCurrentUser ? 'current-user' : ''}`}
                >
                  <div className="rank-position">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `${index + 1}.`}
                  </div>
                  <div className="rank-info">
                    <p className="rank-name">{rank.first_name || 'Anonymous'}</p>
                    <p className="rank-referrals">{rank.referral_count} referrals</p>
                  </div>
                  <p className="rank-reward">
                    {[100, 75, 50, 25, 15][index] || 0}⭐️
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Game Rules & Info */}
      <div className="game-rules">
        <h2 className="section-title">📖 Game Rules</h2>
        <div className="rules-content">
          <div className="rule-section">
            <h3>🏭 Factory System</h3>
            <p>
              Your factory generates income when active. It costs 10⭐️ per 24 hours to keep it running.
              When your factory is active, you earn from residents based on their depth level.
            </p>
          </div>

          <div className="rule-section">
            <h3>👥 Residents & Depth</h3>
            <p>
              Each resident occupies a house at a specific depth level. The more residents you have,
              the higher your city level and the more houses you unlock.
            </p>
          </div>

          <div className="rule-section">
            <h3>💰 Income Structure</h3>
            <p>
              Income is distributed in hourly increments (1/24 of daily). Higher depth levels earn
              less per resident but exponentially more in total as they have more residents.
            </p>
          </div>

          <div className="rule-section">
            <h3>🔗 Referrals</h3>
            <p>
              Share your referral code to invite friends. They'll join your city and you'll earn
              passive income from their factory activities.
            </p>
          </div>

          <div className="rule-section">
            <h3>🏆 Weekly Competitions</h3>
            <p>
              Every week, the top 5 referrers are ranked and awarded bonus stars. Rankings reset
              every Monday.
            </p>
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="version-info">
        <p className="version-text">
          CityLadder v1.0.0 | © 2024
        </p>
        <p className="support-text">
          Need help? Use /help in Telegram or contact support
        </p>
      </div>

      {/* Footer */}
      <div className="profile-footer">
        <button className="footer-btn">
          📱 Share City
        </button>
        <button className="footer-btn">
          ⚙️ Settings
        </button>
        <button className="footer-btn">
          ❓ Help
        </button>
      </div>
    </div>
  );
}

export default ProfileTab;
