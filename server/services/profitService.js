import { query } from '../db.js';

// Profit distribution by level
const PROFIT_CONFIG = {
  1: { count: 3, profit_per_player: 4.0, percentage: 40 },
  2: { count: 9, profit_per_player: 2.5, percentage: 25 },
  3: { count: 27, profit_per_player: 1.7, percentage: 17 },
  4: { count: 81, profit_per_player: 1.0, percentage: 10 },
  5: { count: 243, profit_per_player: 0.5, percentage: 5 },
};

const DAILY_FACTORY_COST = 10; // Stars per 24 hours
const FACTORY_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const PAYOUT_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds (1/24 of daily)

/**
 * Get the referral chain/tree for a user
 * Returns hierarchy of referred users with their levels
 */
export async function getUserReferralTree(userId) {
  try {
    const result = await query(
      `WITH RECURSIVE referral_tree AS (
        SELECT 
          referred_user_id as user_id,
          1 as level,
          referrer_user_id as parent_id
        FROM referrals
        WHERE referrer_user_id = $1
        
        UNION ALL
        
        SELECT 
          r.referred_user_id as user_id,
          rt.level + 1 as level,
          r.referrer_user_id as parent_id
        FROM referrals r
        JOIN referral_tree rt ON r.referrer_user_id = rt.user_id
        WHERE rt.level < 5
      )
      SELECT user_id, level, parent_id FROM referral_tree
      ORDER BY level, user_id`,
      [userId]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting referral tree:', error);
    throw error;
  }
}

/**
 * Calculate and distribute profit from a factory
 */
export async function distributeProfitFromFactory(factoryId) {
  const client = await query();
  
  try {
    // Get factory and city information
    const factoryRes = await client.query(
      `SELECT f.id, f.city_id, c.user_id, f.last_payout_time
       FROM factories f
       JOIN cities c ON f.city_id = c.id
       WHERE f.id = $1 AND f.is_active = true`,
      [factoryId]
    );
    
    if (factoryRes.rows.length === 0) {
      return { distributed: false, reason: 'Factory not found or inactive' };
    }
    
    const factory = factoryRes.rows[0];
    const now = new Date();
    const lastPayout = factory.last_payout_time ? new Date(factory.last_payout_time) : factory.created_at;
    
    // Check if enough time has passed (hourly distribution)
    if (now - new Date(lastPayout) < PAYOUT_INTERVAL) {
      return { distributed: false, reason: 'Payout interval not reached' };
    }
    
    // Get the factory owner's referral chain
    const referralTree = await getUserReferralTree(factory.user_id);
    
    const distributions = [];
    
    // Group referred users by level
    for (const level of Object.keys(PROFIT_CONFIG).map(Number).sort((a, b) => a - b)) {
      const config = PROFIT_CONFIG[level];
      const usersAtLevel = referralTree.filter(r => r.level === level);
      
      for (const user of usersAtLevel) {
        const profitAmount = config.profit_per_player / 24; // 1/24 of daily profit per hour
        
        distributions.push({
          user_id: user.user_id,
          amount: profitAmount,
          level,
          factory_id: factoryId,
          source_user_id: factory.user_id,
        });
      }
    }
    
    // Insert all profit distributions
    for (const dist of distributions) {
      await client.query(
        `INSERT INTO profit_history (user_id, source_user_id, amount, level, factory_id, payout_time)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [dist.user_id, dist.source_user_id, dist.amount, dist.level, dist.factory_id, now]
      );
      
      // Update user balance
      await client.query(
        `UPDATE users SET balance = balance + $1 WHERE telegram_id = $2`,
        [dist.amount, dist.user_id]
      );
    }
    
    // Update factory last payout time
    await client.query(
      `UPDATE factories SET last_payout_time = $1 WHERE id = $2`,
      [now, factoryId]
    );
    
    return {
      distributed: true,
      factory_id: factoryId,
      total_users_paid: distributions.length,
      total_amount_distributed: distributions.reduce((sum, d) => sum + d.amount, 0),
    };
  } catch (error) {
    console.error('Error distributing profit:', error);
    throw error;
  }
}

/**
 * Calculate user's depth/city level based on referral count
 */
export function calculateCityLevel(referralCount) {
  if (referralCount < 15) return 1;
  if (referralCount < 35) return 2;
  if (referralCount < 70) return 3;
  if (referralCount < 100) return 4;
  return 5;
}

/**
 * Get profit summary for a user
 */
export async function getUserProfitSummary(userId) {
  try {
    const hourlyRes = await query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM profit_history
       WHERE user_id = $1 AND payout_time > NOW() - INTERVAL '1 hour'`,
      [userId]
    );
    
    const dailyRes = await query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM profit_history
       WHERE user_id = $1 AND payout_time > NOW() - INTERVAL '1 day'`,
      [userId]
    );
    
    const weeklyRes = await query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM profit_history
       WHERE user_id = $1 AND payout_time > NOW() - INTERVAL '7 days'`,
      [userId]
    );
    
    return {
      hourly: parseFloat(hourlyRes.rows[0].total),
      daily: parseFloat(dailyRes.rows[0].total),
      weekly: parseFloat(weeklyRes.rows[0].total),
    };
  } catch (error) {
    console.error('Error getting profit summary:', error);
    throw error;
  }
}

export const DAILY_FACTORY_COST_STARS = DAILY_FACTORY_COST;
export const FACTORY_DURATION_MS = FACTORY_DURATION;
export const PAYOUT_INTERVAL_MS = PAYOUT_INTERVAL;
