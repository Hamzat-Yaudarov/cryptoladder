import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import '../styles/Partners.css';

export function Partners() {
  const { user, telegramId } = useUser();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadReferrals();
    }
  }, [user?.id]);

  const loadReferrals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pyramid/referrals/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setReferrals(data.referrals);
      }
    } catch (error) {
      console.error('Error loading referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const referralLink = `https://t.me/cryptoladderbot/miniapp?start=${telegramId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareVia = () => {
    const text = `🚀 Присоединяйся к Crypto Ladder!\n\nЗарабатывай звёзды⭐️ в революционной пирамиде!\n\n${referralLink}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const maxLevels = user?.referral_count
    ? user.referral_count >= 70
      ? 5
      : user.referral_count >= 35
      ? 4
      : user.referral_count >= 15
      ? 3
      : 2
    : 2;

  return (
    <div className="partners-container">
      <div className="referral-link-section">
        <h2>👥 Ваша реферальная ссылка</h2>

        <div className="link-card">
          <div className="link-input-group">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="link-input"
            />
            <button
              className="btn btn-small btn-copy"
              onClick={copyToClipboard}
              title="Копи��овать ссылку"
            >
              {copied ? '✅ Скопировано' : '📋 Копировать'}
            </button>
          </div>
          <button className="btn btn-share" onClick={shareVia}>
            📤 Поделиться в Telegram
          </button>
        </div>
      </div>

      <div className="levels-section">
        <h2>📈 Уровни дохода</h2>
        <div className="levels-grid">
          <div className={`level-card ${user?.referral_count >= 0 ? 'active' : 'locked'}`}>
            <div className="level-number">0-14</div>
            <div className="level-title">2 уровня</div>
          </div>
          <div className={`level-card ${user?.referral_count >= 15 ? 'active' : 'locked'}`}>
            <div className="level-number">15-34</div>
            <div className="level-title">3 уровня</div>
          </div>
          <div className={`level-card ${user?.referral_count >= 35 ? 'active' : 'locked'}`}>
            <div className="level-number">35-69</div>
            <div className="level-title">4 уровня</div>
          </div>
          <div className={`level-card ${user?.referral_count >= 70 ? 'active' : 'locked'}`}>
            <div className="level-number">70+</div>
            <div className="level-title">5 уровней</div>
          </div>
        </div>
        <div className="current-levels">
          Ваш текущий уровень доступа: <strong>{maxLevels}</strong>
        </div>
      </div>

      <div className="referrals-section">
        <h2>👥 Приглашённые ({referrals.length})</h2>

        {loading ? (
          <div className="loading-spinner"></div>
        ) : referrals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>Вы ещё никого не пригласили</p>
            <p className="empty-hint">Поделитесь своей ссылкой, чтобы начать зарабатывать!</p>
          </div>
        ) : (
          <div className="referrals-list">
            {referrals.map((referral, index) => (
              <div key={referral.id} className="referral-item">
                <div className="referral-number">{index + 1}</div>
                <div className="referral-info">
                  <div className="referral-name">
                    {referral.first_name} {referral.last_name || ''}
                  </div>
                  {referral.username && (
                    <div className="referral-username">@{referral.username}</div>
                  )}
                  <div className="referral-date">
                    Присоединился:{' '}
                    {new Date(referral.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                <div className="referral-balance">
                  {parseFloat(referral.balance || 0).toFixed(2)} ⭐️
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
