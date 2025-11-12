import { useState, useCallback } from 'react';

export function useApi() {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const call = useCallback(async (endpoint, options = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-ID': sessionStorage.getItem('telegramId') || localStorage.getItem('telegramId'),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'API Error');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { call, error, isLoading };
}
