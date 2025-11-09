import React, { useState } from 'react';
import { UserProvider, useUser } from './context/UserContext';
import { Home } from './components/tabs/Home';
import { Partners } from './components/tabs/Partners';
import { Income } from './components/tabs/Income';
import { Profile } from './components/tabs/Profile';
import './App.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const { loading, error, user, telegramId, telegramUser } = useUser();

  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const debug = params.get('debug') === '1';

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
      {debug && (
        <div style={{position: 'fixed', right: 10, top: 10, zIndex: 9999, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: 8, borderRadius: 6, maxWidth: 360, fontSize: 12}}>
          <div style={{fontWeight: 'bold', marginBottom: 6}}>DEBUG</div>
          <div><strong>error:</strong> {error ? String(error) : 'null'}</div>
          <div><strong>telegramId:</strong> {String(telegramId || 'null')}</div>
          <div><strong>userId:</strong> {String(user?.id || 'null')}</div>
          <details style={{color:'#fff', marginTop:6}}>
            <summary style={{cursor:'pointer'}}>state</summary>
            <pre style={{whiteSpace:'pre-wrap', maxHeight: 200, overflow: 'auto'}}>{JSON.stringify({user, telegramUser}, null, 2)}</pre>
          </details>
        </div>
      )}

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
