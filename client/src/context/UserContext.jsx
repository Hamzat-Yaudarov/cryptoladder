import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [telegramId, setTelegramId] = useState(null);

  useEffect(() => {
    // Get Telegram data from WebApp
    const initializeTelegramApp = async () => {
      try {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          const webApp = window.Telegram.WebApp;
          webApp.ready();

          console.log('Telegram WebApp detected, initDataUnsafe:', webApp.initDataUnsafe);

          if (webApp.initDataUnsafe?.user?.id) {
            const userId = webApp.initDataUnsafe.user.id;
            console.log('Initializing with Telegram ID:', userId);
            setTelegramId(userId);
            await initializeUser(userId);
            return;
          }
        }
      } catch (err) {
        console.error('Telegram init error:', err);
      }

      // Fallback: use test ID if no Telegram data
      console.log('Using fallback test ID');
      setTelegramId(123456789);
      await initializeUser(123456789);
    };

    initializeTelegramApp();
  }, []);

  const initializeUser = async (id) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegramId: id }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize user');
      }

      const data = await response.json();
      setUser(data.user);
      setError(null);
    } catch (err) {
      console.error('Error initializing user:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!telegramId) return;
    try {
      const response = await fetch(`/api/auth/user/${telegramId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        error,
        telegramId,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
