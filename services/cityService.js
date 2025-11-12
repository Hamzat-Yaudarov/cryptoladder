import { query } from '../database/client.js';

const CITY_CREATION_COST = 3; // Stars

export async function createCity(telegramId) {
  const client = await query._getClient?.();
  
  try {
    if (client) await client.query('BEGIN');
    
    // Check if user already has a city
    const existingCity = await query(
      'SELECT * FROM cities WHERE user_id = $1',
      [telegramId]
    );
    
    if (existingCity.rows.length > 0) {
      throw new Error('User already has a city');
    }
    
    // Create city with initial houses and factory
    const cityResult = await query(
      `INSERT INTO cities (user_id, houses, factory_count)
       VALUES ($1, 2, 1)
       RETURNING *`,
      [telegramId]
    );
    
    // Activate city
    await query(
      `UPDATE users SET is_city_active = true, city_level = 1, updated_at = CURRENT_TIMESTAMP
       WHERE telegram_id = $1`,
      [telegramId]
    );
    
    if (client) await client.query('COMMIT');
    
    return cityResult.rows[0];
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    throw error;
  }
}

export async function getCity(telegramId) {
  const result = await query(
    'SELECT * FROM cities WHERE user_id = $1',
    [telegramId]
  );
  
  return result.rows[0];
}

export async function upgradeCityLevel(telegramId) {
  const user = await query(
    'SELECT * FROM users WHERE telegram_id = $1',
    [telegramId]
  );
  
  if (!user.rows[0]) {
    throw new Error('User not found');
  }
  
  const currentLevel = user.rows[0].city_level;
  const nextLevel = currentLevel + 1;
  
  if (nextLevel > 5) {
    throw new Error('City is at maximum level');
  }
  
  // Get required referral count for next level
  const referralRequirements = {
    1: 0,
    2: 0,
    3: 15,
    4: 35,
    5: 70
  };
  
  const requiredReferrals = referralRequirements[nextLevel];
  const currentReferrals = user.rows[0].total_referrals;
  
  if (currentReferrals < requiredReferrals) {
    throw new Error(`Need at least ${requiredReferrals} referrals to upgrade to level ${nextLevel}`);
  }
  
  // Add new house
  const result = await query(
    `UPDATE cities SET houses = houses + 1 WHERE user_id = $1
     RETURNING *`,
    [telegramId]
  );
  
  // Update user level
  await query(
    `UPDATE users SET city_level = $1, updated_at = CURRENT_TIMESTAMP
     WHERE telegram_id = $2`,
    [nextLevel, telegramId]
  );
  
  return result.rows[0];
}

export async function addHouse(telegramId) {
  const result = await query(
    `UPDATE cities SET houses = houses + 1 WHERE user_id = $1
     RETURNING *`,
    [telegramId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('City not found');
  }
  
  return result.rows[0];
}

export async function addFactory(telegramId) {
  const result = await query(
    `UPDATE cities SET factory_count = factory_count + 1 WHERE user_id = $1
     RETURNING *`,
    [telegramId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('City not found');
  }
  
  return result.rows[0];
}

export async function getCityStats(telegramId) {
  const result = await query(
    `SELECT 
      c.houses,
      c.factory_count,
      (SELECT COUNT(*) FROM factories WHERE owner_id = $1 AND is_active = true) as active_factories,
      (SELECT COUNT(*) FROM residents WHERE city_owner_id = $1) as total_residents,
      (SELECT SUM(amount) FROM profit_history WHERE earner_id = $1) as total_earned
     FROM cities c
     WHERE c.user_id = $1`,
    [telegramId]
  );
  
  return result.rows[0] || {
    houses: 0,
    factory_count: 0,
    active_factories: 0,
    total_residents: 0,
    total_earned: 0
  };
}

export const CITY_CREATION_COST_CONST = CITY_CREATION_COST;
