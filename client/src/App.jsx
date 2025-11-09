import React, { useState } from 'react';
import { UserProvider, useUser } from './context/UserContext';
import { Home } from './components/tabs/Home';
import { Partners } from './components/tabs/Partners';
import { Income } from './components/tabs/Income';
import { Profile } from './components/tabs/Profile';
import './App.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const { loading } = useUser();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Инициализация...</p>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <div className="app-content">
        {activeTab === 'home' && <Home />}
        {activeTab === 'partners' && <Partners />}
        {activeTab === 'income' && <Income />}
        {activeTab === 'profile' && <Profile />}
      </div>

      <nav className="bottom-nav">
        <button
          className={`nav-button ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
          title="Дом"
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Дом</span>
        </button>
        <button
          className={`nav-button ${activeTab === 'partners' ? 'active' : ''}`}
          onClick={() => setActiveTab('partners')}
          title="Партнёры"
        >
          <span className="nav-icon">👥</span>
          <span className="nav-label">Партнёры</span>
        </button>
        <button
          className={`nav-button ${activeTab === 'income' ? 'active' : ''}`}
          onClick={() => setActiveTab('income')}
          title="Доход"
        >
          <span className="nav-icon">💸</span>
          <span className="nav-label">Доход</span>
        </button>
        <button
          className={`nav-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
          title="Профиль"
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Профиль</span>
        </button>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
