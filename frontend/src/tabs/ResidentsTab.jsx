import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import '../styles/tabs/ResidentsTab.css';

export default function ResidentsTab({ userData, telegramId }) {
  const [residents, setResidents] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [totalResidents, setTotalResidents] = useState(0);

  useEffect(() => {
    fetchResidents();
  }, [telegramId]);

  const fetchResidents = async () => {
    try {
      const params = new URLSearchParams({ telegram_id: telegramId.toString() });
      
      const [residentsData, distributionData, countData] = await Promise.all([
        fetch(`/api/residents?${params}`, { headers: { 'X-Telegram-ID': telegramId.toString() } }).then(r => r.json()),
        fetch(`/api/residents/distribution?${params}`, { headers: { 'X-Telegram-ID': telegramId.toString() } }).then(r => r.json()),
        fetch(`/api/residents/count?${params}`, { headers: { 'X-Telegram-ID': telegramId.toString() } }).then(r => r.json()),
      ]);
      
      setResidents(residentsData || []);
      setDistribution(distributionData || []);
      setTotalResidents(countData.count || 0);
    } catch (error) {
      console.error('Failed to fetch residents:', error);
    }
  };

  const referralLink = userData ? 
    `https://t.me/cryptoladderbot/miniapp?startApp=1&ref=${userData.telegram_id}` : '';

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    alert('✅ Ссылка скопирована!');
  };

  const shareReferralLink = () => {
    const text = encodeURIComponent(`Приглашаю тебя в CityLadder - экономическую игру на Telegram! Заработай звёзды ⭐️\n\n${referralLink}`);
    window.open(`https://t.me/share/url?url=${referralLink}&text=${text}`, '_blank');
  };

  return (
    <div className="residents-tab">
      <h1 className="residents-title">👥 Мой город: {totalResidents} жителей</h1>

      {userData?.is_city_active && (
        <Card className="referral-card">
          <h3 className="referral-title">🔗 Приглашите друзей</h3>
          <p className="referral-desc">Приглашённые становятся жителями вашего города и приносят прибыль</p>
          
          <div className="referral-link-group">
            <input 
              type="text" 
              value={referralLink}
              readOnly
              className="referral-link-input"
            />
            <button className="copy-btn" onClick={copyReferralLink}>📋</button>
          </div>
          
          <Button onClick={shareReferralLink} className="share-referral-btn">
            📤 Поделиться в Telegram
          </Button>

          <div className="referral-stats">
            <div className="stat">
              <span className="stat-label">Всего приглашено</span>
              <span className="stat-value">{userData.total_referrals}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Живых жителей</span>
              <span className="stat-value">{totalResidents}</span>
            </div>
          </div>
        </Card>
      )}

      {distribution.length > 0 && (
        <Card className="distribution-card">
          <h3 className="distribution-title">📊 Распределение жителей по уровням</h3>
          <div className="distribution-list">
            {distribution.map((dist, idx) => (
              <div key={idx} className="distribution-item">
                <div className="distribution-level">
                  <span className="level-number">Уровень {dist.level}</span>
                  <span className="level-count">{dist.active_count}/{dist.count}</span>
                </div>
                <div className="distribution-profit">
                  <span className="profit-label">Прибыль за 24ч:</span>
                  <span className="profit-value">
                    {dist.level_total_profit.toFixed(1)}⭐️
                  </span>
                </div>
                <div className="distribution-bar">
                  <div 
                    className="distribution-fill" 
                    style={{ width: `${(dist.active_count / dist.count) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {residents.length > 0 && (
        <Card className="residents-list-card">
          <h3 className="residents-list-title">👫 Жители вашего города</h3>
          <div className="residents-list">
            {residents.map((resident, idx) => (
              <div key={idx} className="resident-item">
                <div className="resident-info">
                  <div className="resident-name">
                    {resident.first_name} {resident.last_name || ''}
                  </div>
                  <div className="resident-meta">
                    <span className="resident-level">Уровень {resident.level}</span>
                    <span className="resident-factories">
                      {resident.active_factories} завод{resident.active_factories !== 1 ? 'ов' : ''}
                    </span>
                  </div>
                </div>
                <div className="resident-status">
                  {resident.is_active && <span className="status-badge active">Активен</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {totalResidents === 0 && userData?.is_city_active && (
        <Card className="empty-residents-card">
          <div className="empty-state">
            <div className="empty-emoji">👥</div>
            <h3 className="empty-title">Нет жителей</h3>
            <p className="empty-description">
              Приглашайте друзей через реферальную ссылку, чтобы они стали жителями вашего города и приносили прибыль.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
