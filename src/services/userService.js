import pool from '../db/connection.js';

export async function getOrCreateUser(telegramId, userData) {
  const existingUser = await pool.query(
    'SELECT * FROM users WHERE telegram_id = $1',
    [telegramId]
  );

  if (existingUser.rows.length > 0) {
    return existingUser.rows[0];
  }

  const result = await pool.query(
    `INSERT INTO users (telegram_id, username, first_name, last_name)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [telegramId, userData.username || null, userData.first_name || '', userData.last_name || '']
  );

  return result.rows[0];
}

export async function getUserById(userId) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  return result.rows[0];
}

export async function getUserByTelegramId(telegramId) {
  const result = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
  return result.rows[0];
}

export async function findAvailableParentPosition() {
  const result = await pool.query(
    `SELECT u.id, u.parent_id, 
            COUNT(c.id) as child_count
     FROM users u
     LEFT JOIN users c ON c.parent_id = u.id
     WHERE u.has_bought_place = TRUE
     GROUP BY u.id, u.parent_id
     HAVING COUNT(c.id) < 3
     ORDER BY u.created_at ASC
     LIMIT 1`
  );

  if (result.rows.length > 0) {
    return result.rows[0].id;
  }

  const rootUser = await pool.query(
    'SELECT id FROM users WHERE parent_id IS NULL AND has_bought_place = TRUE LIMIT 1'
  );

  return rootUser.rows.length > 0 ? rootUser.rows[0].id : null;
}

export async function buyPlace(userId, parentId = null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (parentId === null) {
      const existingRoot = await client.query(
        'SELECT id FROM users WHERE parent_id IS NULL AND has_bought_place = TRUE'
      );
      if (existingRoot.rows.length === 0) {
        await client.query(
          `UPDATE users SET has_bought_place = TRUE, parent_id = NULL
           WHERE id = $1`,
          [userId]
        );
      } else {
        parentId = await findAvailableParentPosition();
        await client.query(
          `UPDATE users SET has_bought_place = TRUE, parent_id = $1
           WHERE id = $2`,
          [parentId, userId]
        );
      }
    } else {
      await client.query(
        `UPDATE users SET has_bought_place = TRUE, parent_id = $1
         WHERE id = $2`,
        [parentId, userId]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getUserReferrals(userId) {
  const result = await pool.query(
    `SELECT u.* FROM users u
     INNER JOIN referrals r ON r.invited_id = u.id
     WHERE r.inviter_id = $1
     ORDER BY r.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function addReferral(inviterId, invitedId) {
  try {
    await pool.query(
      `INSERT INTO referrals (inviter_id, invited_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [inviterId, invitedId]
    );
  } catch (err) {
    console.log('Referral already exists');
  }
}

export async function getUserStats(userId) {
  const user = await getUserById(userId);
  const referralCount = await pool.query(
    'SELECT COUNT(*) as count FROM referrals WHERE inviter_id = $1',
    [userId]
  );
  const activeCount = await pool.query(
    `SELECT COUNT(*) as count FROM activations 
     WHERE user_id IN (
       SELECT invited_id FROM referrals WHERE inviter_id = $1
     ) AND is_active = TRUE`,
    [userId]
  );

  return {
    user,
    referralCount: parseInt(referralCount.rows[0].count),
    activeReferrals: parseInt(activeCount.rows[0].count)
  };
}

export async function getHierarchy(userId, depth = 5, currentDepth = 0) {
  if (currentDepth >= depth) return { user: await getUserById(userId), children: [] };

  const children = await pool.query(
    'SELECT * FROM users WHERE parent_id = $1 AND has_bought_place = TRUE',
    [userId]
  );

  const childHierarchies = await Promise.all(
    children.rows.map(child => getHierarchy(child.id, depth, currentDepth + 1))
  );

  return {
    user: await getUserById(userId),
    children: childHierarchies
  };
}

export async function getEarningHierarchy(userId, depth = 5) {
  const hierarchy = await getHierarchy(userId, depth);
  
  function countDepth(node, currentDepth = 0) {
    if (!node.children || node.children.length === 0) return currentDepth;
    return Math.max(...node.children.map(child => countDepth(child, currentDepth + 1)));
  }

  function getMaxAllowedDepth(referralCount) {
    if (referralCount < 15) return 2;
    if (referralCount < 35) return 3;
    if (referralCount < 70) return 4;
    return 5;
  }

  const referralCount = await pool.query(
    'SELECT COUNT(*) as count FROM referrals WHERE inviter_id = $1',
    [userId]
  );

  const maxDepth = getMaxAllowedDepth(parseInt(referralCount.rows[0].count));
  return { hierarchy, maxDepth };
}

export async function addStars(userId, amount, type, sourceUserId = null, level = null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE users SET stars = stars + $1 WHERE id = $2',
      [amount, userId]
    );

    await client.query(
      `INSERT INTO star_transactions (user_id, amount, type, source_user_id, level)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, amount, type, sourceUserId, level]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getStarTransactions(userId, limit = 50) {
  const result = await pool.query(
    `SELECT * FROM star_transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}
