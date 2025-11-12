import { query } from '../db.js';

const REFERRAL_BONUS = 0.5; // Stars for first factory activation

/**
 * Join a city via referral code
 */
export async function joinCityViaReferral(newUserId, referralCode) {
  try {
    // Find the city with this referral code
    const cityRes = await query(
      `SELECT id, user_id FROM cities WHERE referral_code = $1`,
      [referralCode]
    );
    
    if (cityRes.rows.length === 0) {
      throw new Error('Invalid referral code');
    }
    
    const city = cityRes.rows[0];
    const referrerId = city.user_id;
    
    // Check if already a resident
    const existingRes = await query(
      `SELECT COUNT(*) as count FROM referrals 
       WHERE referrer_user_id = $1 AND referred_user_id = $2`,
      [referrerId, newUserId]
    );
    
    if (existingRes.rows[0].count > 0) {
      return {
        success: false,
        error: 'Already a resident of this city',
      };
    }
    
    await query(`BEGIN`);
    
    try {
      // Find the first available house
      const houseRes = await query(
        `SELECT id, level FROM houses 
         WHERE city_id = $1 AND resident_user_id IS NULL
         ORDER BY level
         LIMIT 1`,
        [city.id]
      );
      
      let houseLevel = 1;
      if (houseRes.rows.length > 0) {
        const house = houseRes.rows[0];
        houseLevel = house.level;
        
        // Assign resident to house
        await query(
          `UPDATE houses SET resident_user_id = $1 WHERE id = $2`,
          [newUserId, house.id]
        );
      }
      
      // Create referral record
      await query(
        `INSERT INTO referrals (referrer_user_id, referred_user_id, house_level)
         VALUES ($1, $2, $3)`,
        [referrerId, newUserId, houseLevel]
      );
      
      await query(`COMMIT`);
      
      return {
        success: true,
        referrer_id: referrerId,
        house_level: houseLevel,
        city_id: city.id,
      };
    } catch (error) {
      await query(`ROLLBACK`);
      throw error;
    }
  } catch (error) {
    console.error('Error joining city via referral:', error);
    throw error;
  }
}

/**
 * Get all referrals for a user
 */
export async function getUserReferrals(userId) {
  try {
    const result = await query(
      `SELECT 
        r.id,
        r.referred_user_id,
        u.first_name,
        u.username,
        r.house_level,
        r.bonus_claimed,
        r.created_at,
        c.balance,
        c.is_factory_active
       FROM referrals r
       JOIN users u ON r.referred_user_id = u.telegram_id
       LEFT JOIN cities c ON u.telegram_id = c.user_id
       WHERE r.referrer_user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting user referrals:', error);
    throw error;
  }
}

/**
 * Claim bonus for a referral's first factory activation
 */
export async function claimReferralBonus(referralId, userId) {
  try {
    // Verify this bonus belongs to the user
    const refRes = await query(
      `SELECT r.*, c.user_id as city_owner
       FROM referrals r
       JOIN cities c ON r.referrer_user_id = c.user_id
       WHERE r.id = $1`,
      [referralId]
    );
    
    if (refRes.rows.length === 0) {
      throw new Error('Referral not found');
    }
    
    const referral = refRes.rows[0];
    
    if (referral.city_owner !== userId) {
      throw new Error('Unauthorized');
    }
    
    if (referral.bonus_claimed) {
      return {
        success: false,
        error: 'Bonus already claimed',
      };
    }
    
    // Update bonus status and user balance
    await query(
      `BEGIN`
    );
    
    try {
      await query(
        `UPDATE referrals SET bonus_claimed = true WHERE id = $1`,
        [referralId]
      );
      
      await query(
        `UPDATE cities SET balance = balance + $1 WHERE user_id = $2`,
        [REFERRAL_BONUS, userId]
      );
      
      // Record transaction
      await query(
        `INSERT INTO transactions (user_id, type, amount, description)
         VALUES ($1, 'referral_bonus', $2, 'Bonus for referral activation')`,
        [userId, REFERRAL_BONUS]
      );
      
      await query(`COMMIT`);
      
      return {
        success: true,
        bonus_amount: REFERRAL_BONUS,
      };
    } catch (error) {
      await query(`ROLLBACK`);
      throw error;
    }
  } catch (error) {
    console.error('Error claiming referral bonus:', error);
    throw error;
  }
}

/**
 * Get weekly ranking data
 */
export async function getWeeklyRankings() {
  try {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const result = await query(
      `SELECT 
        wr.rank,
        wr.reward_claimed,
        u.telegram_id,
        u.first_name,
        u.username,
        COUNT(r.id) as referral_count
       FROM users u
       LEFT JOIN referrals r ON u.telegram_id = r.referrer_user_id 
         AND r.created_at >= $1
       LEFT JOIN weekly_rankings wr ON u.telegram_id = wr.user_id 
         AND wr.week_starting = $1
       GROUP BY u.telegram_id, wr.rank, wr.reward_claimed
       HAVING COUNT(r.id) > 0
       ORDER BY referral_count DESC
       LIMIT 10`,
      [weekStart]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting weekly rankings:', error);
    throw error;
  }
}

/**
 * Distribute weekly ranking rewards
 */
export async function distributeWeeklyRewards() {
  try {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const rewards = [
      { rank: 1, amount: 100 },
      { rank: 2, amount: 75 },
      { rank: 3, amount: 50 },
      { rank: 4, amount: 25 },
      { rank: 5, amount: 15 },
    ];
    
    // Get current rankings
    const rankingsRes = await query(
      `SELECT 
        u.telegram_id,
        COUNT(r.id) as referral_count,
        ROW_NUMBER() OVER (ORDER BY COUNT(r.id) DESC) as rank
       FROM users u
       JOIN referrals r ON u.telegram_id = r.referrer_user_id 
       WHERE r.created_at >= $1
       GROUP BY u.telegram_id
       ORDER BY rank
       LIMIT 5`,
      [weekStart]
    );
    
    for (const ranking of rankingsRes.rows) {
      const reward = rewards.find(r => r.rank === ranking.rank);
      
      if (reward) {
        await query(
          `BEGIN`
        );
        
        try {
          // Check if already claimed
          const claimedRes = await query(
            `SELECT id FROM weekly_rankings 
             WHERE user_id = $1 AND week_starting = $2 AND reward_claimed = true`,
            [ranking.telegram_id, weekStart]
          );
          
          if (claimedRes.rows.length === 0) {
            // Award the prize
            await query(
              `UPDATE cities SET balance = balance + $1 WHERE user_id = $2`,
              [reward.amount, ranking.telegram_id]
            );
            
            // Mark as claimed
            await query(
              `INSERT INTO weekly_rankings (user_id, week_starting, referral_count, rank, reward_claimed)
               VALUES ($1, $2, $3, $4, true)
               ON CONFLICT (user_id, week_starting) DO UPDATE
               SET reward_claimed = true, rank = $4`,
              [ranking.telegram_id, weekStart, ranking.referral_count, ranking.rank]
            );
            
            // Record transaction
            await query(
              `INSERT INTO transactions (user_id, type, amount, description)
               VALUES ($1, 'weekly_ranking_reward', $2, $3)`,
              [ranking.telegram_id, reward.amount, `Weekly Ranking Reward - Rank ${ranking.rank}`]
            );
          }
          
          await query(`COMMIT`);
        } catch (error) {
          await query(`ROLLBACK`);
          throw error;
        }
      }
    }
    
    return rankingsRes.rows;
  } catch (error) {
    console.error('Error distributing weekly rewards:', error);
    throw error;
  }
}

export const REFERRAL_BONUS_STARS = REFERRAL_BONUS;
