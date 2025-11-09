import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [telegramId, setTelegramId] = useState(null);
  const [telegramUser, setTelegramUser] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const delay = (ms) => new Promise((res) => setTimeout(res, ms));

    const initializeTelegramApp = async () => {
      try {
        // Retry for up to 3 seconds to allow Telegram to inject WebApp object
        const start = Date.now();
        while (Date.now() - start < 3000) {
          if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const webApp = window.Telegram.WebApp;
            try {
              webApp.ready();
              webApp.expand?.();
            } catch {}

            console.log('Telegram WebApp detected');

            if (webApp.initDataUnsafe?.user?.id) {
              const tgUser = webApp.initDataUnsafe.user;
              console.log('Telegram user data:', tgUser);

              if (!isMounted) return;
              setTelegramId(tgUser.id);
              setTelegramUser(tgUser);

              const referrerId = getStartParam();
              await initializeUser(tgUser.id, tgUser, referrerId);
              return;
            }
          }
          await delay(100);
        }
      } catch (err) {
        console.error('Ошибка инициализации Telegram:', err);
      }

      if (!isMounted) return;
      console.warn('Telegram WebApp не обнаружен');
      setError('Telegram WebApp не инициализирован');
      setLoading(false);
    };

    initializeTelegramApp();

    return () => { isMounted = false; };
  }, []);

  const getStartParam = () => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.start_param) {
      return parseInt(window.Telegram.WebApp.initDataUnsafe.start_param);
    }
    return null;
  };

  const initializeUser = async (telegramId, tgUserData = null, referrerId = null) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        telegramId,
        userData: tgUserData ? {
          username: tgUserData.username,
          first_name: tgUserData.first_name,
          last_name: tgUserData.last_name,
          photo_url: tgUserData.photo_url,
        } : null,
      };

      if (referrerId) {
        payload.referrerId = referrerId;
      }

      const response = await fetch('/api/auth/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось инициализировать пользователя');
      }

      const data = await response.json();
      console.log('User initialized successfully:', data.user);
      setUser(data.user);
      setError(null);
    } catch (err) {
      console.error('Ошибка при инициализации пользователя:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/auth/user/${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      console.error('Ошибка при обновлении пользователя:', err);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        error,
        telegramId,
        telegramUser,
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
