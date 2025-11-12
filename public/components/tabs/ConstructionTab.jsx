import React, { useState } from 'react';
import '../../styles/tabs/construction-tab.css';

function ConstructionTab({ user, profile, onRefresh }) {
  const [selectedUpgrade, setSelectedUpgrade] = useState(null);
  const [upgrading, setUpgrading] = useState(false);

  const city = profile.city;

  // Upgrade plans
  const upgradePlans = [
    {
      level: 2,
      houses: 2,
      depth: 2,
      requirement: '0-14 referrals',
      status: profile.referral_count < 15 ? 'locked' : 'available',
    },
    {
      level: 3,
      houses: 3,
      depth: 3,
      requirement: '15-34 referrals',
      status: profile.referral_count < 15 ? 'locked' : profile.referral_count < 35 ? 'available' : 'completed',
    },
    {
      level: 4,
      houses: 4,
      depth: 4,
      requirement: '35-69 referrals',
      status: profile.referral_count < 35 ? 'locked' : profile.referral_count < 70 ? 'available' : 'completed',
    },
    {
      level: 5,
      houses: 5,
      depth: 5,
      requirement: '70+ referrals',
      status: profile.referral_count < 70 ? 'locked' : 'available',
    },
  ];

  const handleUpgrade = async (plan) => {
    if (plan.status === 'locked') {
      alert('You need more referrals to unlock this upgrade!');
      return;
    }

    if (plan.status === 'completed') {
      alert('You have already completed this upgrade!');
      return;
    }

    setUpgrading(true);
    try {
      // Simulate upgrade process
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('✅ City upgraded! (Simulated)');
      onRefresh();
    } catch (error) {
      alert('❌ Upgrade failed: ' + error.message);
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="construction-tab">
      <div className="construction-header">
        <h1 className="construction-title">🏗️ City Development</h1>
        <p className="construction-subtitle">Expand your city to earn more income</p>
      </div>

      {/* Current City Status */}
      <div className="city-status">
        <h2 className="section-title">Current City Level</h2>
        <div className="status-card">
          <div className="status-info">
            <p className="status-level">Level {city.level}</p>
            <p className="status-houses">Houses: {city.total_houses}</p>
            <p className="status-depth">Depth: {city.level}</p>
          </div>
          <div className="status-progress">
            <p className="progress-label">Referral Progress</p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(
                    (profile.referral_count / [15, 35, 70, 100][city.level - 1]) * 100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
            <p className="progress-text">
              {profile.referral_count} / {[15, 35, 70, 100][city.level - 1]} referrals
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade Plans */}
      <div className="upgrade-plans">
        <h2 className="section-title">📋 Available Upgrades</h2>
        <div className="plans-grid">
          {upgradePlans.map((plan) => (
            <div
              key={plan.level}
              className={`upgrade-card ${plan.status}`}
              onClick={() => plan.status !== 'completed' && setSelectedUpgrade(plan)}
            >
              <div className="card-header">
                <p className="plan-level">Level {plan.level}</p>
                <p className={`plan-status ${plan.status}`}>
                  {plan.status === 'locked' && '🔒'}
                  {plan.status === 'available' && '🔓'}
                  {plan.status === 'completed' && '✅'}
                </p>
              </div>

              <div className="card-specs">
                <p className="spec">🏠 {plan.houses} Houses</p>
                <p className="spec">📏 {plan.depth} Depth Levels</p>
              </div>

              <div className="card-requirement">
                <p className="requirement-label">Required:</p>
                <p className="requirement-text">{plan.requirement}</p>
              </div>

              <button
                className={`upgrade-btn ${plan.status}`}
                disabled={plan.status === 'locked' || plan.status === 'completed' || upgrading}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpgrade(plan);
                }}
              >
                {plan.status === 'locked' && 'Locked'}
                {plan.status === 'available' && (upgrading ? 'Upgrading...' : 'Upgrade')}
                {plan.status === 'completed' && 'Completed'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Referral System Info */}
      <div className="referral-info">
        <h2 className="section-title">📚 Referral System</h2>
        <div className="info-card">
          <p className="info-title">How to Get Referrals:</p>
          <ol className="info-list">
            <li>Share your unique referral code from the City tab</li>
            <li>Friends join your city using your code</li>
            <li>They become residents in your houses</li>
            <li>Earn from their daily factory income</li>
          </ol>
        </div>

        <div className="info-card">
          <p className="info-title">Earnings from Referrals:</p>
          <ul className="earnings-list">
            <li>
              <strong>Level 1:</strong> 3 residents × 4⭐️ each = 12⭐️/day
            </li>
            <li>
              <strong>Level 2:</strong> 9 residents × 2.5⭐️ each = 22.5⭐️/day
            </li>
            <li>
              <strong>Level 3:</strong> 27 residents × 1.7⭐️ each = 45.9⭐️/day
            </li>
            <li>
              <strong>Level 4:</strong> 81 residents × 1⭐️ each = 81⭐️/day
            </li>
            <li>
              <strong>Level 5:</strong> 243 residents × 0.5⭐️ each = 121.5⭐️/day
            </li>
          </ul>
        </div>
      </div>

      {/* Weekly Rankings */}
      <div className="rankings-info">
        <h2 className="section-title">🏆 Weekly Rankings</h2>
        <p className="rankings-description">
          The top 5 referrers each week earn bonus stars!
        </p>
        <div className="rankings-list">
          <div className="ranking-item">
            <p className="ranking-position">🥇 Rank 1</p>
            <p className="ranking-reward">100⭐️</p>
          </div>
          <div className="ranking-item">
            <p className="ranking-position">🥈 Rank 2</p>
            <p className="ranking-reward">75⭐️</p>
          </div>
          <div className="ranking-item">
            <p className="ranking-position">🥉 Rank 3</p>
            <p className="ranking-reward">50⭐️</p>
          </div>
          <div className="ranking-item">
            <p className="ranking-position">4️⃣ Rank 4</p>
            <p className="ranking-reward">25⭐️</p>
          </div>
          <div className="ranking-item">
            <p className="ranking-position">5️⃣ Rank 5</p>
            <p className="ranking-reward">15⭐️</p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="tips-section">
        <h2 className="section-title">💡 Pro Tips</h2>
        <div className="tips-list">
          <p className="tip">
            ✨ Keep your factory active to earn from your residents!
          </p>
          <p className="tip">
            🎯 Focus on growing your network to unlock higher city levels
          </p>
          <p className="tip">
            📱 Share your referral code regularly to gain more residents
          </p>
          <p className="tip">
            🏆 Compete in weekly rankings for extra bonuses
          </p>
        </div>
      </div>
    </div>
  );
}

export default ConstructionTab;
