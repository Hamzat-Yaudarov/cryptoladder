import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import '../styles/tabs.css';

export function ProfileTab() {
  const { user } = useContext(AppContext);
  const [weeklyRating, setWeeklyRating] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRating();
  }, [user]);

  const loadRating = async () => {
    try {
      if (!user) return;
      const response = await fetch(`/api/rating/weekly?user_id=${user.telegram_id}`);

      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setWeeklyRating(data.rating || []);
      setUserRank(data.userRank);
      setLoading(false);
    } catch (error) {
      console.error('Error loading rating:', error);
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '🏅';
    }
  };

  const getRewardAmount = (rank) => {
    const rewards = {
      1: 100,
      2: 75,
      3: 50,
      4: 25,
      5: 15,
    };
    return rewards[rank] || 0;
  };

  if (loading || !user) {
    return <div className="tab-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="tab-container profile-tab">
      <div className="tab-header">
        <h1>⚙️ Профиль</h1>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">👤</div>
        <div className="profile-info">
          <h2>{user?.first_name || user?.username || 'Игрок'}</h2>
          <p className="profile-id">ID: {user?.telegram_id}</p>
          {user?.created_at && (
            <p className="profile-joined">
              Присоединился: {new Date(user.created_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="rank-section">
        <h2>🏆 Еженедельный рейтинг</h2>

        {userRank && (
          <div className="user-rank-card">
            <p className="rank-title">Твой рейтинг:</p>
            <div className="rank-display">
              <span className="rank-badge">{getRankBadge(userRank.rank)}</span>
              <span className="rank-number">#{userRank.rank}</span>
            </div>
            <p className="rank-referrals">{userRank.referral_count} приглашённых</p>
            {getRewardAmount(userRank.rank) > 0 && (
              <p className="rank-reward">
                Награда: {getRewardAmount(userRank.rank)} ⭐️
              </p>
            )}
          </div>
        )}

        <div className="rating-list">
          <h3>📊 Топ игроки</h3>
          {weeklyRating.length === 0 ? (
            <p className="empty-message">Рейтинг пока пуст</p>
          ) : (
            <div className="top-players">
              {weeklyRating.slice(0, 10).map((player, index) => (
                <div key={index} className={`rating-item ${player.rank <= 3 ? 'top-rank' : ''}`}>
                  <div className="rating-position">
                    <span className="badge">{getRankBadge(player.rank)}</span>
                    <span className="position">#{player.rank}</span>
                  </div>
                  <div className="rating-player-info">
                    <p className="player-name">
                      {player.first_name || player.username || `User ${player.telegram_id}`}
                    </p>
                    <p className="player-stats">{player.referral_count} рефералов</p>
                  </div>
                  {getRewardAmount(player.rank) > 0 && (
                    <div className="rating-reward">
                      {getRewardAmount(player.rank)} ⭐️
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="help-section">
        <h3>❓ Справка</h3>
        <div className="faq">
          <div className="faq-item">
            <h4>Как начать?</h4>
            <p>
              Перейди в таб "Город", активируй свой завод за 10⭐️ и начни приглашать друзей
              через реферальную ссылку.
            </p>
          </div>

          <div className="faq-item">
            <h4>Как получать доход?</h4>
            <p>
              Когда твои рефералы активируют заводы, их прибыль будет делиться между тобой и
              другим�� игроками в твоей цепочке на основе уровней.
            </p>
          </div>

          <div className="faq-item">
            <h4>Что такое уровни?</h4>
            <p>
              Уровни показывают расстояние от тебя до других игроков в сети. Чем ближе уровень,
              тем выше процент прибыли от их заводов.
            </p>
          </div>

          <div className="faq-item">
            <h4>Как расширить город?</h4>
            <p>
              Приглашай рефералов! С каждым новым приглашением твой город растёт и получает
              новые уровни дохода.
            </p>
          </div>

          <div className="faq-item">
            <h4>Рейтинг и награды?</h4>
            <p>
              Каждую неделю форум рейтинг по количеству приглашённых. Топ-5 игроков получают
              звёзды.
            </p>
          </div>
        </div>
      </div>

      <div className="contact-section">
        <h3>💬 Контакты поддержки</h3>
        <p>Есл�� у тебя есть вопросы или проблемы:</p>
        <a href="https://t.me/cryptoladder_support" className="btn btn-secondary">
          📧 Написать в поддержку
        </a>
      </div>

      <div className="footer-text">
        <p>CityLadder v1.0</p>
        <p>© 2024 All rights reserved</p>
      </div>
    </div>
  );
}
