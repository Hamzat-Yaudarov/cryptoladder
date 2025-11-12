import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import '../styles/tabs/ProfileTab.css';

export default function ProfileTab({ userData, refreshUser, telegramId }) {
  const [rating, setRating] = useState(null);
  const [topRatings, setTopRatings] = useState([]);
  const [claimingReward, setClaimingReward] = useState(false);

  useEffect(() => {
    fetchRatingData();
  }, [telegramId]);

  const fetchRatingData = async () => {
    try {
      const params = new URLSearchParams({ telegram_id: telegramId.toString() });
      
      const [currentRating, topData] = await Promise.all([
        fetch(`/api/rating/current?${params}`, { headers: { 'X-Telegram-ID': telegramId.toString() } }).then(r => r.json()),
        fetch('/api/rating/top?limit=10').then(r => r.json()),
      ]);
      
      setRating(currentRating);
      setTopRatings(topData || []);
    } catch (error) {
      console.error('Failed to fetch rating data:', error);
    }
  };

  const handleClaimReward = async () => {
    setClaimingReward(true);
    try {
      const data = await fetch('/api/rating/claim-reward', {
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
        await Promise.all([fetchRatingData(), refreshUser()]);
        alert(`✅ Получено ${data.reward}⭐️!`);
      }
    } catch (error) {
      alert(`Ошибка: ${error.message}`);
    } finally {
      setClaimingReward(false);
    }
  };

  const getMedalEmoji = (position) => {
    const medals = {
      1: '🥇',
      2: '🥈',
      3: '🥉',
    };
    return medals[position] || '🎖️';
  };

  return (
    <div className="profile-tab">
      <div className="profile-header">
        <div className="profile-avatar">
          <span className="avatar-emoji">👤</span>
        </div>
        <div className="profile-info">
          <h1 className="profile-name">
            {userData?.first_name} {userData?.last_name || ''}
          </h1>
          <p className="profile-username">
            @{userData?.username || `user${telegramId}`}
          </p>
        </div>
      </div>

      <Card className="profile-stats-card">
        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-icon">⭐️</span>
            <span className="stat-label">Баланс</span>
            <span className="stat-value">{Math.floor(userData?.balance || 0)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-icon">👥</span>
            <span className="stat-label">Реферралы</span>
            <span className="stat-value">{userData?.total_referrals || 0}</span>
          </div>
          <div className="stat-box">
            <span className="stat-icon">🏙</span>
            <span className="stat-label">Уровень</span>
            <span className="stat-value">{userData?.city_level || 0}</span>
          </div>
          <div className="stat-box">
            <span className="stat-icon">📅</span>
            <span className="stat-label">Дни</span>
            <span className="stat-value">
              {userData?.created_at ? 
                Math.floor((Date.now() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24)) 
                : 0
              }
            </span>
          </div>
        </div>
      </Card>

      {rating && (
        <Card className="rating-card">
          <h3 className="rating-title">📊 Еженедельный рейтинг</h3>
          <div className="rating-content">
            <div className="rating-display">
              <div className="rating-position">
                <div className="position-medal">{getMedalEmoji(rating.position)}</div>
                <div className="position-number">#{rating.position}</div>
              </div>
              <div className="rating-info">
                <div className="rating-stat">
                  <span className="rating-label">Позиция</span>
                  <span className="rating-value">{rating.position} место</span>
                </div>
                <div className="rating-stat">
                  <span className="rating-label">Реферралов</span>
                  <span className="rating-value">{rating.referral_count}</span>
                </div>
                <div className="rating-stat">
                  <span className="rating-label">Награда</span>
                  <span className="rating-value">{rating.reward || 0}⭐️</span>
                </div>
              </div>
            </div>

            {rating.reward && !rating.reward_claimed && (
              <Button 
                onClick={handleClaimReward} 
                disabled={claimingReward}
                className="claim-reward-btn"
              >
                {claimingReward ? '⏳ Получение...' : '🎁 Получить награду'}
              </Button>
            )}

            {rating.reward_claimed && (
              <div className="reward-claimed">
                <span className="claimed-text">✅ Награда получена</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {topRatings.length > 0 && (
        <Card className="top-ratings-card">
          <h3 className="top-title">🏆 Топ игроков этой недели</h3>
          <div className="ratings-list">
            {topRatings.slice(0, 10).map((leader, idx) => (
              <div key={idx} className={`rating-item ${leader.position <= 3 ? 'top-tier' : ''}`}>
                <div className="rating-rank">
                  <span className="rank-medal">{getMedalEmoji(leader.position)}</span>
                  <span className="rank-number">#{leader.position}</span>
                </div>
                <div className="rating-player">
                  <div className="player-name">{leader.first_name}</div>
                  <div className="player-referrals">👥 {leader.referral_count} реф.</div>
                </div>
                <div className="rating-reward">
                  {leader.reward}⭐️
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="rules-card">
        <h3 className="rules-title">📖 Правила и информация</h3>
        <div className="rules-content">
          <div className="rule-section">
            <h4>🎯 Цель игры</h4>
            <p>Приглашайте друзей, создавайте город и получайте доход от их активности. Соревнуйтесь с другими игроками в еженедельном рейтинге!</p>
          </div>

          <div className="rule-section">
            <h4>💰 Система заработка</h4>
            <ul>
              <li>Запустите завод (10⭐️/сутки)</li>
              <li>Получайте доход от жителей вашего города</li>
              <li>Выплаты каждый час</li>
            </ul>
          </div>

          <div className="rule-section">
            <h4>🏅 Еженедельные награды</h4>
            <table className="rewards-table">
              <tbody>
                <tr>
                  <td>🥇 1 место</td>
                  <td className="reward-value">100⭐️</td>
                </tr>
                <tr>
                  <td>🥈 2 место</td>
                  <td className="reward-value">75⭐️</td>
                </tr>
                <tr>
                  <td>🥉 3 место</td>
                  <td className="reward-value">50⭐️</td>
                </tr>
                <tr>
                  <td>4-5 места</td>
                  <td className="reward-value">25⭐️ / 15⭐️</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rule-section">
            <h4>⚠️ Важно</h4>
            <ul>
              <li>Защита от накруток - все связи проверяются</li>
              <li>Звезды реальные - Telegram Stars</li>
              <li>Можно выводить в Telegram Wallet</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="support-card">
        <h3 className="support-title">❓ Помощь</h3>
        <p className="support-text">
          Если у вас есть вопросы, напишите администратору или используйте команду /help в боте.
        </p>
        <Button className="support-btn">
          📧 Связаться с поддержкой
        </Button>
      </Card>
    </div>
  );
}
