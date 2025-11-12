import React, { useState, useEffect } from 'react';
import '../../styles/tabs/residents-tab.css';

function ResidentsTab({ user, profile }) {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      const response = await fetch(`/api/referrals/${user.telegram_id}`);
      const data = await response.json();

      if (data.success) {
        setResidents(data.referrals);
      }
    } catch (error) {
      console.error('Error fetching residents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIncomePerLevel = (level) => {
    const config = {
      1: { profit: 4.0, percentage: 40, total: 12 },
      2: { profit: 2.5, percentage: 25, total: 22.5 },
      3: { profit: 1.7, percentage: 17, total: 45.9 },
      4: { profit: 1.0, percentage: 10, total: 81 },
      5: { profit: 0.5, percentage: 5, total: 121.5 },
    };
    return config[level] || config[1];
  };

  return (
    <div className="residents-tab">
      <div className="residents-header">
        <h1 className="residents-title">👥 Your Residents</h1>
        <p className="residents-count">Total: {profile.referral_count}</p>
      </div>

      {/* Income Breakdown */}
      <div className="income-breakdown">
        <h2 className="section-title">💰 Daily Income Structure</h2>
        <div className="income-levels">
          {[1, 2, 3, 4, 5].map((level) => {
            const config = getIncomePerLevel(level);
            const count = residents.filter(r => r.house_level === level).length;
            
            return (
              <div key={level} className="income-level-card">
                <div className="level-header">
                  <p className="level-number">Level {level}</p>
                  <p className="level-residents">{count} residents</p>
                </div>
                <div className="level-income">
                  <p className="income-per-player">
                    {config.profit.toFixed(1)}⭐️ per player
                  </p>
                  <p className="income-total">
                    = {(config.profit * count).toFixed(1)}⭐️/day
                  </p>
                </div>
                <div className="level-bar">
                  <div className="level-bar-fill"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Residents List */}
      <div className="residents-list-section">
        <h2 className="section-title">📍 Residents Directory</h2>
        
        {loading ? (
          <div className="loading">
            <p>Loading residents...</p>
          </div>
        ) : residents.length === 0 ? (
          <div className="empty-state">
            <p>👤 No residents yet</p>
            <p className="empty-hint">Invite friends to expand your city!</p>
          </div>
        ) : (
          <div className="residents-list">
            {residents.map((resident, index) => (
              <div key={resident.id} className="resident-card">
                <div className="resident-avatar">
                  <div className="avatar-placeholder">
                    {resident.first_name?.charAt(0).toUpperCase() || '👤'}
                  </div>
                </div>
                <div className="resident-info">
                  <p className="resident-name">
                    {resident.first_name || 'Unknown'}
                    {resident.username && ` (@${resident.username})`}
                  </p>
                  <p className="resident-level">Level {resident.house_level}</p>
                  <p className="resident-balance">
                    {resident.balance?.toFixed(2) || '0.00'}⭐️
                  </p>
                </div>
                <div className="resident-status">
                  {resident.is_factory_active ? (
                    <p className="status-active">✅ Active</p>
                  ) : (
                    <p className="status-inactive">⏳ Waiting</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* City Hierarchy Info */}
      <div className="hierarchy-info">
        <h2 className="section-title">🏘️ City Hierarchy</h2>
        <p className="hierarchy-description">
          Your city is structured in levels. Each level has a maximum number of residents:
        </p>
        <div className="hierarchy-levels">
          <div className="hierarchy-level">
            <p className="level-cap">Level 1: Up to 3 residents</p>
          </div>
          <div className="hierarchy-level">
            <p className="level-cap">Level 2: Up to 9 residents</p>
          </div>
          <div className="hierarchy-level">
            <p className="level-cap">Level 3: Up to 27 residents</p>
          </div>
          <div className="hierarchy-level">
            <p className="level-cap">Level 4: Up to 81 residents</p>
          </div>
          <div className="hierarchy-level">
            <p className="level-cap">Level 5: Up to 243 residents</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResidentsTab;
