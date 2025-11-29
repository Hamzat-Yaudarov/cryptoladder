import React, { useState } from 'react';
import TelegramService from '../services/TelegramService';
import './SoulDeck.css';

function SoulDeck({ userData, onNavigate, onUpdate, userId }) {
  const [drawingCard, setDrawingCard] = useState(false);
  const [justDrawn, setJustDrawn] = useState(null);

  const rarityColors = {
    common: '#9999cc',
    rare: '#00ff88',
    epic: '#ff3366'
  };

  const rarityNames = {
    common: 'Обычная',
    rare: 'Редкая',
    epic: 'Эпическая'
  };

  const handleDrawCard = async () => {
    setDrawingCard(true);
    try {
      const response = await fetch(`/api/user/${userId}/draw-card`, {
        method: 'POST'
      });
      const card = await response.json();
      TelegramService.hapticFeedback();
      setJustDrawn(card);
      onUpdate();
      setTimeout(() => setJustDrawn(null), 3000);
    } catch (error) {
      console.error('Error drawing card:', error);
    } finally {
      setDrawingCard(false);
    }
  };

  const commonCards = userData.soulCards.filter(c => c.rarity === 'common');
  const rareCards = userData.soulCards.filter(c => c.rarity === 'rare');
  const epicCards = userData.soulCards.filter(c => c.rarity === 'epic');

  return (
    <div className="screen-container">
      <div className="screen-header">
        <h2 className="screen-title">🃏 Колода Душ</h2>
        <span className="stat-badge">{userData.soulCards.length} карт</span>
      </div>

      {justDrawn && (
        <div className={`card-draw-animation ${justDrawn.rarity}`}>
          <div className="card-draw-content">
            <p className="draw-message">Новая карта!</p>
            <p className="card-draw-name">{justDrawn.name}</p>
            <p className="card-draw-rarity">{rarityNames[justDrawn.rarity]}</p>
            <p className="card-draw-power">⚡ Мощь: {justDrawn.power}</p>
          </div>
        </div>
      )}

      <button
        className="draw-btn"
        onClick={handleDrawCard}
        disabled={drawingCard}
      >
        <span className="draw-icon">✨</span>
        <span className="draw-text">{drawingCard ? '召唤中...' : '召唤Карту'}</span>
      </button>

      <div className="rarity-sections">
        {epicCards.length > 0 && (
          <div className="rarity-section epic-section">
            <h3 className="rarity-title">🌟 Эпические ({epicCards.length})</h3>
            <div className="cards-list">
              {epicCards.map((card) => (
                <div key={card.id} className="card-item epic-card">
                  <div className="card-header">
                    <span className="card-name">{card.name}</span>
                  </div>
                  <div className="card-power">⚡ {card.power}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {rareCards.length > 0 && (
          <div className="rarity-section rare-section">
            <h3 className="rarity-title">💎 Редкие ({rareCards.length})</h3>
            <div className="cards-list">
              {rareCards.map((card) => (
                <div key={card.id} className="card-item rare-card">
                  <div className="card-header">
                    <span className="card-name">{card.name}</span>
                  </div>
                  <div className="card-power">⚡ {card.power}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {commonCards.length > 0 && (
          <div className="rarity-section common-section">
            <h3 className="rarity-title">📝 Обычные ({commonCards.length})</h3>
            <div className="cards-list">
              {commonCards.map((card) => (
                <div key={card.id} className="card-item common-card">
                  <div className="card-header">
                    <span className="card-name">{card.name}</span>
                  </div>
                  <div className="card-power">⚡ {card.power}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {userData.soulCards.length === 0 && (
          <div className="empty-state">
            <p className="empty-emoji">🌑</p>
            <p className="empty-text">Ты еще не召唤了ни одной карты...</p>
            <p className="empty-hint">召唤свою первую карту Души!</p>
          </div>
        )}
      </div>

      <div className="collection-stats">
        <div className="stat-row">
          <span>Всего карт:</span>
          <span className="stat-value">{userData.soulCards.length}</span>
        </div>
        <div className="stat-row">
          <span>Средняя мощь:</span>
          <span className="stat-value">
            {userData.soulCards.length > 0
              ? Math.round(
                  userData.soulCards.reduce((a, c) => a + c.power, 0) / userData.soulCards.length
                )
              : 0}
          </span>
        </div>
        <div className="stat-row">
          <span>Максимальная мощь:</span>
          <span className="stat-value">
            {userData.soulCards.length > 0 ? Math.max(...userData.soulCards.map(c => c.power)) : 0}
          </span>
        </div>
      </div>
    </div>
  );
}

export default SoulDeck;
