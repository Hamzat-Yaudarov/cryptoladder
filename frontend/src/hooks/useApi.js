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
          'X-Telegram-Username': sessionStorage.getItem('telegramUsername') || localStorage.getItem('telegramUsername') || '',
          'X-Telegram-First-Name': sessionStorage.getItem('telegramFirstName') || localStorage.getItem('telegramFirstName') || '',
          'X-Telegram-Last-Name': sessionStorage.getItem('telegramLastName') || localStorage.getItem('telegramLastName') || '',
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
