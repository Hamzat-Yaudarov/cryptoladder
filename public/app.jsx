import React, { useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import CityTab from './components/tabs/CityTab';
import ResidentsTab from './components/tabs/ResidentsTab';
import IncomeTab from './components/tabs/IncomeTab';
import ConstructionTab from './components/tabs/ConstructionTab';
import ProfileTab from './components/tabs/ProfileTab';
import './styles/app.css';

function App() {
  const [activeTab, setActiveTab] = useState('city');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize Telegram WebApp
  useEffect(() => {
    if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.setHeaderColor('#1a1a2e');
      window.Telegram.WebApp.setBackgroundColor('#0f0f1e');
    }
  }, []);

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get Telegram user data
      const telegramUser = window.Telegram?.WebApp?.initData?.user;
      
      if (!telegramUser) {
        throw new Error('Unable to get Telegram user data');
      }

      // Auth with backend
      const response = await fetch('/api/auth/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_user: telegramUser }),
      });

      if (!response.ok) throw new Error('Auth failed');

      const data = await response.json();
      setUser(data.user);
      setProfile(data.profile);
      setError(null);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const renderTab = () => {
    if (!user || !profile) return null;

    switch (activeTab) {
      case 'city':
        return <CityTab user={user} profile={profile} onRefresh={fetchUserData} />;
      case 'residents':
        return <ResidentsTab user={user} profile={profile} />;
      case 'income':
        return <IncomeTab user={user} profile={profile} />;
      case 'construction':
        return <ConstructionTab user={user} profile={profile} onRefresh={fetchUserData} />;
      case 'profile':
        return <ProfileTab user={user} profile={profile} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading CityLadder...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={fetchUserData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-content">
        {renderTab()}
      </div>

      <div className="app-tabs">
        <button
          className={`tab-button ${activeTab === 'city' ? 'active' : ''}`}
          onClick={() => setActiveTab('city')}
          title="City"
        >
          🏙
        </button>
        <button
          className={`tab-button ${activeTab === 'residents' ? 'active' : ''}`}
          onClick={() => setActiveTab('residents')}
          title="Residents"
        >
          👥
        </button>
        <button
          className={`tab-button ${activeTab === 'income' ? 'active' : ''}`}
          onClick={() => setActiveTab('income')}
          title="Income"
        >
          💰
        </button>
        <button
          className={`tab-button ${activeTab === 'construction' ? 'active' : ''}`}
          onClick={() => setActiveTab('construction')}
          title="Construction"
        >
          🏗
        </button>
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
          title="Profile"
        >
          ⚙️
        </button>
      </div>
    </div>
  );
}

// Mount React app
const root = createRoot(document.getElementById('root'));
root.render(<App />);

export default App;
