import React, { useState, useEffect } from 'react';
import { useApi } from './hooks/useApi';
import { useUserData } from './hooks/useUserData';
import CityTab from './tabs/CityTab';
import ResidentsTab from './tabs/ResidentsTab';
import IncomeTab from './tabs/IncomeTab';
import BuildTab from './tabs/BuildTab';
import ProfileTab from './tabs/ProfileTab';
import PyramidPage from './pages/PyramidPage';
import Loading from './components/Loading';
import './styles/App.css';

const TABS = [
  { id: 'city', label: '🏙 Город', icon: '🏘️' },
  { id: 'residents', label: '👥 Жители', icon: '👫' },
  { id: 'income', label: '💸 Доход', icon: '📈' },
  { id: 'build', label: '🏗 Строительство', icon: '🔨' },
  { id: 'profile', label: '⚙️ Профиль', icon: '👤' },
  { id: 'pyramid', label: '🔺 Пирамида', icon: '🔺' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('city');
  const [telegramId, setTelegramId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userData, refreshUser } = useUserData(telegramId);

  useEffect(() => {
    // Initialize Telegram Web App
    if (window.Telegram?.WebApp) {
      const webapp = window.Telegram.WebApp;
      webapp.ready();
      webapp.expand();

      // Set telegram theme
      if (webapp.colorScheme === 'dark') {
        document.body.classList.add('dark-theme');
      }
    }

    // Get telegram user from initDataUnsafe
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

    // Try to get telegram ID from various sources
    const tgId = tgUser?.id?.toString() ||
                 sessionStorage.getItem('telegramId') ||
                 localStorage.getItem('telegramId') ||
                 (!import.meta.env.PROD ? '123456789' : null);

    if (tgId) {
      setTelegramId(BigInt(tgId));
      sessionStorage.setItem('telegramId', tgId);
    }

    // Store basic user info for backend upsert via headers
    if (tgUser) {
      if (tgUser.username) sessionStorage.setItem('telegramUsername', tgUser.username);
      if (tgUser.first_name) sessionStorage.setItem('telegramFirstName', tgUser.first_name);
      if (tgUser.last_name) sessionStorage.setItem('telegramLastName', tgUser.last_name);
    }

    setLoading(false);
  }, []);

  const renderTabContent = () => {
    const props = { userData, refreshUser, telegramId };

    const pathname = window.location.pathname;
    if (pathname === '/pyramid' || activeTab === 'pyramid') {
      return <PyramidPage {...props} />;
    }

    switch (activeTab) {
      case 'city':
        return <CityTab {...props} />;
      case 'residents':
        return <ResidentsTab {...props} />;
      case 'income':
        return <IncomeTab {...props} />;
      case 'build':
        return <BuildTab {...props} />;
      case 'profile':
        return <ProfileTab {...props} />;
      case 'pyramid':
        return <PyramidPage {...props} />;
      default:
        return <CityTab {...props} />;
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="app-container">
      <div className="app-content">
        {renderTabContent()}
      </div>
      
      <div className="tab-navigation">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
