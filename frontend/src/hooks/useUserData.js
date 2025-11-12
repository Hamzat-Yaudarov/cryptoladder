import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

export function useUserData(telegramId) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { call } = useApi();

  const refreshUser = useCallback(async () => {
    if (!telegramId) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({
        telegram_id: telegramId.toString(),
      });
      const data = await fetch(`/api/user?${params}`, {
        headers: {
          'X-Telegram-ID': telegramId.toString(),
        },
      }).then(r => r.json());
      
      setUserData(data);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  }, [telegramId]);

  useEffect(() => {
    if (telegramId) {
      refreshUser();
      // Auto-refresh every 30 seconds
      const interval = setInterval(refreshUser, 30000);
      return () => clearInterval(interval);
    }
  }, [telegramId, refreshUser]);

  return { userData, loading, refreshUser };
}
