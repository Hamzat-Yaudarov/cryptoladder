import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import Button from '../components/Button';
import Card from '../components/Card';
import '../styles/tabs/CityTab.css';

export default function CityTab({ userData, refreshUser, telegramId }) {
  const [cityData, setCityData] = useState(null);
  const [activeFactories, setActiveFactories] = useState([]);
  const [cityCreating, setCityCreating] = useState(false);
  const [factoryActivating, setFactoryActivating] = useState(false);
  const { call } = useApi();

  useEffect(() => {
    fetchCityData();
  }, [telegramId]);

  const fetchCityData = async () => {
    try {
      const params = new URLSearchParams({ telegram_id: telegramId.toString() });
      
      const [city, factories] = await Promise.all([
        fetch(`/api/city?${params}`, { headers: { 'X-Telegram-ID': telegramId.toString() } }).then(r => r.json()),
        fetch(`/api/factory/active?${params}`, { headers: { 'X-Telegram-ID': telegramId.toString() } }).then(r => r.json()),
      ]);
      
      setCityData(city);
      setActiveFactories(factories);
    } catch (error) {
      console.error('Failed to fetch city data:', error);
    }
  };

  const handleCreateCity = async () => {
    setCityCreating(true);
    try {
      const data = await fetch('/api/city/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-ID': telegramId.toString(),
        },
        body: JSON.stringify({ telegram_id: telegramId.toString() }),
      }).then(r => r.json());

      if (data.error) {
        alert(`Ошибка: ${data.error}`);
      } else {
        await Promise.all([fetchCityData(), refreshUser()]);
      }
    } catch (error) {
      alert(`Ошибка: ${error.message}`);
    } finally {
      setCityCreating(false);
    }
  };

  const handleActivateFactory = async () => {
    setFactoryActivating(true);
    try {
      const data = await fetch('/api/factory/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-ID': telegramId.toString(),
        },
        body: JSON.stringify({ telegram_id: telegramId.toString() }),
      }).then(r => r.json());

      if (data.error) {
        alert(`Ошибка: ${data.error}`);
      } else {
        await Promise.all([fetchCityData(), refreshUser()]);
      }
    } catch (error) {
      alert(`Ошибка: ${error.message}`);
    } finally {
      setFactoryActivating(false);
    }
  };

  if (!userData) {
    return <div className="city-tab-loading">Загрузка...</div>;
  }

  const isActive = userData.is_city_active;

  return (
    <div className="city-tab">
      <div className="city-header">
        <h1 className="city-title">🏙️ Мой Город</h1>
        <div className="city-level">Уровень {userData.city_level}</div>
      </div>

      {!isActive ? (
        <Card className="city-welcome-card">
          <div className="welcome-content">
            <div className="welcome-emoji">🏘️</div>
            <h2 className="welcome-title">Создайте свой город!</h2>
            <p className="welcome-description">
              Стоимость: <span className="cost-stars">3⭐️</span>
            </p>
            <p className="welcome-benefits">
              ✨ 2 дома для жили��<br/>
              ✨ 1 завод для производства<br/>
              ✨ Реферальная ссылка<br/>
            </p>
            <Button 
              onClick={handleCreateCity}
              disabled={cityCreating || userData.balance < 3}
              className="create-city-btn"
            >
              {cityCreating ? 'Создание...' : 'Создать город'}
            </Button>
            {userData.balance < 3 && (
              <p className="insufficient-balance">Недостаточно звёзд. Нужно 3⭐️</p>
            )}
          </div>
        </Card>
      ) : (
        <>
          <Card className="balance-card">
            <div className="balance-section">
              <div className="balance-item">
                <span className="balance-label">Баланс</span>
                <span className="balance-value">{Math.floor(userData.balance)}⭐️</span>
              </div>
              <div className="balance-item">
                <span className="balance-label">Домов</span>
                <span className="balance-value">{cityData?.houses || 0}</span>
              </div>
              <div className="balance-item">
                <span className="balance-label">Заводов</span>
                <span className="balance-value">{activeFactories.length}/{cityData?.factory_count || 0}</span>
              </div>
            </div>
          </Card>

          <Card className="factory-status-card">
            <h3 className="factory-title">🏭 Статус завода</h3>
            
            {activeFactories.length > 0 ? (
              <div className="factories-list">
                {activeFactories.map((factory, idx) => {
                  const expiresAt = new Date(factory.expires_at);
                  const now = new Date();
                  const timeLeft = expiresAt - now;
                  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                  
                  return (
                    <div key={idx} className="factory-item">
                      <div className="factory-status-active">
                        <span className="status-dot"></span>
                        Активен
                      </div>
                      <div className="factory-time">
                        Осталось: {hours}ч {minutes}м
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-active-factory">Нет активных заводов</p>
            )}

            <Button
              onClick={handleActivateFactory}
              disabled={factoryActivating || userData.balance < 10}
              className="activate-factory-btn"
            >
              {factoryActivating ? 'Активация...' : '▶️ Запустить завод (10⭐️)'}
            </Button>
            
            {userData.balance < 10 && (
              <p className="insufficient-balance">Нужно 10⭐️ для активации завода</p>
            )}
          </Card>

          <Card className="city-benefits-card">
            <h3 className="benefits-title">💰 Как я зарабатываю?</h3>
            <ul className="benefits-list">
              <li>🏭 Запустите завод = 10⭐️/день</li>
              <li>👥 Жители приносят прибыль</li>
              <li>📈 По уровням: 4⭐️, 2.5⭐️, 1.7⭐️, 1⭐️, 0.5⭐️</li>
              <li>⏰ Выплаты каждый час</li>
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
