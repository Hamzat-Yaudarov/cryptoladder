// CityLadder MiniApp - Main Application
(function() {
  'use strict';

  // Initialize Telegram Web App
  if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
    window.Telegram.WebApp.setHeaderColor('#1a1a2e');
    window.Telegram.WebApp.setBackgroundColor('#0f0f1e');
  }

  // Global state
  const app = {
    user: null,
    profile: null,
    currentTab: 'city',
    loading: true,
    error: null,
  };

  // API Helpers
  const api = {
    async call(endpoint, options = {}) {
      try {
        const response = await fetch(endpoint, {
          headers: { 'Content-Type': 'application/json' },
          ...options,
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`API call failed: ${endpoint}`, error);
        throw error;
      }
    },

    async authUser(telegramUser) {
      return this.call('/api/auth/user', {
        method: 'POST',
        body: JSON.stringify({ telegram_user: telegramUser }),
      });
    },

    async getCityData(userId) {
      return this.call(`/api/city/${userId}`);
    },

    async activateFactory(cityId, userId) {
      return this.call('/api/factory/activate', {
        method: 'POST',
        body: JSON.stringify({ city_id: cityId, user_id: userId }),
      });
    },

    async getProfitSummary(userId) {
      return this.call(`/api/profit/summary/${userId}`);
    },

    async getReferrals(userId) {
      return this.call(`/api/referrals/${userId}`);
    },

    async getWeeklyRankings() {
      return this.call('/api/rankings/weekly');
    },

    async getTransactions(userId, limit = 50) {
      return this.call(`/api/transactions/${userId}?limit=${limit}`);
    },

    async getStats(userId) {
      return this.call(`/api/stats/${userId}`);
    },
  };

  // UI Renderer
  const ui = {
    renderLoading() {
      const root = document.getElementById('root');
      root.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading CityLadder...</p>
        </div>
      `;
    },

    renderError(error) {
      const root = document.getElementById('root');
      root.innerHTML = `
        <div class="error-message">
          <p>❌ ${error}</p>
          <button onclick="location.reload()">Retry</button>
        </div>
      `;
    },

    renderApp() {
      const root = document.getElementById('root');
      root.innerHTML = `
        <div class="app-container">
          <div class="app-content" id="app-content"></div>
          <div class="app-tabs" id="app-tabs">
            <button class="tab-button active" data-tab="city" title="City">🏙</button>
            <button class="tab-button" data-tab="residents" title="Residents">👥</button>
            <button class="tab-button" data-tab="income" title="Income">💰</button>
            <button class="tab-button" data-tab="construction" title="Construction">🏗</button>
            <button class="tab-button" data-tab="profile" title="Profile">⚙️</button>
          </div>
        </div>
      `;

      // Attach tab event listeners
      document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
          const tab = e.target.dataset.tab;
          ui.switchTab(tab);
        });
      });

      // Render initial tab
      ui.switchTab('city');
    },

    switchTab(tabName) {
      // Update active tab button
      document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
      });

      app.currentTab = tabName;

      // Render tab content
      switch (tabName) {
        case 'city':
          ui.renderCityTab();
          break;
        case 'residents':
          ui.renderResidentsTab();
          break;
        case 'income':
          ui.renderIncomeTab();
          break;
        case 'construction':
          ui.renderConstructionTab();
          break;
        case 'profile':
          ui.renderProfileTab();
          break;
      }
    },

    renderCityTab() {
      const city = app.profile.city;
      const isActive = city.is_factory_active;
      const timeRemaining = isActive 
        ? this.calculateTimeRemaining(city.factory_expires_at)
        : null;

      const content = document.getElementById('app-content');
      content.innerHTML = `
        <div class="city-tab">
          <div class="city-header">
            <h1 class="city-title">${app.profile.first_name}'s City</h1>
            <p class="city-subtitle">Level ${city.level}</p>
          </div>

          <div class="balance-card">
            <div class="balance-content">
              <p class="balance-label">Current Balance</p>
              <p class="balance-amount">${parseFloat(city.balance).toFixed(2)}⭐️</p>
            </div>
            <button class="buy-stars-btn" disabled title="Coming soon">+ Buy Stars</button>
          </div>

          <div class="city-stats">
            <div class="stat-card">
              <p class="stat-label">🏠 Houses</p>
              <p class="stat-value">${city.total_houses}</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">👥 Residents</p>
              <p class="stat-value">${app.profile.referral_count}</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">🏭 Depth</p>
              <p class="stat-value">${city.level}</p>
            </div>
          </div>

          <div class="factory-section">
            <h2 class="section-title">🏭 Your Factory</h2>
            ${isActive ? `
              <div class="factory-active">
                <div class="factory-status">
                  <p class="status-label">✅ Factory Active</p>
                  <p class="status-time">Time remaining: ${timeRemaining}</p>
                </div>
                <div class="factory-info">
                  <p>Your factory is generating income!</p>
                  <p class="income-info">📈 Income earned from ${app.profile.referral_count} residents</p>
                </div>
              </div>
            ` : `
              <div class="factory-inactive">
                <p class="factory-cost">Cost: 10⭐️ per 24 hours</p>
                <p class="factory-description">Activate your factory to start earning from your residents!</p>
                <button class="activate-factory-btn" id="activate-btn" 
                  ${city.balance < 10 ? 'disabled' : ''}>
                  🚀 Activate Factory
                </button>
                ${city.balance < 10 ? '<p class="warning-message">⚠️ Insufficient balance. Need 10⭐️</p>' : ''}
              </div>
            `}
          </div>

          <div class="referral-section">
            <h2 class="section-title">🔗 Your Referral Code</h2>
            <div class="referral-code-container">
              <input type="text" class="referral-code-input" value="${city.referral_code}" readonly>
              <button class="copy-code-btn" id="copy-code-btn">📋 Copy</button>
            </div>
            <p class="referral-hint">Share this code with friends to invite them to your city!</p>
          </div>

          <div class="city-progress">
            <h2 class="section-title">📊 City Progress</h2>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min((app.profile.referral_count / 15) * 100, 100)}%"></div>
            </div>
            <p class="progress-text">${app.profile.referral_count} / 15 residents to next level</p>
          </div>
        </div>
      `;

      // Attach event listeners
      const activateBtn = document.getElementById('activate-btn');
      if (activateBtn) {
        activateBtn.addEventListener('click', () => ui.activateFactory());
      }

      const copyBtn = document.getElementById('copy-code-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(city.referral_code);
          alert('✅ Code copied to clipboard!');
        });
      }
    },

    renderResidentsTab() {
      const content = document.getElementById('app-content');
      content.innerHTML = `
        <div class="residents-tab">
          <div class="residents-header">
            <h1 class="residents-title">👥 Your Residents</h1>
            <p class="residents-count">Total: ${app.profile.referral_count}</p>
          </div>

          <div class="income-breakdown">
            <h2 class="section-title">💰 Daily Income Structure</h2>
            <div class="income-levels">
              <div class="income-level-card">
                <div class="level-header">
                  <p class="level-number">Level 1</p>
                  <p class="level-residents">Capacity: 3</p>
                </div>
                <div class="level-income">
                  <p class="income-per-player">4⭐️ per player</p>
                  <p class="income-total">= 12⭐️/day</p>
                </div>
              </div>
              <div class="income-level-card">
                <div class="level-header">
                  <p class="level-number">Level 2</p>
                  <p class="level-residents">Capacity: 9</p>
                </div>
                <div class="level-income">
                  <p class="income-per-player">2.5⭐️ per player</p>
                  <p class="income-total">= 22.5⭐️/day</p>
                </div>
              </div>
              <div class="income-level-card">
                <div class="level-header">
                  <p class="level-number">Level 3</p>
                  <p class="level-residents">Capacity: 27</p>
                </div>
                <div class="level-income">
                  <p class="income-per-player">1.7⭐️ per player</p>
                  <p class="income-total">= 45.9⭐️/day</p>
                </div>
              </div>
              <div class="income-level-card">
                <div class="level-header">
                  <p class="level-number">Level 4</p>
                  <p class="level-residents">Capacity: 81</p>
                </div>
                <div class="level-income">
                  <p class="income-per-player">1⭐️ per player</p>
                  <p class="income-total">= 81⭐️/day</p>
                </div>
              </div>
              <div class="income-level-card">
                <div class="level-header">
                  <p class="level-number">Level 5</p>
                  <p class="level-residents">Capacity: 243</p>
                </div>
                <div class="level-income">
                  <p class="income-per-player">0.5⭐️ per player</p>
                  <p class="income-total">= 121.5⭐️/day</p>
                </div>
              </div>
            </div>
          </div>

          <div class="residents-list-section">
            <h2 class="section-title">📍 Residents Directory</h2>
            <div class="empty-state">
              <p>👤 No residents yet</p>
              <p class="empty-hint">Invite friends to expand your city!</p>
            </div>
          </div>
        </div>
      `;
    },

    renderIncomeTab() {
      const content = document.getElementById('app-content');
      content.innerHTML = `
        <div class="income-tab">
          <div class="income-header">
            <h1 class="income-title">💸 Income Dashboard</h1>
          </div>

          <div class="income-stats">
            <div class="stat-card hourly">
              <p class="stat-period">Last Hour</p>
              <p class="stat-value">0⭐️</p>
            </div>
            <div class="stat-card daily">
              <p class="stat-period">Last 24 Hours</p>
              <p class="stat-value">0⭐️</p>
            </div>
            <div class="stat-card weekly">
              <p class="stat-period">Last 7 Days</p>
              <p class="stat-value">0⭐️</p>
            </div>
          </div>

          <div class="overall-stats">
            <h2 class="section-title">📊 Overall Statistics</h2>
            <div class="stats-grid">
              <div class="stat-item">
                <p class="stat-label">Total Earned</p>
                <p class="stat-number">0⭐️</p>
              </div>
              <div class="stat-item">
                <p class="stat-label">Daily Average</p>
                <p class="stat-number">0⭐️</p>
              </div>
              <div class="stat-item">
                <p class="stat-label">Active Referrals</p>
                <p class="stat-number">${app.profile.referral_count}</p>
              </div>
              <div class="stat-item">
                <p class="stat-label">Factory Status</p>
                <p class="stat-number">${app.profile.city.is_factory_active ? '✅ Active' : '❌ Inactive'}</p>
              </div>
            </div>
          </div>

          <div class="profit-info">
            <h2 class="section-title">ℹ️ How Profits Work</h2>
            <div class="info-content">
              <p>Your income comes from:</p>
              <ul class="info-list">
                <li><strong>Factory Income</strong> - Earned from your active factory and residents</li>
                <li><strong>Referral Bonuses</strong> - 0.5⭐️ when referred users activate their factory</li>
                <li><strong>Weekly Ranking Rewards</strong> - Top 5 referrers earn prizes</li>
              </ul>
              <p class="profit-note">💡 Keep your factory active to maximize your income!</p>
            </div>
          </div>
        </div>
      `;
    },

    renderConstructionTab() {
      const city = app.profile.city;
      const content = document.getElementById('app-content');
      
      content.innerHTML = `
        <div class="construction-tab">
          <div class="construction-header">
            <h1 class="construction-title">🏗️ City Development</h1>
            <p class="construction-subtitle">Expand your city to earn more income</p>
          </div>

          <div class="city-status">
            <h2 class="section-title">Current City Level</h2>
            <div class="status-card">
              <div class="status-info">
                <p class="status-level">Level ${city.level}</p>
                <p class="status-houses">Houses: ${city.total_houses}</p>
                <p class="status-depth">Depth: ${city.level}</p>
              </div>
            </div>
          </div>

          <div class="referral-info">
            <h2 class="section-title">📚 Referral System</h2>
            <div class="info-card">
              <p class="info-title">How to Get Referrals:</p>
              <ol class="info-list">
                <li>Share your unique referral code from the City tab</li>
                <li>Friends join your city using your code</li>
                <li>They become residents in your houses</li>
                <li>Earn from their daily factory income</li>
              </ol>
            </div>
          </div>

          <div class="rankings-info">
            <h2 class="section-title">🏆 Weekly Rankings</h2>
            <p class="rankings-description">The top 5 referrers each week earn bonus stars!</p>
            <div class="rankings-list">
              <div class="ranking-item">
                <p class="ranking-position">🥇 Rank 1</p>
                <p class="ranking-reward">100⭐️</p>
              </div>
              <div class="ranking-item">
                <p class="ranking-position">🥈 Rank 2</p>
                <p class="ranking-reward">75⭐️</p>
              </div>
              <div class="ranking-item">
                <p class="ranking-position">🥉 Rank 3</p>
                <p class="ranking-reward">50⭐️</p>
              </div>
              <div class="ranking-item">
                <p class="ranking-position">4️⃣ Rank 4</p>
                <p class="ranking-reward">25⭐️</p>
              </div>
              <div class="ranking-item">
                <p class="ranking-position">5️⃣ Rank 5</p>
                <p class="ranking-reward">15⭐️</p>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    renderProfileTab() {
      const content = document.getElementById('app-content');
      content.innerHTML = `
        <div class="profile-tab">
          <div class="profile-header">
            <div class="profile-avatar">
              <div class="avatar-large">${app.profile.first_name?.charAt(0).toUpperCase() || '👤'}</div>
            </div>
            <div class="profile-info">
              <h1 class="profile-name">${app.profile.first_name} ${app.profile.last_name || ''}</h1>
              ${app.user.username ? `<p class="profile-username">@${app.user.username}</p>` : ''}
              <p class="profile-id">ID: ${app.user.telegram_id}</p>
            </div>
          </div>

          <div class="profile-stats">
            <h2 class="section-title">📊 Your Statistics</h2>
            <div class="stats-grid">
              <div class="stat-box">
                <p class="stat-icon">💰</p>
                <p class="stat-label">Total Earned</p>
                <p class="stat-value">0⭐️</p>
              </div>
              <div class="stat-box">
                <p class="stat-icon">📈</p>
                <p class="stat-label">Daily Average</p>
                <p class="stat-value">0⭐️</p>
              </div>
              <div class="stat-box">
                <p class="stat-icon">👥</p>
                <p class="stat-label">Referrals</p>
                <p class="stat-value">${app.profile.referral_count}</p>
              </div>
              <div class="stat-box">
                <p class="stat-icon">🏭</p>
                <p class="stat-label">Factory</p>
                <p class="stat-value">${app.profile.city.is_factory_active ? '✅ Active' : '❌ Inactive'}</p>
              </div>
            </div>
          </div>

          <div class="game-rules">
            <h2 class="section-title">📖 Game Rules</h2>
            <div class="rules-content">
              <div class="rule-section">
                <h3>🏭 Factory System</h3>
                <p>Your factory generates income when active. It costs 10⭐️ per 24 hours to keep it running.</p>
              </div>
              <div class="rule-section">
                <h3>👥 Residents & Depth</h3>
                <p>Each resident occupies a house at a specific depth level. More residents unlock higher city levels.</p>
              </div>
              <div class="rule-section">
                <h3>💰 Income Structure</h3>
                <p>Income is distributed hourly (1/24 of daily). Higher depth levels earn more in total.</p>
              </div>
              <div class="rule-section">
                <h3>🔗 Referrals</h3>
                <p>Share your referral code to invite friends. Earn passive income from their activities.</p>
              </div>
            </div>
          </div>

          <div class="version-info">
            <p class="version-text">CityLadder v1.0.0 | © 2024</p>
          </div>
        </div>
      `;
    },

    calculateTimeRemaining(expiresAt) {
      const now = new Date();
      const expireDate = new Date(expiresAt);
      const diff = expireDate - now;

      if (diff < 0) return '0h';

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      return `${hours}h ${minutes}m`;
    },

    async activateFactory() {
      const btn = document.getElementById('activate-btn');
      if (!btn) return;

      btn.disabled = true;
      btn.textContent = 'Activating...';

      try {
        const result = await api.activateFactory(app.profile.city.id, app.user.telegram_id);

        if (!result.success) {
          alert('❌ ' + (result.error || 'Failed to activate factory'));
          return;
        }

        alert('✅ Factory activated successfully!');
        
        // Refresh profile data
        await this.loadUserData();
        this.switchTab('city');
      } catch (error) {
        console.error('Error:', error);
        alert('❌ Error: ' + error.message);
      } finally {
        btn.disabled = false;
        btn.textContent = '🚀 Activate Factory';
      }
    },
  };

  // Initialize
  async function init() {
    try {
      ui.renderLoading();

      // Get Telegram user data (initDataUnsafe is the correct way)
      let telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

      // Fallback: try to parse initData if it's a string
      if (!telegramUser && window.Telegram?.WebApp?.initData) {
        try {
          const initDataStr = window.Telegram.WebApp.initData;
          const params = new URLSearchParams(initDataStr);
          const userJson = params.get('user');
          if (userJson) {
            telegramUser = JSON.parse(userJson);
          }
        } catch (e) {
          console.error('Failed to parse initData:', e);
        }
      }

      if (!telegramUser || !telegramUser.id) {
        throw new Error('Unable to get Telegram user data. Make sure you open this as a Telegram MiniApp.');
      }

      // Authenticate and fetch user data
      const authResult = await api.authUser(telegramUser);
      
      if (!authResult.success) {
        throw new Error('Authentication failed');
      }

      app.user = authResult.user;
      app.profile = authResult.profile;

      // Render the app
      ui.renderApp();
    } catch (error) {
      console.error('Init error:', error);
      ui.renderError(error.message);
    }
  }

  // Add helper to loadUserData
  ui.loadUserData = async function() {
    try {
      const cityData = await api.getCityData(app.user.telegram_id);
      app.profile.city = cityData.city;
      app.profile.referral_count = cityData.city.referral_count;
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Start the app
  window.addEventListener('DOMContentLoaded', init);
})();
