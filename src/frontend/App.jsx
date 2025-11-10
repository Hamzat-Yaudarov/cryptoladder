import React, { useState, useEffect, createContext, useContext } from 'react';
import { CityTab } from './tabs/CityTab';
import { CitizensTab } from './tabs/CitizensTab';
import { IncomeTab } from './tabs/IncomeTab';
import { ConstructionTab } from './tabs/ConstructionTab';
import { ProfileTab } from './tabs/ProfileTab';
import { AppContext } from './context/AppContext';
import './styles/App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('city');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initTelegram = async () => {
      try {
        // Get user ID from Telegram or URL params
        let userId = null;

        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          tg.ready();

          // Correct way to get user data from Telegram MiniApp
          if (tg.initDataUnsafe?.user?.id) {
            userId = tg.initDataUnsafe.user.id;
          }
        }

        // Fallback to URL parameter
        if (!userId) {
          userId = new URLSearchParams(window.location.search).get('user_id');
        }

        // If we still don't have a user ID, show error
        if (!userId) {
          setError('Не удалось определить пользователя. Пожалуйста, откройте приложение через Telegram.');
          setLoading(false);
          return;
        }

        // Fetch user profile
        const response = await fetch(`/api/user/profile?user_id=${userId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || 'Ошибка при загрузке профиля');
          setLoading(false);
          return;
        }

        const userData = await response.json();
        setUser(userData);
        setLoading(false);
      } catch (err) {
        console.error('Error initializing app:', err);
        setError(`Ошибка инициализации: ${err.message}`);
        setLoading(false);
      }
    };

    initTelegram();
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Загрузка CityLadder...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>❌ Ошибка</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Попробовать снова</button>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ user, setUser }}>
      <div className="app-container">
        <div className="content">
          {activeTab === 'city' && <CityTab />}
          {activeTab === 'citizens' && <CitizensTab />}
          {activeTab === 'income' && <IncomeTab />}
          {activeTab === 'construction' && <ConstructionTab />}
          {activeTab === 'profile' && <ProfileTab />}
        </div>

        <nav className="bottom-nav">
          <button
            className={`nav-item ${activeTab === 'city' ? 'active' : ''}`}
            onClick={() => setActiveTab('city')}
            title="Город"
          >
            <span className="nav-icon">🏙</span>
            <span className="nav-label">Город</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'citizens' ? 'active' : ''}`}
            onClick={() => setActiveTab('citizens')}
            title="Жители"
          >
            <span className="nav-icon">👥</span>
            <span className="nav-label">Жители</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'income' ? 'active' : ''}`}
            onClick={() => setActiveTab('income')}
            title="Доход"
          >
            <span className="nav-icon">💸</span>
            <span className="nav-label">Доход</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'construction' ? 'active' : ''}`}
            onClick={() => setActiveTab('construction')}
            title="Строительство"
          >
            <span className="nav-icon">🏗</span>
            <span className="nav-label">Строить</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            title="Профиль"
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Профиль</span>
          </button>
        </nav>
      </div>
    </AppContext.Provider>
  );
}
