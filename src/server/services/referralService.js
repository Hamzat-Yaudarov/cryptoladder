import { query } from '../db/client.js';

const FACTORY_ACTIVATION_BONUS = 0.5;

export async function getReferrals(userId) {
  try {
    const result = await query(
      `SELECT r.*, u.username, u.first_name, u.telegram_id, c.balance, f.is_active
       FROM referrals r
       JOIN users u ON r.referred_id = u.id
       LEFT JOIN cities c ON u.id = c.user_id
       LEFT JOIN factories f ON c.id = f.city_id
       WHERE r.referrer_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error in getReferrals:', error);
    throw error;
  }
}

export async function getReferralCount(userId) {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error('Error in getReferralCount:', error);
    throw error;
  }
}

export async function addReferral(referrerId, referredId) {
  try {
    // Calculate depth level
    const depthResult = await query(
      `WITH RECURSIVE referral_chain AS (
        SELECT id, referrer_id, 1 as depth
        FROM users
        WHERE id = $1
        UNION ALL
        SELECT u.id, u.referrer_id, rc.depth + 1
        FROM users u
        JOIN referral_chain rc ON u.id = rc.referrer_id
        WHERE rc.depth < 5
      )
      SELECT MAX(depth) as max_depth FROM referral_chain`,
      [referredId]
    );

    const level = Math.min(
      parseInt(depthResult.rows[0].max_depth || '1', 10) + 1,
      5
    );

    const result = await query(
      `INSERT INTO referrals (referrer_id, referred_id, level)
       VALUES ($1, $2, $3)
       ON CONFLICT (referrer_id, referred_id) DO UPDATE SET level = $3
       RETURNING *`,
      [referrerId, referredId, level]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error in addReferral:', error);
    throw error;
  }
}

export async function claimFactoryBonusForReferral(referrerId, referredId) {
  try {
    // Check if bonus already claimed
    const result = await query(
      `SELECT activated_factory_bonus_claimed FROM referrals
       WHERE referrer_id = $1 AND referred_id = $2`,
      [referrerId, referredId]
    );

    if (result.rows.length === 0) {
      throw new Error('Referral not found');
    }

    if (result.rows[0].activated_factory_bonus_claimed) {
      throw new Error('Bonus already claimed');
    }

    // Add bonus to referrer's balance
    await query(
      `UPDATE cities
       SET balance = balance + $1
       WHERE user_id = $2`,
      [FACTORY_ACTIVATION_BONUS, referrerId]
    );

    // Mark bonus as claimed
    await query(
      `UPDATE referrals
       SET activated_factory_bonus_claimed = TRUE
       WHERE referrer_id = $1 AND referred_id = $2`,
      [referrerId, referredId]
    );

    // Record transaction
    await query(
      `INSERT INTO transactions (user_id, type, amount, description, source_user_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        referrerId,
        'referral_bonus',
        FACTORY_ACTIVATION_BONUS,
        'Bonus for referral activation',
        referredId,
      ]
    );

    return FACTORY_ACTIVATION_BONUS;
  } catch (error) {
    console.error('Error in claimFactoryBonusForReferral:', error);
    throw error;
  }
}

export async function generateReferralLink(userId, telegramId) {
  return `https://t.me/cryptoladderbot/miniapp?startapp=ref_${telegramId}`;
}
