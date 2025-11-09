import React from 'react';
import { useUser } from '../../context/UserContext';
import '../styles/Profile.css';

export function Profile() {
  const { user } = useUser();

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          {user?.photo_url ? (
            <img src={user.photo_url} alt="User avatar" className="avatar-image" />
          ) : (
            <span className="avatar-placeholder">👤</span>
          )}
        </div>
        <div className="profile-name-section">
          <h2 className="profile-name">
            {user?.first_name} {user?.last_name || ''}
          </h2>
          {user?.username && <p className="profile-username">@{user.username}</p>}
          <p className="profile-id">ID: {user?.id}</p>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-label">Баланс</div>
          <div className="stat-value">{parseFloat(user?.balance || 0).toFixed(2)} ⭐️</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Рефералы</div>
          <div className="stat-value">{user?.referral_count || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Доход</div>
          <div className="stat-value">{parseFloat(user?.total_earnings || 0).toFixed(2)} ⭐️</div>
        </div>
      </div>

      <div className="profile-sections">
        <div className="profile-section">
          <h3>📋 Информация об аккаунте</h3>
          <div className="info-list">
            <div className="info-row">
              <span className="info-label">Статус:</span>
              <span className={`status-badge ${user?.parent_id ? 'active' : 'inactive'}`}>
                {user?.parent_id ? '✅ В структуре' : '⏳ Новичок'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Активация:</span>
              <span className={`status-badge ${user?.is_activated_today ? 'active' : 'inactive'}`}>
                {user?.is_activated_today ? '✅ Активирован' : '⏳ Неактивирован'}
              </span>
            </div>
            {user?.last_activation && (
              <div className="info-row">
                <span className="info-label">Последняя активация:</span>
                <span className="info-value">
                  {new Date(user.last_activation).toLocaleString('ru-RU')}
                </span>
              </div>
            )}
            {user?.created_at && (
              <div className="info-row">
                <span className="info-label">Присоединился:</span>
                <span className="info-value">
                  {new Date(user.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="profile-section">
          <h3>🎯 Правила игры</h3>
          <div className="rules-list">
            <div className="rule-item">
              <span className="rule-icon">1️⃣</span>
              <span className="rule-text">Купите место в пирамиде (3 ⭐️)</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">2️⃣</span>
              <span className="rule-text">Активируйтесь каждый день (10 ⭐️)</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">3️⃣</span>
              <span className="rule-text">Зарабатывайте от активаций под вами</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">4️⃣</span>
              <span className="rule-text">Приглашайте друзей и увеличивайте доход</span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>💎 Система заработка</h3>
          <div className="earning-system">
            <div className="system-item">
              <span className="system-label">За активацию (5 ⭐️ распределяется):</span>
              <div className="system-details">
                <div>📊 Уровень 1 → 35%</div>
                <div>📊 Уровень 2 → 21%</div>
                <div>📊 Уровень 3 → 14%</div>
                <div>📊 Уровень 4 → 8%</div>
                <div>📊 Уровень 5 → 4%</div>
              </div>
            </div>
            <div className="system-item">
              <span className="system-label">За рефералов:</span>
              <div className="system-details">
                <div>🎁 0.5 ⭐️ за первую активацию каждого приглашённого</div>
                <div>🎁 Бонус повторяется при каждой активац��и реферала</div>
              </div>
            </div>
            <div className="system-item">
              <span className="system-label">Глубина дохода:</span>
              <div className="system-details">
                <div>0-14 рефералов → до 2 уровней</div>
                <div>15-34 реферала → до 3 уровней</div>
                <div>35-69 рефералов → до 4 уровней</div>
                <div>70+ рефералов → до 5 уровней</div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>❓ Часто задаваемые вопросы</h3>
          <div className="faq-list">
            <div className="faq-item">
              <div className="faq-question">Как получить первые звёзды?</div>
              <div className="faq-answer">
                Попросите администратора добавить вам стартовый баланс или купите место через другой способ.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-question">Что если я не активируюсь?</div>
              <div className="faq-answer">
                Если не активны больше 3 дней, ваша ветка замораживается и вы не получаете доход от активаций.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-question">Как увеличить уровень доступа?</div>
              <div className="faq-answer">
                Приглашайте больше рефералов. С каждым порогом количества приглашённых разблокируются новые уровни.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-question">Безопасно ли это?</div>
              <div className="faq-answer">
                Это профессиональный проект. Звёзды — внутренняя валюта сервиса и имеют ценность. Используйте сервис ответственно и ознакомьтесь с условиями использования.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-footer">
        <p>Crypto Ladder © 2024</p>
        <p>Версия 1.0</p>
      </div>
    </div>
  );
}
