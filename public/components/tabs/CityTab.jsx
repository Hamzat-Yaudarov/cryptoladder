import React, { useState, useEffect } from 'react';
import '../../styles/tabs/city-tab.css';

function CityTab({ user, profile, onRefresh }) {
  const [factoryLoading, setFactoryLoading] = useState(false);
  const [factoryError, setFactoryError] = useState(null);
  const [balanceUpdated, setBalanceUpdated] = useState(false);

  const city = profile.city;
  const isFactoryActive = city.is_factory_active;
  const timeRemaining = isFactoryActive 
    ? calculateTimeRemaining(city.factory_expires_at)
    : null;

  function calculateTimeRemaining(expiresAt) {
    const now = new Date();
    const expireDate = new Date(expiresAt);
    const diff = expireDate - now;

    if (diff < 0) return '0h';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }

  const handleActivateFactory = async () => {
    try {
      setFactoryLoading(true);
      setFactoryError(null);

      const response = await fetch('/api/factory/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city_id: city.id,
          user_id: user.telegram_id,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setFactoryError(data.error || 'Failed to activate factory');
        return;
      }

      setBalanceUpdated(true);
      setTimeout(() => setBalanceUpdated(false), 3000);
      onRefresh();
    } catch (error) {
      console.error('Error activating factory:', error);
      setFactoryError('Connection error. Please try again.');
    } finally {
      setFactoryLoading(false);
    }
  };

  return (
    <div className="city-tab">
      <div className="city-header">
        <h1 className="city-title">{profile.first_name}'s City</h1>
        <p className="city-subtitle">Level {city.level}</p>
      </div>

      {/* Balance Card */}
      <div className="balance-card">
        <div className="balance-content">
          <p className="balance-label">Current Balance</p>
          <p className={`balance-amount ${balanceUpdated ? 'updated' : ''}`}>
            {parseFloat(city.balance).toFixed(2)}⭐️
          </p>
        </div>
        <button className="buy-stars-btn" title="Coming soon">
          + Buy Stars
        </button>
      </div>

      {/* City Stats */}
      <div className="city-stats">
        <div className="stat-card">
          <p className="stat-label">🏠 Houses</p>
          <p className="stat-value">{city.total_houses}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">👥 Residents</p>
          <p className="stat-value">{profile.referral_count}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">🏭 Depth</p>
          <p className="stat-value">{city.level}</p>
        </div>
      </div>

      {/* Factory Section */}
      <div className="factory-section">
        <h2 className="section-title">🏭 Your Factory</h2>

        {isFactoryActive ? (
          <div className="factory-active">
            <div className="factory-status">
              <p className="status-label">✅ Factory Active</p>
              <p className="status-time">Time remaining: {timeRemaining}</p>
            </div>
            <div className="factory-info">
              <p>Your factory is generating income!</p>
              <p className="income-info">
                📈 Income earned from {profile.referral_count} residents
              </p>
            </div>
          </div>
        ) : (
          <div className="factory-inactive">
            <p className="factory-cost">Cost: 10⭐️ per 24 hours</p>
            <p className="factory-description">
              Activate your factory to start earning from your residents!
            </p>
            {factoryError && (
              <p className="error-message">❌ {factoryError}</p>
            )}
            <button
              className="activate-factory-btn"
              onClick={handleActivateFactory}
              disabled={factoryLoading || city.balance < 10}
            >
              {factoryLoading ? 'Activating...' : '🚀 Activate Factory'}
            </button>
            {city.balance < 10 && (
              <p className="warning-message">
                ⚠️ Insufficient balance. Need 10⭐️
              </p>
            )}
          </div>
        )}
      </div>

      {/* Referral Code */}
      <div className="referral-section">
        <h2 className="section-title">🔗 Your Referral Code</h2>
        <div className="referral-code-container">
          <input
            type="text"
            className="referral-code-input"
            value={city.referral_code}
            readOnly
          />
          <button
            className="copy-code-btn"
            onClick={() => {
              navigator.clipboard.writeText(city.referral_code);
              alert('Code copied to clipboard!');
            }}
          >
            📋 Copy
          </button>
        </div>
        <p className="referral-hint">
          Share this code with friends to invite them to your city!
        </p>
      </div>

      {/* City Progress */}
      <div className="city-progress">
        <h2 className="section-title">📊 City Progress</h2>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{
              width: `${(profile.referral_count / (city.level === 5 ? 100 : [15, 35, 70, 100][city.level - 1])) * 100}%`
            }}
          ></div>
        </div>
        <p className="progress-text">
          {profile.referral_count} / {[15, 35, 70, 100][city.level - 1]} residents to next level
        </p>
      </div>
    </div>
  );
}

export default CityTab;
