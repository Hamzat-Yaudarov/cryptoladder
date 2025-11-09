import pool from '../db/connection.js';
import { addStars, getUserById, getHierarchy } from './userService.js';

const STAR_DISTRIBUTION = {
  1: 0.35,
  2: 0.21,
  3: 0.14,
  4: 0.08,
  5: 0.04
};

export async function canActivate(userId) {
  const user = await getUserById(userId);
  if (!user || !user.has_bought_place) {
    return { canActivate: false, reason: 'No place bought' };
  }

  const lastActivation = await pool.query(
    `SELECT * FROM activations
     WHERE user_id = $1 AND is_active = TRUE
     ORDER BY activated_at DESC
     LIMIT 1`,
    [userId]
  );

  if (lastActivation.rows.length > 0) {
    const expiresAt = new Date(lastActivation.rows[0].expires_at);
    if (expiresAt > new Date()) {
      return { canActivate: false, reason: 'Already active' };
    }
  }

  return { canActivate: true };
}

export async function getActivationStatus(userId) {
  const result = await pool.query(
    `SELECT * FROM activations
     WHERE user_id = $1 AND is_active = TRUE
     ORDER BY activated_at DESC
     LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return { isActive: false };
  }

  const activation = result.rows[0];
  const now = new Date();
  const expiresAt = new Date(activation.expires_at);
  const isActive = expiresAt > now;

  if (!isActive) {
    await pool.query(
      'UPDATE activations SET is_active = FALSE WHERE id = $1',
      [activation.id]
    );
  }

  return {
    isActive,
    expiresAt: activation.expires_at,
    activatedAt: activation.activated_at
  };
}

export async function activate(userId) {
  const { canActivate: can } = await canActivate(userId);
  if (!can) {
    throw new Error('Cannot activate at this time');
  }

  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  if (user.stars < 10) throw new Error('Insufficient stars');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Deduct activation cost
    await client.query(
      'UPDATE users SET stars = stars - 10 WHERE id = $1',
      [userId]
    );

    // Create activation record
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await client.query(
      `INSERT INTO activations (user_id, activated_at, expires_at, is_active)
       VALUES ($1, CURRENT_TIMESTAMP, $2, TRUE)`,
      [userId, expiresAt]
    );

    // Distribute stars to hierarchy
    await distributeStars(client, userId);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function distributeStars(client, userId) {
  const user = await getUserById(userId);
  const distribution = 5; // 10 stars - 5 stars to distribute

  // Get user's hierarchy
  const hierarchy = await getHierarchy(user.id, 5);
  const path = [];

  // Build path to root
  let currentId = user.id;
  while (currentId) {
    const current = await getUserById(currentId);
    path.push(current);
    currentId = current.parent_id;
  }

  path.reverse();

  // Distribute stars to ancestors
  let remaining = distribution;
  let creatorEarnings = 0;

  for (let level = 1; level <= 5; level++) {
    if (level >= path.length) break;

    const ancestor = path[path.length - level - 1];
    if (!ancestor) break;

    // Check if ancestor is active
    const activation = await client.query(
      `SELECT * FROM activations
       WHERE user_id = $1 AND is_active = TRUE AND expires_at > CURRENT_TIMESTAMP`,
      [ancestor.id]
    );

    if (activation.rows.length === 0) continue;

    const starAmount = distribution * STAR_DISTRIBUTION[level];
    remaining -= starAmount;

    await client.query(
      `UPDATE users SET stars = stars + $1 WHERE id = $2`,
      [starAmount, ancestor.id]
    );

    await client.query(
      `INSERT INTO star_transactions (user_id, amount, type, source_user_id, level)
       VALUES ($1, $2, 'activation_income', $3, $4)`,
      [ancestor.id, starAmount, userId, level]
    );
  }

  creatorEarnings = remaining;
  const creator = path[0];
  if (creator) {
    await client.query(
      `UPDATE users SET stars = stars + $1 WHERE id = $2`,
      [creatorEarnings, creator.id]
    );

    await client.query(
      `INSERT INTO star_transactions (user_id, amount, type, source_user_id, level)
       VALUES ($1, $2, 'creator_income', $3, NULL)`,
      [creator.id, creatorEarnings, userId]
    );
  }
}

export async function giveReferralBonus(inviterId, invitedId) {
  const referralCount = await pool.query(
    'SELECT COUNT(*) as count FROM activations WHERE user_id = $1 AND is_active = TRUE',
    [invitedId]
  );

  // Only give bonus on first activation
  if (parseInt(referralCount.rows[0].count) === 1) {
    await addStars(inviterId, 0.5, 'referral_bonus', invitedId, null);
  }
}

export async function checkInactivity() {
  const users = await pool.query(
    `SELECT id, last_activation FROM users
     WHERE has_bought_place = TRUE`
  );

  for (const user of users.rows) {
    if (!user.last_activation) {
      await pool.query(
        'UPDATE users SET inactive_days = 3 WHERE id = $1',
        [user.id]
      );
      continue;
    }

    const daysSinceActivation = Math.floor(
      (Date.now() - new Date(user.last_activation)) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActivation > 3) {
      await pool.query(
        'UPDATE users SET inactive_days = $1 WHERE id = $2',
        [daysSinceActivation, user.id]
      );
    } else {
      await pool.query(
        'UPDATE users SET inactive_days = 0 WHERE id = $1',
        [user.id]
      );
    }
  }
}
