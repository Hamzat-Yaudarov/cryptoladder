import { query } from '../db/client.js';

const WEEKLY_REWARDS = [
  { rank: 1, amount: 100 },
  { rank: 2, amount: 75 },
  { rank: 3, amount: 50 },
  { rank: 4, amount: 25 },
  { rank: 5, amount: 15 },
];

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust to Monday
  return new Date(d.setDate(diff));
}

function getWeekStartString(date = new Date()) {
  const d = getWeekStart(date);
  return d.toISOString().split('T')[0];
}

export async function getWeeklyRating(weekStart = null) {
  try {
    const week = weekStart || getWeekStartString();

    const result = await query(
      `SELECT wr.*, u.username, u.first_name, u.telegram_id
       FROM weekly_ratings wr
       JOIN users u ON wr.user_id = u.id
       WHERE wr.week_start = $1
       ORDER BY wr.referral_count DESC, wr.created_at ASC
       LIMIT 100`,
      [week]
    );

    return result.rows;
  } catch (error) {
    console.error('Error in getWeeklyRating:', error);
    throw error;
  }
}

export async function updateWeeklyRatings() {
  try {
    const week = getWeekStartString();

    // Get all users with their referral counts
    const usersResult = await query(
      `SELECT u.id, u.telegram_id, COUNT(r.id) as referral_count
       FROM users u
       LEFT JOIN referrals r ON u.id = r.referrer_id
       GROUP BY u.id, u.telegram_id
       ORDER BY referral_count DESC`
    );

    const users = usersResult.rows;

    // Upsert weekly ratings
    for (let i = 0; i < users.length; i++) {
      const { id: userId, referral_count } = users[i];
      const rank = i + 1;

      await query(
        `INSERT INTO weekly_ratings (week_start, user_id, referral_count, rank)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (week_start, user_id) DO UPDATE
         SET referral_count = $3, rank = $4, updated_at = CURRENT_TIMESTAMP`,
        [week, userId, referral_count, rank]
      );
    }

    console.log('✅ Updated weekly ratings for', users.length, 'users');
  } catch (error) {
    console.error('Error in updateWeeklyRatings:', error);
  }
}

export async function distributeWeeklyRewards() {
  try {
    const week = getWeekStartString();

    const result = await query(
      `SELECT * FROM weekly_ratings
       WHERE week_start = $1 AND reward_claimed = FALSE
       ORDER BY rank ASC`,
      [week]
    );

    const ratings = result.rows;

    for (const rating of ratings) {
      const { rank, user_id: userId } = rating;
      const reward = WEEKLY_REWARDS.find((r) => r.rank === rank);

      if (reward) {
        // Add reward to user's balance
        await query(
          `UPDATE cities
           SET balance = balance + $1
           WHERE user_id = $2`,
          [reward.amount, userId]
        );

        // Mark reward as claimed
        await query(
          `UPDATE weekly_ratings
           SET reward_claimed = TRUE
           WHERE week_start = $1 AND user_id = $2`,
          [week, userId]
        );

        // Record transaction
        await query(
          `INSERT INTO transactions (user_id, type, amount, description)
           VALUES ($1, $2, $3, $4)`,
          [userId, 'weekly_reward', reward.amount, `Weekly rank reward (Rank ${rank})`]
        );

        console.log(`✅ Distributed weekly reward of ${reward.amount}⭐️ to user ${userId} (Rank ${rank})`);
      }
    }
  } catch (error) {
    console.error('Error in distributeWeeklyRewards:', error);
  }
}

export async function getCurrentWeekRank(userId) {
  try {
    const week = getWeekStartString();

    const result = await query(
      `SELECT rank, referral_count FROM weekly_ratings
       WHERE week_start = $1 AND user_id = $2`,
      [week, userId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error in getCurrentWeekRank:', error);
    throw error;
  }
}
