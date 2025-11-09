import { query } from '../db.js';

export async function getUserById(userId) {
  try {
    const user = await query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    return user.rows[0] || null;
  } catch (error) {
    console.error('Ошибка при получении пользователя по ID:', error);
    throw error;
  }
}

export async function getOrCreateUser(telegramId, userData = {}) {
  try {
    // Check if user exists
    const existingUser = await query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];

      // Update user data if provided (from Telegram)
      if (userData && (userData.username || userData.first_name || userData.last_name)) {
        try {
          // Try to update with photo_url if it exists
          await query(
            `UPDATE users
             SET username = COALESCE($1, username),
                 first_name = COALESCE($2, first_name),
                 last_name = COALESCE($3, last_name),
                 photo_url = COALESCE($4, photo_url),
                 updated_at = CURRENT_TIMESTAMP
             WHERE telegram_id = $5`,
            [userData.username, userData.first_name, userData.last_name, userData.photo_url, telegramId]
          );
        } catch (updateError) {
          // If photo_url column doesn't exist, update without it
          if (updateError.message.includes('column "photo_url" does not exist')) {
            await query(
              `UPDATE users
               SET username = COALESCE($1, username),
                   first_name = COALESCE($2, first_name),
                   last_name = COALESCE($3, last_name),
                   updated_at = CURRENT_TIMESTAMP
               WHERE telegram_id = $4`,
              [userData.username, userData.first_name, userData.last_name, telegramId]
            );
          } else {
            throw updateError;
          }
        }
      }

      // Вернуть обновленного по��ьзователя
      const updatedUser = await query(
        'SELECT * FROM users WHERE telegram_id = $1',
        [telegramId]
      );
      return updatedUser.rows[0];
    }

    // Создание нового пользователя - сначала попытка с photo_url
    try {
      const newUser = await query(
        `INSERT INTO users (telegram_id, username, first_name, last_name, photo_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [telegramId, userData?.username, userData?.first_name, userData?.last_name, userData?.photo_url]
      );
      return newUser.rows[0];
    } catch (insertError) {
      // Если колонка photo_url не существует, вставить без неё
      if (insertError.message.includes('column "photo_url" does not exist')) {
        const newUser = await query(
          `INSERT INTO users (telegram_id, username, first_name, last_name)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [telegramId, userData?.username, userData?.first_name, userData?.last_name]
        );
        return newUser.rows[0];
      } else {
        throw insertError;
      }
    }
  } catch (error) {
    console.error('Ошибка при создании или получении пользователя:', error);
    throw error;
  }
}

export async function assignParentAndPosition(userId, referrerId = null) {
  try {
    let parentId = referrerId;
    let children = null;
    let position = 0;

    if (!parentId) {
      // Find root user (creator) or create default structure
      const rootUser = await query(
        'SELECT id FROM users WHERE parent_id IS NULL LIMIT 1'
      );

      if (rootUser.rows.length > 0) {
        parentId = rootUser.rows[0].id;
      } else {
        // First user becomes root
        parentId = null;
      }
    }

    if (parentId) {
      // Find first available position in parent's children
      children = await query(
        'SELECT position_in_parent FROM users WHERE parent_id = $1 ORDER BY position_in_parent',
        [parentId]
      );

      position = 1;
      if (children.rows.length > 0) {
        const occupiedPositions = children.rows.map(c => c.position_in_parent || 0);
        for (let i = 1; i <= 3; i++) {
          if (!occupiedPositions.includes(i)) {
            position = i;
            break;
          }
        }
      }

      if (children.rows.length < 3) {
        await query(
          'UPDATE users SET parent_id = $1, position_in_parent = $2 WHERE id = $3',
          [parentId, position, userId]
        );
      } else {
        // Parent has no free slots; leave position as 0 - caller may handle further placement
        position = 0;
      }
    }

    return { parentId, position };
  } catch (error) {
    console.error('Ошибка при назначении родителя и позиции:', error);
    throw error;
  }
}

export async function getUserWithStats(userId) {
  try {
    const user = await query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (user.rows.length === 0) {
      return null;
    }

    const userData = user.rows[0];

    // Get referral count
    const referrals = await query(
      'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = $1',
      [userId]
    );

    // Get total earnings
    const earnings = await query(
      'SELECT SUM(amount) as total FROM earnings WHERE user_id = $1',
      [userId]
    );

    // Check if activated today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activation = await query(
      'SELECT * FROM activations WHERE user_id = $1 AND DATE(activation_date) = CURRENT_DATE',
      [userId]
    );

    return {
      ...userData,
      referral_count: parseInt(referrals.rows[0].count),
      total_earnings: parseFloat(earnings.rows[0].total) || 0,
      is_activated_today: activation.rows.length > 0,
    };
  } catch (error) {
    console.error('Ошибка при получении пользователя со статистикой:', error);
    throw error;
  }
}

export async function getUserPyramidStructure(userId, depth = 3) {
  try {
    const structure = await query(
      `WITH RECURSIVE pyramid AS (
        SELECT id, telegram_id, username, parent_id, position_in_parent, 0 as level
        FROM users
        WHERE id = $1

        UNION ALL

        SELECT u.id, u.telegram_id, u.username, u.parent_id, u.position_in_parent, p.level + 1
        FROM users u
        INNER JOIN pyramid p ON u.parent_id = p.id
        WHERE p.level < $2
      )
      SELECT * FROM pyramid`,
      [userId, depth]
    );

    return structure.rows;
  } catch (error) {
    console.error('Ошибка при получении структуры пирамиды:', error);
    throw error;
  }
}

export async function getDownlineUsers(userId, maxLevel = 5) {
  try {
    const downline = await query(
      `WITH RECURSIVE downline AS (
        SELECT id, parent_id, 1 as level
        FROM users
        WHERE parent_id = $1

        UNION ALL

        SELECT u.id, u.parent_id, d.level + 1
        FROM users u
        INNER JOIN downline d ON u.parent_id = d.id
        WHERE d.level < $2
      )
      SELECT * FROM downline`,
      [userId, maxLevel]
    );

    return downline.rows;
  } catch (error) {
    console.error('Ошибка при получении пользователей в подчинении:', error);
    throw error;
  }
}

export async function addReferral(referrerId, referredId) {
  try {
    const result = await query(
      `INSERT INTO referrals (referrer_id, referred_id)
       VALUES ($1, $2)
       ON CONFLICT (referrer_id, referred_id) DO NOTHING
       RETURNING *`,
      [referrerId, referredId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Ошибка при добавлении реферала:', error);
    throw error;
  }
}

export async function getReferralsList(userId, limit = 100, offset = 0) {
  try {
    const referrals = await query(
      `SELECT u.id, u.telegram_id, u.username, u.first_name, u.last_name, u.balance, u.created_at
       FROM referrals r
       JOIN users u ON r.referred_id = u.id
       WHERE r.referrer_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const count = await query(
      'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = $1',
      [userId]
    );

    return {
      referrals: referrals.rows,
      total: parseInt(count.rows[0].count),
    };
  } catch (error) {
    console.error('Error getting referrals list:', error);
    throw error;
  }
}
