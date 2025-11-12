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

export async function addReferral(telegramId, referrerCandidateId) {
  // Place the new user under the referrerCandidate using breadth-first search
  // to find the first node with less than 3 direct children.
  const candidate = referrerCandidateId ? referrerCandidateId.toString() : null;
  if (!candidate) {
    // No referrer provided
    return null;
  }

  const queue = [candidate];
  let actualReferrer = null;

  while (queue.length > 0) {
    const current = queue.shift();
    // Count direct children
    const countRes = await query(
      'SELECT COUNT(*) as count FROM users WHERE referrer_id = $1',
      [current]
    );
    const cnt = parseInt(countRes.rows[0].count, 10) || 0;
    if (cnt < 3) {
      actualReferrer = current;
      break;
    }

    // Enqueue children
    const childrenRes = await query(
      'SELECT telegram_id FROM users WHERE referrer_id = $1 ORDER BY created_at ASC',
      [current]
    );
    for (const r of childrenRes.rows) {
      queue.push(r.telegram_id.toString());
    }
  }

  if (!actualReferrer) {
    // fallback to original candidate
    actualReferrer = candidate;
  }

  // Update new user's referrer
  await query(
    'UPDATE users SET referrer_id = $1, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = $2',
    [actualReferrer, telegramId]
  );

  // Increment total_referrals for the actual referrer
  await query(
    'UPDATE users SET total_referrals = total_referrals + 1, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = $1',
    [actualReferrer]
  );

  return actualReferrer;
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
