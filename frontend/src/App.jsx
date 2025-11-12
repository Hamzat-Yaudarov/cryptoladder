import React, { useState, useEffect } from 'react';
import { useApi } from './hooks/useApi';
import { useUserData } from './hooks/useUserData';
import CityTab from './tabs/CityTab';
import ResidentsTab from './tabs/ResidentsTab';
import IncomeTab from './tabs/IncomeTab';
import BuildTab from './tabs/BuildTab';
import ProfileTab from './tabs/ProfileTab';
import Loading from './components/Loading';
import './styles/App.css';

const TABS = [
  { id: 'city', label: '🏙 Город', icon: '��️' },
  { id: 'residents', label: '👥 Жители', icon: '👫' },
  { id: 'income', label: '💸 Доход', icon: '📈' },
  { id: 'build', label: '🏗 Строительство', icon: '🔨' },
  { id: 'profile', label: '⚙️ Профиль', icon: '👤' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('city');
  const [telegramId, setTelegramId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userData, refreshUser } = useUserData(telegramId);

  useEffect(() => {
    // Initialize Telegram Web App
    let tgId = null;

    if (window.Telegram?.WebApp) {
      const webapp = window.Telegram.WebApp;
      webapp.ready();
      webapp.expand();

      // Set telegram theme
      if (webapp.colorScheme === 'dark') {
        document.body.classList.add('dark-theme');
      }

      // Parse initData to get user ID
      if (webapp.initData) {
        try {
          const params = new URLSearchParams(webapp.initData);
          const userStr = params.get('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            tgId = user?.id?.toString();
            console.log('✅ Got telegram ID from initData:', tgId);
          }
        } catch (error) {
          console.warn('Failed to parse initData:', error);
        }
      }

      // Fallback: try to get from initDataUnsafe
      if (!tgId && webapp.initDataUnsafe?.user?.id) {
        tgId = webapp.initDataUnsafe.user.id.toString();
        console.log('✅ Got telegram ID from initDataUnsafe:', tgId);
      }
    }

    // Final fallback to storage
    if (!tgId) {
      tgId = sessionStorage.getItem('telegramId') || localStorage.getItem('telegramId');
      console.log('Got telegram ID from storage:', tgId);
    }

    if (tgId) {
      setTelegramId(BigInt(tgId));
      sessionStorage.setItem('telegramId', tgId);
      console.log('Setting telegramId:', tgId);
    } else {
      console.error('❌ Could not get telegram ID from any source');
    }

    setLoading(false);
  }, []);

  const renderTabContent = () => {
    const props = { userData, refreshUser, telegramId };
    
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
