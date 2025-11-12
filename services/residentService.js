import { query } from '../database/client.js';

const REFERRAL_BONUS = 0.5; // Stars per successful factory activation

export async function addResident(cityOwnerId, residentTelegramId) {
  // Determine level based on current residents
  const countResult = await query(
    'SELECT COUNT(*) as count FROM residents WHERE city_owner_id = $1 AND is_active = true',
    [cityOwnerId]
  );
  
  const currentResidents = parseInt(countResult.rows[0].count) || 0;
  
  // Calculate level (each level holds 3^(level-1) residents)
  let level = 1;
  let levelCapacity = 0;
  let residentCount = currentResidents;
  
  while (residentCount > 0) {
    const capacity = Math.pow(3, level - 1);
    if (residentCount <= capacity) {
      break;
    }
    residentCount -= capacity;
    level++;
  }
  
  // Check if there's space at current level
  const cityResult = await query(
    'SELECT houses FROM cities WHERE user_id = $1',
    [cityOwnerId]
  );
  
  if (!cityResult.rows[0]) {
    throw new Error('City not found');
  }
  
  const maxLevels = cityResult.rows[0].houses;
  
  if (level > maxLevels) {
    level = maxLevels;
  }
  
  // Add resident
  const result = await query(
    `INSERT INTO residents (city_owner_id, resident_id, level, is_active)
     VALUES ($1, $2, $3, true)
     ON CONFLICT (city_owner_id, resident_id) DO UPDATE SET
       is_active = true,
       level = $3
     RETURNING *`,
    [cityOwnerId, residentTelegramId, level]
  );
  
  return result.rows[0];
}

export async function getResidents(cityOwnerId) {
  const result = await query(
    `SELECT 
      r.id,
      r.resident_id,
      u.username,
      u.first_name,
      r.level,
      r.joined_at,
      r.is_active,
      (SELECT COUNT(*) FROM factories WHERE owner_id = r.resident_id AND is_active = true) as active_factories
     FROM residents r
     JOIN users u ON r.resident_id = u.telegram_id
     WHERE r.city_owner_id = $1 AND r.is_active = true
     ORDER BY r.level ASC, r.joined_at ASC`,
    [cityOwnerId]
  );
  
  return result.rows;
}

export async function getResidentsByLevel(cityOwnerId) {
  const result = await query(
    `SELECT 
      r.level,
      COUNT(*) as count,
      SUM(CASE WHEN r.is_active THEN 1 ELSE 0 END) as active_count
     FROM residents r
     WHERE r.city_owner_id = $1
     GROUP BY r.level
     ORDER BY r.level ASC`,
    [cityOwnerId]
  );
  
  return result.rows;
}

export async function getTotalResidents(cityOwnerId) {
  const result = await query(
    'SELECT COUNT(*) as count FROM residents WHERE city_owner_id = $1 AND is_active = true',
    [cityOwnerId]
  );
  
  return parseInt(result.rows[0].count) || 0;
}

export async function getProfitDistribution(cityOwnerId) {
  const levelData = await query(
    `SELECT 
      r.level,
      COUNT(*) as player_count,
      CASE 
        WHEN r.level = 1 THEN COUNT(*) * 4
        WHEN r.level = 2 THEN COUNT(*) * 2.5
        WHEN r.level = 3 THEN COUNT(*) * 1.7
        WHEN r.level = 4 THEN COUNT(*) * 1
        WHEN r.level = 5 THEN COUNT(*) * 0.5
        ELSE 0
      END as level_total_profit
     FROM residents r
     WHERE r.city_owner_id = $1 AND r.is_active = true
     GROUP BY r.level
     ORDER BY r.level ASC`,
    [cityOwnerId]
  );
  
  return levelData.rows;
}

export async function getResidentsReferredByUser(referrerId) {
  const result = await query(
    `SELECT 
      u.telegram_id,
      u.username,
      u.first_name,
      u.balance,
      u.created_at,
      (SELECT COUNT(*) FROM residents WHERE city_owner_id = u.telegram_id) as residents_count
     FROM users u
     WHERE u.referrer_id = $1
     ORDER BY u.created_at DESC`,
    [referrerId]
  );
  
  return result.rows;
}

export const REFERRAL_BONUS_CONST = REFERRAL_BONUS;
