import React, { useState, useEffect, useRef } from 'react';
import Card from '../components/Card';
import '../styles/tabs/IncomeTab.css';
import '../styles/Pyramid.css';

export default function IncomeTab({ userData, telegramId }) {
  const [profitHistory, setProfitHistory] = useState([]);
  const [profitToday, setProfitToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [incomeStats, setIncomeStats] = useState(null);
  const balanceRef = useRef(null);
  const localBalance = useRef(userData?.balance || 0);

  useEffect(() => {
    fetchProfitData();
    fetchIncomeStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telegramId]);

  useEffect(() => {
    localBalance.current = userData?.balance || 0;
  }, [userData?.balance]);

  const fetchProfitData = async () => {
    try {
      const params = new URLSearchParams({ telegram_id: telegramId.toString() });

      const [historyData, todayData] = await Promise.all([
        fetch(`/api/profit-history?${params}`, { headers: { 'X-Telegram-ID': telegramId.toString() } }).then(r => r.json()),
        fetch(`/api/profit-today?${params}`, { headers: { 'X-Telegram-ID': telegramId.toString() } }).then(r => r.json()),
      ]);

      setProfitHistory(historyData || []);
      setProfitToday(todayData.profit_today || 0);
    } catch (error) {
      console.error('Failed to fetch profit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomeStats = async () => {
    try {
      const res = await fetch('/api/stats/income', { headers: { 'X-Telegram-ID': telegramId.toString() } });
      const data = await res.json();
      setIncomeStats(data);
    } catch (err) {
      console.error('Failed to fetch income stats', err);
    }
  };

  const calculateStats = () => {
    if (profitHistory.length === 0) {
      return { total: 0, average: 0, highest: 0 };
    }

    const total = profitHistory.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const average = total / profitHistory.length;
    const highest = Math.max(...profitHistory.map(p => parseFloat(p.amount)));

    return { total: total.toFixed(2), average: average.toFixed(2), highest: highest.toFixed(2) };
  };

  const stats = calculateStats();

  // Group profit by level from history (fallback)
  const profitByLevel = {};
  profitHistory.forEach(record => {
    const level = record.level;
    if (!profitByLevel[level]) {
      profitByLevel[level] = 0;
    }
    profitByLevel[level] += parseFloat(record.amount);
  });

  // Stars flow animation every N seconds
  useEffect(() => {
    if (!incomeStats || incomeStats.total_per_day <= 0) return;

    const interval = 10; // seconds
    const intervalMs = interval * 1000;
    // amount to add per interval = total_per_day / (86400/interval)
    const stepsPerDay = 86400 / interval;
    const amountPerInterval = incomeStats.total_per_day / stepsPerDay;

    const timer = setInterval(() => {
      // animate star
      animateStarToBalance();
      // update local display balance
      localBalance.current = parseFloat((localBalance.current + amountPerInterval).toFixed(4));
      if (balanceRef.current) {
        balanceRef.current.textContent = Math.floor(localBalance.current) + '⭐️';
      }
    }, intervalMs);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomeStats]);

  const animateStarToBalance = () => {
    const star = document.createElement('div');
    star.className = 'floating-star';
    star.textContent = '⭐️';
    document.body.appendChild(star);

    const start = {
      x: window.innerWidth / 2,
      y: window.innerHeight - 80
    };

    const targetEl = balanceRef.current;
    const targetRect = targetEl ? targetEl.getBoundingClientRect() : { left: window.innerWidth - 80, top: 20 };

    star.style.left = start.x + 'px';
    star.style.top = start.y + 'px';

    requestAnimationFrame(() => {
      star.style.transform = `translate(${targetRect.left - start.x}px, ${targetRect.top - start.y}px) scale(0.6)`;
      star.style.opacity = '0.0';
    });

    setTimeout(() => {
      star.remove();
    }, 1200);
  };

  if (!userData?.is_city_active) {
    return (
      <div className="income-tab">
        <Card className="not-active-card">
          <div className="not-active-content">
            <div className="not-active-emoji">🏘️</div>
            <p className="not-active-message">Создайте город, чтобы начать зарабатывать</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="income-tab">
      <h1 className="income-title">💸 Мой доход</h1>

      <Card className="income-summary-card">
        <div className="summary-header">
          <h3 className="summary-title">📊 Статистика доходов</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="refresh-btn" onClick={() => { fetchProfitData(); fetchIncomeStats(); }}>🔄</button>
            <div ref={balanceRef} className="current-balance">{Math.floor(userData.balance)}⭐️</div>
          </div>
        </div>

        <div className="income-stats">
          {incomeStats ? (
            <>
              <div className="income-digit">
                <div className="digit-label">📊 Доход от игроков (в сутки)</div>
                <div className="digit-value">{incomeStats.total_per_day}⭐️ / сутки</div>
                <div className="digit-sub">≈ {incomeStats.per_hour.toFixed(3)}⭐️ / час</div>
              </div>

              <div className="levels-list">
                {incomeStats.levels.map(l => (
                  <div key={l.level} className="level-item">
                    <div className="level-left">Уровень {l.level}</div>
                    <div className="level-middle">{l.active_players} активных → {l.active_factories} зав.</div>
                    <div className="level-right">{l.total_per_day}⭐️ / сутки</div>
                  </div>
                ))}
              </div>

              <div className="total-line">Всего: <strong>+{incomeStats.total_per_day}⭐️ / сутки</strong></div>
            </>
          ) : (
            <div>Загрузка аналитики...</div>
          )}
        </div>
      </Card>

      {profitHistory.length > 0 ? (
        <Card className="history-card">
          <h3 className="history-title">📜 История выплат (последние 50)</h3>
          <div className="profit-table">
            <div className="table-header">
              <div className="table-cell">Источник</div>
              <div className="table-cell">Уровень</div>
              <div className="table-cell">Сумма</div>
              <div className="table-cell">Время</div>
            </div>
            {profitHistory.slice(0, 50).map((record, idx) => (
              <div key={idx} className="table-row">
                <div className="table-cell">От завода</div>
                <div className="table-cell">Lv.{record.level}</div>
                <div className="table-cell profit">{parseFloat(record.amount).toFixed(2)}⭐️</div>
                <div className="table-cell time">
                  {new Date(record.created_at).toLocaleTimeString('ru-RU')}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="no-history-card">
          <div className="no-history-content">
            <div className="no-history-emoji">📭</div>
            <p className="no-history-message">Запустите завод и приглашайте жителей, чтобы начать получать доход</p>
          </div>
        </Card>
      )}

      <style>{`
        .floating-star {
          position: fixed;
          left: 50%;
          top: calc(100% - 120px);
          font-size: 22px;
          transition: transform 1.1s cubic-bezier(.2,.9,.2,1), opacity 1.1s;
          z-index: 9999;
        }

        .current-balance {
          font-weight: 700;
          background: linear-gradient(90deg, #fff, #fff);
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid rgba(0,0,0,0.06);
        }
      `}</style>
    </div>
  );
}
