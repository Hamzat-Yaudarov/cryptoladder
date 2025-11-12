import { query } from '../database/client.js';
import { v4 as uuidv4 } from 'uuid';

export async function createOrUpdateUser(telegramId, userData) {
  const { username, first_name, last_name } = userData;
  
  const result = await query(
    `INSERT INTO users (telegram_id, username, first_name, last_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (telegram_id) DO UPDATE SET
       username = COALESCE($2, users.username),
       first_name = COALESCE($3, users.first_name),
       last_name = COALESCE($4, users.last_name),
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [telegramId, username, first_name, last_name]
  );
  
  return result.rows[0];
}

export async function getUser(telegramId) {
  const result = await query(
    'SELECT * FROM users WHERE telegram_id = $1',
    [telegramId]
  );
  
  return result.rows[0];
}

export async function getUserWithCity(telegramId) {
  const result = await query(
    `SELECT u.*, c.houses, c.factory_count, c.created_at as city_created_at
     FROM users u
     LEFT JOIN cities c ON u.telegram_id = c.user_id
     WHERE u.telegram_id = $1`,
    [telegramId]
  );
  
  return result.rows[0];
}

export async function updateBalance(telegramId, amount) {
  const result = await query(
    `UPDATE users SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
     WHERE telegram_id = $2
     RETURNING balance`,
    [amount, telegramId]
  );
  
  return result.rows[0]?.balance || 0;
}

export async function addReferral(telegramId, referrerId) {
  const result = await query(
    `UPDATE users SET 
      total_referrals = total_referrals + 1,
      referrer_id = $1,
      updated_at = CURRENT_TIMESTAMP
     WHERE telegram_id = $2
     RETURNING total_referrals`,
    [referrerId, telegramId]
  );
  
  return result.rows[0];
}

export async function getReferralCount(telegramId) {
  const result = await query(
    'SELECT total_referrals FROM users WHERE telegram_id = $1',
    [telegramId]
  );
  
  return result.rows[0]?.total_referrals || 0;
}

export async function getUserStats(telegramId) {
  const result = await query(
    `SELECT 
      u.telegram_id,
      u.username,
      u.balance,
      u.total_referrals,
      u.is_city_active,
      u.city_level,
      u.created_at,
      c.houses,
      c.factory_count,
      (SELECT COUNT(*) FROM residents WHERE city_owner_id = u.telegram_id) as current_residents,
      (SELECT COUNT(*) FROM factories WHERE owner_id = u.telegram_id AND is_active = true) as active_factories
     FROM users u
     LEFT JOIN cities c ON u.telegram_id = c.user_id
     WHERE u.telegram_id = $1`,
    [telegramId]
  );
  
  return result.rows[0];
}
