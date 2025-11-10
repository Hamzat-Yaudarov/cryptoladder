import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import '../styles/tabs.css';

export function CitizensTab() {
  const { user } = useContext(AppContext);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferrals();
  }, [user]);

  const loadReferrals = async () => {
    try {
      if (!user) return;
      const response = await fetch(`/api/referrals?user_id=${user.telegram_id}`);
      if (response.ok) {
        const data = await response.json();
        setReferrals(data.referrals || []);
      }
    } catch (error) {
      console.error('Error loading referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      const response = await fetch(`/api/referrals?user_id=${user.telegram_id}`);
      const data = await response.json();
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  if (loading || !user) {
    return <div className="tab-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="tab-container citizens-tab">
      <div className="tab-header">
        <h1>👥 Жители города</h1>
      </div>

      <div className="referral-link-card">
        <h3>🔗 Пригла��ай друзей</h3>
        <p className="referral-hint">
          Каждый приглашённый получит бонус 0.5⭐️ при первой активации завода
        </p>
        <button className={`btn btn-secondary ${copied ? 'copied' : ''}`} onClick={copyLink}>
          {copied ? '✓ Скопировано!' : '📋 Скопировать ссылку'}
        </button>
      </div>

      <div className="referrals-counter">
        <h3>Всего жителей: <span className="count">{referrals.length}</span></h3>
      </div>

      {referrals.length === 0 ? (
        <div className="empty-state">
          <p>📭 У тебя ещё нет приглашённых жителей</p>
          <p>Скопируй ссылку выше и поделись с друзьями</p>
        </div>
      ) : (
        <div className="referrals-list">
          {referrals.map((ref, index) => (
            <div key={index} className="referral-item">
              <div className="referral-header">
                <span className="referral-rank">#{index + 1}</span>
                <span className="referral-name">
                  {ref.first_name || ref.username || `User ${ref.telegram_id}`}
                </span>
              </div>
              <div className="referral-details">
                <span className="referral-level">Уровень: {ref.level}</span>
                <span className={`factory-status ${ref.is_active ? 'active' : 'inactive'}`}>
                  {ref.is_active ? '✓ Завод активен' : '✗ Завод неактивен'}
                </span>
              </div>
              <div className="referral-balance">
                Баланс: {ref.balance?.toFixed(2) || '0.00'} ⭐️
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="network-structure">
        <h3>📊 Структура города</h3>
        <div className="structure-info">
          <p>
            Твой город растёт вверх! Каждый уровень - это слой мегаполиса с разной
            численностью жителей:
          </p>
          <ul className="structure-list">
            <li>🏠 Уровень 1: до 3 жителей (40% от прибыли заводов)</li>
            <li>🏠 Уровень 2: до 9 жителей (25% от прибыли заводов)</li>
            <li>🏠 Уровень 3: до 27 жителей (17% от прибыли заводов)</li>
            <li>🏠 Уровень 4: до 81 жителя (10% от прибыли заводов)</li>
            <li>🏠 Уровень 5: до 243 жителей (5% от прибыли заводов)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
