import React, { useState, useEffect } from 'react';
import '../styles/tabs.css';

const ResidentsTab = ({ user }) => {
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState(null);
  const [referralLink, setReferralLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const initData = window.Telegram?.WebApp?.initData || '';

      const [refRes, linkRes] = await Promise.all([
        fetch('/api/referrals', { headers: { Authorization: `Bearer ${initData}` } }),
        fetch('/api/referrals/link', { headers: { Authorization: `Bearer ${initData}` } }),
      ]);

      if (refRes.ok) {
        const refData = await refRes.json();
        setReferrals(refData.referrals);
        setStats(refData.stats);
      }

      if (linkRes.ok) {
        const linkData = await linkRes.json();
        setReferralLink(linkData.link);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = async () => {
    const shareText = `🏙️ Присоединяйтесь к CityLadder и стройте свой город! ${referralLink}`;

    if (window.Telegram?.WebApp?.shareToStory) {
      await window.Telegram.WebApp.shareToStory(referralLink);
    } else if (navigator.share) {
      await navigator.share({
        title: 'CityLadder',
        text: 'Присоединяйтесь к экономической игре CityLadder!',
        url: referralLink,
      });
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return <div className="tab-content">⏳ Загрузка жителей...</div>;
  }

  return (
    <div className="tab-content residents-tab">
      <div className="residents-header">
        <h2>👥 Жители вашего города</h2>
      </div>

      <div className="referral-stats">
        <div className="stat-box">
          <span className="stat-label">Всего рефереалов</span>
          <span className="stat-value">{stats?.totalReferrals || 0}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Активных</span>
          <span className="stat-value">{stats?.activeReferrals || 0}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Неактивных</span>
          <span className="stat-value">{stats?.inactiveReferrals || 0}</span>
        </div>
      </div>

      <div className="referral-link-section">
        <h3>🔗 Пригласите друзей</h3>
        <div className="referral-link-box">
          <input
            type="text"
            className="referral-link-input"
            value={referralLink}
            readOnly
          />
          <div className="referral-link-buttons">
            <button className="btn btn-small" onClick={handleCopyLink}>
              {copied ? '✅ Скопировано' : '📋 Копировать'}
            </button>
            <button className="btn btn-small btn-primary" onClick={handleShareLink}>
              📤 Поделиться
            </button>
          </div>
        </div>
        <p className="link-hint">Пригласите друзей и получайте 0.5 ⭐️ за каждую активацию завода!</p>
      </div>

      <div className="residents-list">
        <h3>📍 Жители</h3>
        {referrals.length === 0 ? (
          <div className="empty-state">
            <p>Пока нет приглашённых жителей</p>
            <p className="hint">Поделитесь своей ссылкой и получите первого жителя 👆</p>
          </div>
        ) : (
          <div className="residents-grid">
            {referrals.map((referral) => (
              <div key={referral.id} className="resident-card">
                <div className="resident-avatar">
                  {referral.first_name?.charAt(0).toUpperCase() || '👤'}
                </div>
                <div className="resident-info">
                  <div className="resident-name">
                    {referral.first_name || 'Пользователь'}
                  </div>
                  <div className="resident-balance">
                    {referral.balance?.toFixed(2) || '0'} ⭐️
                  </div>
                </div>
                <div className="resident-status">
                  {referral.balance > 0 ? '✅ Активен' : '⏳ Новый'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="income-info">
        <h3>💰 Как получить доход</h3>
        <p>Вы получаете доход от активности приглашённых жителей:</p>
        <div className="level-table">
          <table>
            <thead>
              <tr>
                <th>Уровень</th>
                <th>Кол-во</th>
                <th>Доход на игрока</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1 уровень</td>
                <td>до 3</td>
                <td>+4 ⭐️/24ч</td>
              </tr>
              <tr>
                <td>2 уровень</td>
                <td>до 9</td>
                <td>+2.5 ⭐️/24ч</td>
              </tr>
              <tr>
                <td>3 уровень</td>
                <td>до 27</td>
                <td>+1.7 ⭐️/24ч</td>
              </tr>
              <tr>
                <td>4 уровень</td>
                <td>до 81</td>
                <td>+1 ⭐️/24ч</td>
              </tr>
              <tr>
                <td>5 уровень</td>
                <td>до 243</td>
                <td>+0.5 ⭐️/24ч</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResidentsTab;
