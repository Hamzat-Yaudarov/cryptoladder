import React, { useState } from 'react';
import TelegramService from '../services/TelegramService';
import './DimensionExplorer.css';

function DimensionExplorer({ userData, onNavigate, onUpdate, userId }) {
  const [selectedDim, setSelectedDim] = useState(userData.dimensions.current);
  const [unlocking, setUnlocking] = useState(false);

  const dimensions = [
    {
      id: 1,
      name: 'Кристальный Лес',
      emoji: '🌲',
      description: 'Лес из кристаллов, светящихся ночью',
      color: '#00ff88'
    },
    {
      id: 2,
      name: 'Киберское Зеркало',
      emoji: '🔮',
      description: 'Мир отражений и цифровых эхо',
      color: '#00ffff'
    },
    {
      id: 3,
      name: 'Безлюдная Пустота',
      emoji: '⚫',
      description: 'Здесь время движется в обратную сторону',
      color: '#b800e6'
    },
    {
      id: 4,
      name: 'Звездный Ковчег',
      emoji: '⭐',
      description: 'Корабль, плывущий сквозь галактики',
      color: '#ffcc00'
    },
    {
      id: 5,
      name: 'Пульсирующий Океан',
      emoji: '🌊',
      description: 'Вода, которая светится в ритме вселенной',
      color: '#00ddff'
    },
    {
      id: 6,
      name: 'Заброшенный Храм',
      emoji: '🏛️',
      description: 'Святилище богов, забытых временем',
      color: '#ff3366'
    }
  ];

  const isUnlocked = (dimId) => userData.dimensions.unlocked.includes(dimId);

  const handleUnlock = async () => {
    setUnlocking(true);
    try {
      const response = await fetch(`/api/user/${userId}/unlock-dimension`, {
        method: 'POST'
      });
      if (response.ok) {
        TelegramService.hapticFeedback();
        TelegramService.showAlert('✨ Новое измерение разблокировано!');
        onUpdate();
      }
    } catch (error) {
      console.error('Error unlocking dimension:', error);
    } finally {
      setUnlocking(false);
    }
  };

  const handleSelectDimension = (dimId) => {
    if (isUnlocked(dimId)) {
      setSelectedDim(dimId);
      TelegramService.hapticFeedback();
    } else {
      TelegramService.showAlert('Это измерение еще не разблокировано...');
    }
  };

  const selectedDimData = dimensions.find(d => d.id === selectedDim);

  return (
    <div className="screen-container">
      <div className="screen-header">
        <h2 className="screen-title">🌌 Карта Измерений</h2>
        <span className="stat-badge">{userData.dimensions.unlocked.length} / 6</span>
      </div>

      <div className="dimension-showcase">
        <div className="showcase-inner">
          <div className="dimension-display">
            <div className="dimension-emoji" style={{ color: selectedDimData?.color }}>
              {selectedDimData?.emoji}
            </div>
            <h3 className="dimension-name" style={{ color: selectedDimData?.color }}>
              {selectedDimData?.name}
            </h3>
            <p className="dimension-description">{selectedDimData?.description}</p>
          </div>
        </div>
      </div>

      <div className="dimensions-grid">
        {dimensions.map((dim) => (
          <button
            key={dim.id}
            className={`dimension-card ${isUnlocked(dim.id) ? 'unlocked' : 'locked'} ${
              selectedDim === dim.id ? 'selected' : ''
            }`}
            onClick={() => handleSelectDimension(dim.id)}
            style={{
              borderColor: isUnlocked(dim.id) ? dim.color : 'rgba(255, 255, 255, 0.1)',
              '--dim-color': dim.color
            }}
          >
            <span className="dim-emoji">{dim.emoji}</span>
            <span className="dim-number">#{dim.id}</span>
            {!isUnlocked(dim.id) && <span className="lock-icon">🔒</span>}
          </button>
        ))}
      </div>

      <div className="dimension-info">
        <h4 className="info-title">📖 Легенда Измерения</h4>
        <p className="info-text">
          {selectedDim === 1 && 'В Кристальном Лесу живут древние духи. Они дарят мудрость тем, кто может их услышать.'}
          {selectedDim === 2 && 'Киберское Зеркало отражает ваше истинное я. Здесь нет лжи, только данные.'}
          {selectedDim === 3 && 'Безлюдная Пустота - это царство Ани. Здесь время текучее, как вода.'}
          {selectedDim === 4 && 'Звездный Ковчег несет потомков давних цивилизаций на новые миры.'}
          {selectedDim === 5 && 'Пульсирующий Океан дышит в такт с сердцебиением вселенной.'}
          {selectedDim === 6 && 'В Заброшенном Храме остались только вопросы без ответов.'}
        </p>
      </div>

      {userData.dimensions.unlocked.length < 6 && (
        <button
          className="btn btn-primary unlock-btn"
          onClick={handleUnlock}
          disabled={unlocking}
        >
          {unlocking ? 'Разблокировка...' : '✨ Разблокировать Следующее Измерение'}
        </button>
      )}

      {userData.dimensions.unlocked.length === 6 && (
        <div className="achievement-unlocked">
          <p className="achievement-text">🏆 Все измерения исследованы!</p>
        </div>
      )}
    </div>
  );
}

export default DimensionExplorer;
