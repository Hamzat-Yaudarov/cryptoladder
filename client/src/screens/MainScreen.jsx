import React, { useState } from 'react';
import TelegramService from '../services/TelegramService';
import './MainScreen.css';

function MainScreen({ userData, onNavigate, onUpdate, userId }) {
  const [actionInProgress, setActionInProgress] = useState(null);
  const [lastAction, setLastAction] = useState(null);

  const handleDailyBonus = async () => {
    setActionInProgress('daily');
    try {
      const response = await fetch(`/api/user/${userId}/claim-daily`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        TelegramService.hapticFeedback();
        setLastAction({
          type: 'bonus',
          message: `✨ Получено +${data.bonusEnergy} энергии!`,
          energy: data.bonusEnergy
        });
        onUpdate();
        setTimeout(() => setLastAction(null), 3000);
      } else {
        TelegramService.showAlert('Уже забрали сегодня');
      }
    } catch (error) {
      console.error('Error claiming daily:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAction = async (action) => {
    setActionInProgress(action);
    try {
      const response = await fetch(`/api/user/${userId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        const data = await response.json();
        TelegramService.hapticFeedback();
        setLastAction({
          type: 'action',
          message: data.message,
          gained: data.gained
        });
        onUpdate();
        setTimeout(() => setLastAction(null), 4000);
      }
    } catch (error) {
      console.error('Error performing action:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  const getMoodMessage = () => {
    const energy = userData.soulEnergy;
    if (energy > 150) return '✨ Аня чувствует твою мощь...';
    if (energy > 100) return '🌙 Аня улыбается';
    if (energy > 50) return '🔮 Аня наблюдает';
    return '💔 Аня немного устала...';
  };

  return (
    <div className="screen-container">
      <div className="main-screen">
        <div className="header-section">
          <div className="anya-avatar">
            <div className="avatar-inner">
              <span className="avatar-emoji">✨</span>
            </div>
          </div>
          <div className="greeting-text">
            <h1 className="glow-text">Измерение Ани</h1>
            <p className="mood-message">{getMoodMessage()}</p>
          </div>
        </div>

        <div className="energy-display">
          <div className="energy-bar-container">
            <div className="energy-label">
              <span>⚡ Энергия Души</span>
              <span className="energy-value">{userData.soulEnergy}/300</span>
            </div>
            <div className="energy-bar">
              <div
                className="energy-fill"
                style={{ width: `${Math.min((userData.soulEnergy / 300) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="crystal-display">
            <span className="crystal-icon">💎</span>
            <span className="crystal-amount">{userData.crystals}</span>
          </div>
        </div>

        {lastAction && (
          <div className={`action-feedback ${lastAction.type}`}>
            <p className="feedback-message">{lastAction.message}</p>
            {lastAction.gained && (
              <p className="feedback-gain">+{lastAction.gained} кристаллов</p>
            )}
          </div>
        )}

        <div className="actions-grid">
          <button
            className="action-btn meditate-btn"
            onClick={() => handleAction('meditate')}
            disabled={actionInProgress === 'meditate' || userData.soulEnergy < 10}
          >
            <span className="action-icon">🧘</span>
            <span className="action-name">Медитация</span>
            <span className="action-cost">10 энергии</span>
          </button>

          <button
            className="action-btn explore-btn"
            onClick={() => handleAction('explore')}
            disabled={actionInProgress === 'explore' || userData.soulEnergy < 20}
          >
            <span className="action-icon">🔍</span>
            <span className="action-name">Исследование</span>
            <span className="action-cost">20 энергии</span>
          </button>

          <button
            className="action-btn summon-btn"
            onClick={() => handleAction('summon')}
            disabled={actionInProgress === 'summon' || userData.soulEnergy < 30}
          >
            <span className="action-icon">🌀</span>
            <span className="action-name">Вызов</span>
            <span className="action-cost">30 энергии</span>
          </button>

          <button
            className="action-btn daily-btn"
            onClick={handleDailyBonus}
            disabled={actionInProgress === 'daily'}
          >
            <span className="action-icon">🎁</span>
            <span className="action-name">Дневной Подарок</span>
            <span className="action-cost">Один раз в день</span>
          </button>
        </div>

        <div className="quick-access">
          <button className="quick-btn" onClick={() => onNavigate('dimensions')}>
            <span>🌌 Исследуй Измерения</span>
          </button>
          <button className="quick-btn" onClick={() => onNavigate('cards')}>
            <span>🃏 Твоя Коллекция</span>
          </button>
          <button className="quick-btn" onClick={() => onNavigate('abilities')}>
            <span>⚡ Разблокируй Силы</span>
          </button>
        </div>

        <div className="tips-section">
          <p className="tip-title">💬 Мудрость Ани</p>
          <p className="tip-text">«Каждое измерение хранит сокровища. Не торопись. Аня всегда будет с тобой.»</p>
        </div>
      </div>
    </div>
  );
}

export default MainScreen;
