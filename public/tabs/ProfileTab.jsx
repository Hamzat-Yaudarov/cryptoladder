import React, { useState, useEffect } from 'react';
import '../styles/tabs.css';

const ProfileTab = ({ user }) => {
  const [ranking, setRanking] = useState(null);
  const [rankingStats, setRankingStats] = useState(null);
  const [topRankers, setTopRankers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingReward, setClaimingReward] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const initData = window.Telegram?.WebApp?.initData || '';

      const [rankingRes, topRes, activitiesRes] = await Promise.all([
        fetch('/api/ranking/me', { headers: { Authorization: `Bearer ${initData}` } }),
        fetch('/api/ranking/weekly', { headers: { Authorization: `Bearer ${initData}` } }),
        fetch('/api/activities', { headers: { Authorization: `Bearer ${initData}` } }),
      ]);

      if (rankingRes.ok) {
        const data = await rankingRes.json();
        setRanking(data.ranking);
        setRankingStats(data.stats);
      }

      if (topRes.ok) {
        const data = await topRes.json();
        setTopRankers(data.slice(0, 5));
      }

      if (activitiesRes.ok) {
        const data = await activitiesRes.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async () => {
    if (!ranking?.reward || ranking?.claimed) {
      alert('❌ Нет доступных наград');
      return;
    }

    try {
      setClaimingReward(true);
      const initData = window.Telegram?.WebApp?.initData || '';

      const response = await fetch('/api/ranking/claim-reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${initData}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`❌ ${error.error}`);
        return;
      }

      const result = await response.json();
      setRanking(result.ranking);
      alert(`✅ Награда ${result.ranking.reward} ⭐️ получена!`);
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert('❌ Ошибка при получении награды');
    } finally {
      setClaimingReward(false);
    }
  };

  if (loading) {
    return <div className="tab-content">⏳ Загрузка профиля...</div>;
  }

  return (
    <div className="tab-content profile-tab">
      <div className="profile-header">
        <h2>⚙️ Профиль</h2>
      </div>

      <div className="profile-info-card">
        <div className="profile-avatar">
          {user?.firstName?.charAt(0).toUpperCase() || '👤'}
        </div>
        <div className="profile-details">
          <div className="profile-name">
            {user?.firstName} {user?.lastName || ''}
          </div>
          {user?.username && (
            <div className="profile-username">@{user.username}</div>
          )}
          <div className="profile-balance">
            {user?.balance?.toFixed(2)} ⭐️
          </div>
        </div>
      </div>

      {ranking && (
        <div className="ranking-section">
          <h3>🏆 Еженедельный рейтинг</h3>
          <div className="ranking-card">
            <div className="ranking-badge">
              {ranking.rank === 1 && '🥇'}
              {ranking.rank === 2 && '🥈'}
              {ranking.rank === 3 && '🥉'}
              {ranking.rank > 3 && '🏅'}
            </div>
            <div className="ranking-info">
              <div className="ranking-position">
                Место: <strong>#{ranking.rank}</strong>
              </div>
              <div className="ranking-referrals">
                Рефереалов: <strong>{ranking.referral_count}</strong>
              </div>
              {ranking.reward && (
                <div className="ranking-reward">
                  Награда: <strong>{ranking.reward} ⭐️</strong>
                </div>
              )}
            </div>

            {ranking.reward && !ranking.claimed && (
              <button
                className="btn btn-success btn-sm"
                onClick={handleClaimReward}
                disabled={claimingReward}
              >
                {claimingReward ? '⏳ Получаю...' : '🎁 Получить'}
              </button>
            )}
            {ranking.claimed && <div className="badge-claimed">✅ Получено</div>}
          </div>
        </div>
      )}

      {rankingStats && (
        <div className="ranking-stats">
          <h3>📊 Статистика рейтинга</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-info">
                <div className="stat-label">Появлений в топ 5</div>
                <div className="stat-value">{rankingStats.top5Count}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <div className="stat-label">Получено наград</div>
                <div className="stat-value">{rankingStats.totalClaimed.toFixed(0)} ⭐️</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <div className="stat-label">Ожидает</div>
                <div className="stat-value">{rankingStats.pendingRewards.toFixed(0)} ⭐️</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {topRankers.length > 0 && (
        <div className="top-rankers">
          <h3>🌟 Топ строителей</h3>
          <div className="rankers-list">
            {topRankers.map((ranker, idx) => (
              <div key={idx} className="ranker-item">
                <div className="ranker-rank">
                  {ranker.rank === 1 && '🥇'}
                  {ranker.rank === 2 && '🥈'}
                  {ranker.rank === 3 && '🥉'}
                  {ranker.rank > 3 && `#${ranker.rank}`}
                </div>
                <div className="ranker-info">
                  <div className="ranker-name">
                    {ranker.first_name || 'Игрок'}
                  </div>
                  <div className="ranker-referrals">
                    {ranker.referral_count} рефереалов
                  </div>
                </div>
                <div className="ranker-reward">
                  {ranker.reward} ⭐️
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="recent-activities">
        <h3>📋 Недавняя активность</h3>
        {activities.length === 0 ? (
          <div className="empty-state">
            <p>Пока нет активности</p>
          </div>
        ) : (
          <div className="activities-list">
            {activities.slice(0, 10).map((activity, idx) => (
              <div key={idx} className="activity-item">
                <div className="activity-action">
                  {activity.action === 'CITY_CREATED' && '🏙️ Город создан'}
                  {activity.action === 'FACTORY_ACTIVATED' && '🏭 Завод активирован'}
                  {activity.action === 'REFERRAL_JOINED' && '👤 Новый рефереал'}
                  {activity.action === 'PROFIT_RECEIVED' && '💰 Прибыль получена'}
                  {activity.action === 'CITY_UPGRADED' && '⬆️ Город улучшен'}
                  {activity.action === 'WEEKLY_REWARD_CLAIMED' && '🎁 Награда получена'}
                  {activity.action === 'USER_CREATED' && '✨ Профиль создан'}
                </div>
                <div className="activity-time">
                  {new Date(activity.created_at).toLocaleString('ru-RU')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="help-section">
        <h3>❓ Справка</h3>
        <div className="help-items">
          <div className="help-item">
            <div className="help-title">💰 Как заработать</div>
            <div className="help-desc">
              Создайте город, активируйте завод �� пригласите жителей. Получайте
              доход от их активности по уровням.
            </div>
          </div>

          <div className="help-item">
            <div className="help-title">🏆 Как участвовать в рейтинге</div>
            <div className="help-desc">
              Еженедельный рейтинг формируется автоматически по количеству приглашённых
              рефереалов. Топ-5 получают награды.
            </div>
          </div>

          <div className="help-item">
            <div className="help-title">📈 Как расширить город</div>
            <div className="help-desc">
              Каждый новый уровень города требует больше рефереалов. Начните с 15
              для уровня 3, затем 35, 70 и так далее.
            </div>
          </div>

          <div className="help-item">
            <div className="help-title">⭐️ Где получить звёзды</div>
            <div className="help-desc">
              В вкладке "Город" есть кнопка пополнения баланса через Telegram Stars.
              Вы можете покупать звёзды напрямую.
            </div>
          </div>
        </div>
      </div>

      <div className="footer-info">
        <p>CityLadder v1.0.0</p>
        <p>🌐 Telegram MiniApp Economic Game</p>
        <p>Разработано с ❤️ для вас</p>
      </div>
    </div>
  );
};

export default ProfileTab;
