import { query } from '../db/client.js';

export async function getOrCreateUser(telegramId, options = {}) {
  try {
    let user = await query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );

    if (user.rows.length > 0) {
      return user.rows[0];
    }

    const { username = '', firstName = '', referrerId = null } = options;

    const result = await query(
      `INSERT INTO users (telegram_id, username, first_name, referrer_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [telegramId, username, firstName, referrerId]
    );

    const newUser = result.rows[0];

    // Create city for new user
    const cityResult = await query(
      `INSERT INTO cities (user_id, level, houses, balance)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [newUser.id, 2, 2, 0.00]
    );

    const cityId = cityResult.rows[0].id;

    // Create factory for new user
    await query(
      `INSERT INTO factories (city_id, is_active)
       VALUES ($1, $2)`,
      [cityId, false]
    );

    // Record referral if applicable
    if (referrerId) {
      try {
        const referrerUser = await query(
          'SELECT id FROM users WHERE telegram_id = $1',
          [referrerId]
        );

        if (referrerUser.rows.length > 0) {
          const referrerUserId = referrerUser.rows[0].id;

          await query(
            `INSERT INTO referrals (referrer_id, referred_id, level)
             VALUES ($1, $2, 1)
             ON CONFLICT DO NOTHING`,
            [referrerUserId, newUser.id]
          );
        }
      } catch (err) {
        console.error('Error recording referral:', err);
      }
    }

    return newUser;
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw error;
  }
}

export async function getUserById(userId) {
  try {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error in getUserById:', error);
    throw error;
  }
}

export async function getUserByTelegramId(telegramId) {
  try {
    const result = await query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error in getUserByTelegramId:', error);
    throw error;
  }
}

export async function getUserWithCity(userId) {
  try {
    const result = await query(
      `SELECT u.*, c.id as city_id, c.level, c.houses, c.balance
       FROM users u
       LEFT JOIN cities c ON u.id = c.user_id
       WHERE u.id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error in getUserWithCity:', error);
    throw error;
  }
}
