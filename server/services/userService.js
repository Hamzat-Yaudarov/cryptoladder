import { query } from '../db.js';
import { createCity } from './cityService.js';

/**
 * Get or create a user from Telegram data
 */
export async function getOrCreateUser(telegramData) {
  try {
    const {
      id: telegramId,
      username,
      first_name,
      last_name,
    } = telegramData;
    
    // Check if user exists
    const existingRes = await query(
      `SELECT * FROM users WHERE telegram_id = $1`,
      [telegramId]
    );
    
    if (existingRes.rows.length > 0) {
      return existingRes.rows[0];
    }
    
    // Create new user
    const newUserRes = await query(
      `INSERT INTO users (telegram_id, username, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [telegramId, username, first_name, last_name]
    );
    
    const user = newUserRes.rows[0];
    
    // Create city for new user
    await createCity(telegramId, username);
    
    console.log(`✅ New user created: ${first_name} (${telegramId})`);
    
    return user;
  } catch (error) {
    console.error('Error getting or creating user:', error);
    throw error;
  }
}

/**
 * Get user profile with city data
 */
export async function getUserProfile(userId) {
  try {
    const userRes = await query(
      `SELECT * FROM users WHERE telegram_id = $1`,
      [userId]
    );
    
    if (userRes.rows.length === 0) {
      return null;
    }
    
    const user = userRes.rows[0];
    
    // Get city data
    const cityRes = await query(
      `SELECT * FROM cities WHERE user_id = $1`,
      [userId]
    );
    
    // Get referral count
    const refCountRes = await query(
      `SELECT COUNT(*) as count FROM referrals WHERE referrer_user_id = $1`,
      [userId]
    );
    
    // Get balance
    const balanceRes = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM profit_history WHERE user_id = $1`,
      [userId]
    );
    
    return {
      ...user,
      city: cityRes.rows[0] || null,
      referral_count: parseInt(refCountRes.rows[0].count),
      total_earned: parseFloat(balanceRes.rows[0].total),
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

/**
 * Update user balance (add stars)
 */
export async function addUserBalance(userId, amount, description = 'Balance addition') {
  try {
    const result = await query(
      `UPDATE cities SET balance = balance + $1 WHERE user_id = $2 RETURNING balance`,
      [amount, userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    // Record transaction
    await query(
      `INSERT INTO transactions (user_id, type, amount, description)
       VALUES ($1, 'addition', $2, $3)`,
      [userId, amount, description]
    );
    
    return {
      new_balance: parseFloat(result.rows[0].balance),
      amount_added: amount,
    };
  } catch (error) {
    console.error('Error adding user balance:', error);
    throw error;
  }
}

/**
 * Get user transaction history
 */
export async function getUserTransactions(userId, limit = 50, offset = 0) {
  try {
    const result = await query(
      `SELECT * FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    const countRes = await query(
      `SELECT COUNT(*) as total FROM transactions WHERE user_id = $1`,
      [userId]
    );
    
    return {
      transactions: result.rows,
      total: parseInt(countRes.rows[0].total),
    };
  } catch (error) {
    console.error('Error getting user transactions:', error);
    throw error;
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(userId) {
  try {
    // Total profit
    const profitRes = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM profit_history WHERE user_id = $1`,
      [userId]
    );
    
    // Daily average
    const dailyRes = await query(
      `SELECT COALESCE(AVG(daily_profit), 0) as avg_daily FROM (
        SELECT DATE(payout_time) as day, SUM(amount) as daily_profit
        FROM profit_history
        WHERE user_id = $1 AND payout_time > NOW() - INTERVAL '30 days'
        GROUP BY day
      ) daily_stats`,
      [userId]
    );
    
    // Active referrals
    const activeRefRes = await query(
      `SELECT COUNT(*) as count FROM referrals
       WHERE referrer_user_id = $1`,
      [userId]
    );
    
    // Factory status
    const factoryRes = await query(
      `SELECT f.is_active, f.expires_at FROM factories f
       JOIN cities c ON f.city_id = c.id
       WHERE c.user_id = $1
       LIMIT 1`,
      [userId]
    );
    
    return {
      total_earned: parseFloat(profitRes.rows[0].total),
      daily_average: parseFloat(dailyRes.rows[0].avg_daily),
      active_referrals: parseInt(activeRefRes.rows[0].count),
      factory_active: factoryRes.rows[0]?.is_active || false,
      factory_expires_at: factoryRes.rows[0]?.expires_at || null,
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
}
