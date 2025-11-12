import { query } from '../database/client.js';

const WEEKLY_REWARDS = {
  1: 100,
  2: 75,
  3: 50,
  4: 25,
  5: 15
};

export async function generateWeeklyRatings() {
  // Get current week boundaries
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  
  // Get all users with their referral counts
  const usersResult = await query(
    `SELECT 
      telegram_id,
      total_referrals,
      created_at
     FROM users
     WHERE is_city_active = true
     ORDER BY total_referrals DESC
     LIMIT 100`
  );
  
  const users = usersResult.rows;
  
  // Create rating entries
  for (let i = 0; i < users.length; i++) {
    const position = i + 1;
    const reward = WEEKLY_REWARDS[position] || 0;
    
    await query(
      `INSERT INTO weekly_ratings (week_start, week_end, user_id, position, referral_count, reward, reward_claimed)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       ON CONFLICT (week_start, user_id) DO UPDATE SET
         position = $4,
         referral_count = $5,
         reward = $6,
         reward_claimed = false`,
      [weekStart, weekEnd, users[i].telegram_id, position, users[i].total_referrals, reward]
    );
  }
  
  return users.length;
}

export async function getWeeklyRating(telegramId) {
  const result = await query(
    `SELECT 
      w.*,
      u.username,
      u.first_name
     FROM weekly_ratings w
     JOIN users u ON w.user_id = u.telegram_id
     WHERE w.user_id = $1
     ORDER BY w.week_start DESC
     LIMIT 1`,
    [telegramId]
  );
  
  return result.rows[0];
}

export async function getCurrentWeeklyRating(telegramId) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  
  const result = await query(
    `SELECT 
      w.*,
      u.username,
      u.first_name
     FROM weekly_ratings w
     JOIN users u ON w.user_id = u.telegram_id
     WHERE w.user_id = $1 AND w.week_start = $2`,
    [telegramId, weekStart]
  );
  
  return result.rows[0];
}

export async function getTopRatings(limit = 10) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  
  const result = await query(
    `SELECT 
      w.position,
      w.reward,
      u.telegram_id,
      u.username,
      u.first_name,
      w.referral_count
     FROM weekly_ratings w
     JOIN users u ON w.user_id = u.telegram_id
     WHERE w.week_start = $1
     ORDER BY w.position ASC
     LIMIT $2`,
    [weekStart, limit]
  );
  
  return result.rows;
}

export async function claimReward(telegramId) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  
  const ratingResult = await query(
    `SELECT * FROM weekly_ratings
     WHERE user_id = $1 AND week_start = $2 AND reward_claimed = false`,
    [telegramId, weekStart]
  );
  
  if (!ratingResult.rows[0]) {
    throw new Error('No unclaimed reward found');
  }
  
  const rating = ratingResult.rows[0];
  
  // Update user balance
  await query(
    'UPDATE users SET balance = balance + $1 WHERE telegram_id = $2',
    [rating.reward, telegramId]
  );
  
  // Mark reward as claimed
  await query(
    `UPDATE weekly_ratings SET reward_claimed = true WHERE id = $1`,
    [rating.id]
  );
  
  return rating.reward;
}

export const WEEKLY_REWARDS_CONST = WEEKLY_REWARDS;
