import React, { useState, useEffect } from 'react';
import TelegramService from '../services/TelegramService';
import './AbilitiesScreen.css';

function AbilitiesScreen({ userData, onNavigate, onUpdate, userId }) {
  const [abilities, setAbilities] = useState([]);

  useEffect(() => {
    const allAbilities = [
      {
        id: 1,
        name: 'Видение Истины',
        emoji: '👁️',
        description: 'Видишь скрытые сокровища в мире',
        requirement: 'Собрать 5 карт',
        requirement_met: userData.soulCards.length >= 5,
        cost: 50,
        effect: 'Раскрывает новые возможности'
      },
      {
        id: 2,
        name: 'Временной Разлом',
        emoji: '⏰',
        description: 'Управляй ходом времени в Измерении',
        requirement: 'Энергия Души > 150',
        requirement_met: userData.soulEnergy > 150,
        cost: 75,
        effect: 'Замедляет или ускоряет события'
      },
      {
        id: 3,
        name: 'Телепортация Кристаллов',
        emoji: '✨',
        description: 'Мгновенный перенос на любое расстояние',
        requirement: 'Разблокировать 3+ измерения',
        requirement_met: userData.dimensions.unlocked.length >= 3,
        cost: 100,
        effect: 'Передвигайся между мирами без задержки'
      },
      {
        id: 4,
        name: 'Эхо Вселенной',
        emoji: '🌌',
        description: 'Услышь голос самой вселенной',
        requirement: 'Эпические карты: 2+',
        requirement_met: userData.soulCards.filter(c => c.rarity === 'epic').length >= 2,
        cost: 150,
        effect: 'Получай мудрость из других измерений'
      },
      {
        id: 5,
        name: 'Бесконечный Кристалл',
        emoji: '💎',
        description: 'Генерируй кристаллы из энергии',
        requirement: 'Уровень Измерения: 3+',
        requirement_met: userData.dimensionLevel >= 3,
        cost: 80,
        effect: 'Бесконечный источник ресурсов'
      },
      {
        id: 6,
        name: 'Слияние Измерений',
        emoji: '🔀',
        description: 'Объединяй измерения в одно целое',
        requirement: 'Разблокировать все 6 миров',
        requirement_met: userData.dimensions.unlocked.length === 6,
        cost: 500,
        effect: 'Откроешь финальную истину'
      }
    ];

    setAbilities(allAbilities);
  }, [userData]);

  const handleUnlock = (ability) => {
    if (!ability.requirement_met) {
      TelegramService.showAlert(`Требование не выполнено: ${ability.requirement}`);
      return;
    }

    if (userData.crystals < ability.cost) {
      TelegramService.showAlert(`Недостаточно кристаллов. Требуется: ${ability.cost}`);
      return;
    }

    TelegramService.hapticFeedback();
    TelegramService.showAlert(`✨ Сила "${ability.name}" разблокирована!`);
  };

  const unlockedCount = abilities.filter(a => a.requirement_met && userData.crystals >= a.cost).length;

  return (
    <div className="screen-container">
      <div className="screen-header">
        <h2 className="screen-title">⚡ Силы</h2>
        <span className="stat-badge">{unlockedCount} / {abilities.length}</span>
      </div>

      <div className="abilities-intro">
        <p className="intro-text">
          💫 Каждая сила - это врата в новые возможности. Выполнись требованиями и раскрой свой истинный потенциал.
        </p>
      </div>

      <div className="abilities-list">
        {abilities.map((ability) => (
          <div
            key={ability.id}
            className={`ability-card ${ability.requirement_met ? 'unlockable' : 'locked'}`}
          >
            <div className="ability-header">
              <span className="ability-emoji">{ability.emoji}</span>
              <div className="ability-info">
                <h4 className="ability-name">{ability.name}</h4>
                <p className="ability-description">{ability.description}</p>
              </div>
            </div>

            <div className="ability-requirement">
              <span className={`req-label ${ability.requirement_met ? 'met' : 'unmet'}`}>
                {ability.requirement_met ? '✅' : '❌'} {ability.requirement}
              </span>
            </div>

            <div className="ability-footer">
              <span className="ability-effect">{ability.effect}</span>
              <span className="ability-cost">💎 {ability.cost}</span>
            </div>

            <button
              className={`ability-unlock-btn ${!ability.requirement_met ? 'disabled' : ''}`}
              onClick={() => handleUnlock(ability)}
              disabled={!ability.requirement_met}
            >
              {ability.requirement_met ? '🔓 Разблокировать' : '🔒 Заблокировано'}
            </button>
          </div>
        ))}
      </div>

      <div className="abilities-lore">
        <h4 className="lore-title">📜 Легенда Сил</h4>
        <p className="lore-text">
          Аня хранит в своем Измерении древние силы. Каждая из них требует особой готовности. Когда ты будешь готов, врата откроются...
        </p>
      </div>
    </div>
  );
}

export default AbilitiesScreen;
