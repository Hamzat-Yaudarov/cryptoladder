import { query } from '../db.js';

const ACTIVATION_COST = 10;
const PURCHASE_COST = 3;
const REFERRAL_BONUS = 0.5;

const DISTRIBUTION_LEVELS = {
  1: 0.35,
  2: 0.21,
  3: 0.14,
  4: 0.08,
  5: 0.04,
};

export async function activateUser(userId) {
  try {
    // Проверка бал��нса пользователя
    const user = await query(
      'SELECT balance FROM users WHERE id = $1',
      [userId]
    );

    if (user.rows.length === 0) {
      throw new Error('Пользователь не найден');
    }

    const userBalance = parseFloat(user.rows[0].balance || 0);
    if (userBalance < ACTIVATION_COST) {
      throw new Error('Недостаточно звёзд для активации');
    }

    // Проверка активации сегодня
    const todayActivation = await query(
      'SELECT id FROM activations WHERE user_id = $1 AND DATE(activation_date) = CURRENT_DATE',
      [userId]
    );

    if (todayActivation.rows.length > 0) {
      throw new Error('Вы уже активировались сегодня');
    }

    // Create activation record
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 1);

    await query(
      `INSERT INTO activations (user_id, activation_date, expiry_date, stars_spent)
       VALUES ($1, CURRENT_TIMESTAMP, $2, $3)`,
      [userId, expiry, ACTIVATION_COST]
    );

    // Deduct cost from balance
    await query(
      'UPDATE users SET balance = balance - $1, last_activation = CURRENT_TIMESTAMP WHERE id = $2',
      [ACTIVATION_COST, userId]
    );

    // Distribute earnings to upline
    await distributeEarnings(userId);

    // Process referral bonus (additional, not deducted from activation pool)
    try {
      // Find referrer
      const refRow = await query(
        `SELECT referrer_id FROM referrals WHERE referred_id = $1 LIMIT 1`,
        [userId]
      );
      if (refRow.rows.length > 0) {
        const referrerId = refRow.rows[0].referrer_id;
        if (referrerId) {
          await claimReferralBonus(referrerId, userId);
        }
      }
    } catch (err) {
      console.warn('Ошибка при начислении реферального бонуса:', err.message);
    }

    return { success: true, activationCost: ACTIVATION_COST };
  } catch (error) {
    console.error('Ошибка при активации пользователя:', error);
    throw error;
  }
}

async function distributeEarnings(userId) {
  try {
    // Get user's upline (parents) with depth where depth=1 is immediate parent
    const upline = await query(
      `WITH RECURSIVE upline AS (
        SELECT id, parent_id, 0 as depth
        FROM users
        WHERE id = $1

        UNION ALL

        SELECT u.id, u.parent_id, up.depth + 1
        FROM users u
        INNER JOIN upline up ON u.id = up.parent_id
        WHERE up.depth < 5
      )
      SELECT id, parent_id, depth FROM upline WHERE depth > 0 ORDER BY depth`,
      [userId]
    );

    const uplineUsers = upline.rows;
    let totalDistributed = 0;
    const distributionAmount = ACTIVATION_COST; // distribute full activation cost

    // Distribute to each level
    for (let i = 0; i < uplineUsers.length && i < 5; i++) {
      const level = uplineUsers[i].depth; // 1 = immediate parent
      const uplineUserId = uplineUsers[i].id;
      const percentage = DISTRIBUTION_LEVELS[level] || 0;
      const amount = parseFloat((distributionAmount * percentage).toFixed(2));

      if (amount > 0) {
        // Check if upline user is active
        const isActive = await query(
          `SELECT 1 FROM activations 
           WHERE user_id = $1 AND expiry_date > CURRENT_TIMESTAMP`,
          [uplineUserId]
        );

        if (isActive.rows.length > 0) {
          await query(
            `UPDATE users SET balance = balance + $1 WHERE id = $2`,
            [amount, uplineUserId]
          );

          await query(
            `INSERT INTO earnings (user_id, earned_from_id, level, amount, type)
             VALUES ($1, $2, $3, $4, 'activation')`,
            [uplineUserId, userId, level, amount]
          );

          totalDistributed += amount;
        }
      }
    }

    // Remaining goes to creator
    const creatorAmount = parseFloat((distributionAmount - totalDistributed).toFixed(2));
    const creatorId = 1; // creator is user with id 1

    if (creatorAmount > 0) {
      await query(
        `UPDATE users SET balance = balance + $1 WHERE id = $2`,
        [creatorAmount, creatorId]
      );

      await query(
        `INSERT INTO earnings (user_id, earned_from_id, level, amount, type)
         VALUES ($1, $2, $3, $4, 'system')`,
        [creatorId, userId, 0, creatorAmount]
      );
    }

  } catch (error) {
    console.error('Ошибка при распределении доходов:', error);
    throw error;
  }
}

export async function claimReferralBonus(referrerId, referredId) {
  try {
    // Check if referral exists and bonus hasn't been claimed
    const referral = await query(
      `SELECT * FROM referrals 
       WHERE referrer_id = $1 AND referred_id = $2 AND is_first_activation_bonus_claimed = FALSE`,
      [referrerId, referredId]
    );

    if (referral.rows.length === 0) {
      return { success: false, message: 'Бонус уже получен или реферал не найден' };
    }

    // Add bonus to referrer balance
    await query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2',
      [REFERRAL_BONUS, referrerId]
    );

    // Mark bonus as claimed
    await query(
      'UPDATE referrals SET is_first_activation_bonus_claimed = TRUE WHERE referrer_id = $1 AND referred_id = $2',
      [referrerId, referredId]
    );

    // Record earning
    await query(
      `INSERT INTO earnings (user_id, earned_from_id, level, amount, type)
       VALUES ($1, $2, $3, $4, 'referral_bonus')`,
      [referrerId, referredId, 0, REFERRAL_BONUS]
    );

    return { success: true, bonus: REFERRAL_BONUS };
  } catch (error) {
    console.error('Ошибка при получении реферального бонуса:', error);
    throw error;
  }
}

export async function buyPlace(userId) {
  try {
    // Check if user has enough balance
    const user = await query(
      'SELECT balance FROM users WHERE id = $1',
      [userId]
    );

    if (user.rows.length === 0) {
      throw new Error('Пользователь не найден');
    }

    const userBalance = parseFloat(user.rows[0].balance || 0);
    if (userBalance < PURCHASE_COST) {
      throw new Error('Недостаточно звёзд для покупки');
    }

    // Deduct cost from balance (100% goes to creator)
    await query(
      'UPDATE users SET balance = balance - $1 WHERE id = $2',
      [PURCHASE_COST, userId]
    );

    // Add to creator balance (assume creator is user 1)
    const creatorId = 1;
    await query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2',
      [PURCHASE_COST, creatorId]
    );

    // Record purchase
    await query(
      'INSERT INTO purchases (user_id, stars_spent) VALUES ($1, $2)',
      [userId, PURCHASE_COST]
    );

    return { success: true, purchaseCost: PURCHASE_COST };
  } catch (error) {
    console.error('Ошибка при покупке места:', error);
    throw error;
  }
}

export async function getEarningsStats(userId) {
  try {
    const stats = await query(
      `SELECT 
        type,
        level,
        COUNT(*) as count,
        SUM(amount) as total
       FROM earnings
       WHERE user_id = $1
       GROUP BY type, level
       ORDER BY level`,
      [userId]
    );

    const byLevel = await query(
      `SELECT 
        level,
        SUM(amount) as total
       FROM earnings
       WHERE user_id = $1 AND level > 0
       GROUP BY level
       ORDER BY level`,
      [userId]
    );

    const referralStats = await query(
      `SELECT 
        COUNT(*) as total_referrals,
        SUM(CASE WHEN is_first_activation_bonus_claimed THEN 1 ELSE 0 END) as active_referrals
       FROM referrals
       WHERE referrer_id = $1`,
      [userId]
    );

    return {
      earnings: stats.rows,
      byLevel: byLevel.rows,
      referrals: referralStats.rows[0] || { total_referrals: 0, active_referrals: 0 },
    };
  } catch (error) {
    console.error('Ошибка при получении статистики доходов:', error);
    throw error;
  }
}

export function getMaxLevelsForUser(referralCount) {
  if (referralCount >= 70) return 5;
  if (referralCount >= 35) return 4;
  if (referralCount >= 15) return 3;
  return 2;
}
