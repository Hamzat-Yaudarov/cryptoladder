import React, { useState, useEffect } from 'react';
import CityTab from './tabs/CityTab';
import ResidentsTab from './tabs/ResidentsTab';
import IncomeTab from './tabs/IncomeTab';
import BuildingTab from './tabs/BuildingTab';
import ProfileTab from './tabs/ProfileTab';
import './styles/app.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('city');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }

    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const initData = window.Telegram?.WebApp?.initData || '';
      const response = await fetch('/api/user/me', {
        headers: {
          Authorization: `Bearer ${initData}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch user');
      const userData = await response.json();
      setUser(userData);
      setError(null);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="app-loading">⏳ Загрузка...</div>;
  }

  if (error) {
    return <div className="app-error">❌ Ошибка: {error}</div>;
  }

  return (
    <div className="app-container">
      <div className="app-content">
        {activeTab === 'city' && <CityTab user={user} onRefresh={fetchUser} />}
        {activeTab === 'residents' && <ResidentsTab user={user} />}
        {activeTab === 'income' && <IncomeTab user={user} />}
        {activeTab === 'building' && <BuildingTab user={user} onRefresh={fetchUser} />}
        {activeTab === 'profile' && <ProfileTab user={user} />}
      </div>

      <div className="app-navigation">
        <NavButton
          tab="city"
          icon="🏙"
          label="Город"
          active={activeTab === 'city'}
          onClick={() => setActiveTab('city')}
        />
        <NavButton
          tab="residents"
          icon="👥"
          label="Жители"
          active={activeTab === 'residents'}
          onClick={() => setActiveTab('residents')}
        />
        <NavButton
          tab="income"
          icon="💸"
          label="Доход"
          active={activeTab === 'income'}
          onClick={() => setActiveTab('income')}
        />
        <NavButton
          tab="building"
          icon="🏗"
          label="Строк."
          active={activeTab === 'building'}
          onClick={() => setActiveTab('building')}
        />
        <NavButton
          tab="profile"
          icon="⚙"
          label="Профиль"
          active={activeTab === 'profile'}
          onClick={() => setActiveTab('profile')}
        />
      </div>
    </div>
  );
};

const NavButton = ({ tab, icon, label, active, onClick }) => (
  <button
    className={`nav-button ${active ? 'active' : ''}`}
    onClick={onClick}
    title={label}
  >
    <span className="nav-icon">{icon}</span>
    <span className="nav-label">{label}</span>
  </button>
);

export default App;
