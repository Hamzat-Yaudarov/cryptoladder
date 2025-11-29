import React, { useState, useEffect } from 'react';
import TelegramService from './services/TelegramService';
import MainScreen from './screens/MainScreen';
import DimensionExplorer from './screens/DimensionExplorer';
import SoulDeck from './screens/SoulDeck';
import AbilitiesScreen from './screens/AbilitiesScreen';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('main');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const initApp = async () => {
      TelegramService.init();

      const id = TelegramService.getUserId();

      if (!id) {
        console.warn('Telegram ID не найден. Используется тестовый ID.');
        const testId = Math.random().toString(36).substring(7);
        setUserId(testId);
        try {
          const response = await fetch(`/api/user/${testId}`, { method: 'POST' });
          if (response.ok) {
            const data = await response.json();
            setUserData(data);
          }
        } catch (error) {
          console.error('Ошибка загрузки данных:', error);
          setUserData({
            userId: testId,
            dimensionLevel: 1,
            soulEnergy: 100,
            crystals: 0,
            soulCards: [],
            abilities: [],
            dimensions: { unlocked: [1], current: 1 },
            lastDailyClaimTime: 0,
            createdAt: Date.now()
          });
        }
      } else {
        setUserId(id);
        try {
          const response = await fetch(`/api/user/${id}`, { method: 'POST' });
          if (response.ok) {
            const data = await response.json();
            setUserData(data);
          } else {
            console.error('API вернул ошибку:', response.status);
          }
        } catch (error) {
          console.error('Ошибка загрузки данных:', error);
        }
      }

      setLoading(false);
    };

    initApp();
  }, []);

  const updateUserData = async () => {
    if (userId) {
      try {
        const response = await fetch(`/api/user/${userId}`, { method: 'POST' });
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error('Failed to update user data:', error);
      }
    }
  };

  if (loading || !userData) {
    return (
      <div className="app-container">
        <div className="loading-screen">
          <div className="loader"></div>
          <p className="glow-text">Загрузка Измерения Ани...</p>
        </div>
      </div>
    );
  }

  const screens = {
    main: <MainScreen userData={userData} onNavigate={setCurrentScreen} onUpdate={updateUserData} userId={userId} />,
    dimensions: <DimensionExplorer userData={userData} onNavigate={setCurrentScreen} onUpdate={updateUserData} userId={userId} />,
    cards: <SoulDeck userData={userData} onNavigate={setCurrentScreen} onUpdate={updateUserData} userId={userId} />,
    abilities: <AbilitiesScreen userData={userData} onNavigate={setCurrentScreen} onUpdate={updateUserData} userId={userId} />
  };

  return (
    <div className="app-container">
      {screens[currentScreen]}
      <nav className="bottom-nav">
        <button
          className={`nav-btn ${currentScreen === 'main' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('main')}
        >
          <span className="nav-icon">🌀</span>
          <span>Главная</span>
        </button>
        <button
          className={`nav-btn ${currentScreen === 'dimensions' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('dimensions')}
        >
          <span className="nav-icon">🌌</span>
          <span>Миры</span>
        </button>
        <button
          className={`nav-btn ${currentScreen === 'cards' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('cards')}
        >
          <span className="nav-icon">🃏</span>
          <span>Карты</span>
        </button>
        <button
          className={`nav-btn ${currentScreen === 'abilities' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('abilities')}
        >
          <span className="nav-icon">⚡</span>
          <span>Силы</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
