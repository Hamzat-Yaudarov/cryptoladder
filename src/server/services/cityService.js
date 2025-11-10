import { query } from '../db/client.js';

const CITY_CREATION_COST = 3.00;
const HOUSE_COST_REFERRALS = 1; // Cost in referrals per house

export async function getCity(cityId) {
  try {
    const result = await query(
      'SELECT * FROM cities WHERE id = $1',
      [cityId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error in getCity:', error);
    throw error;
  }
}

export async function getCityByUserId(userId) {
  try {
    const result = await query(
      'SELECT * FROM cities WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error in getCityByUserId:', error);
    throw error;
  }
}

export async function createCity(userId) {
  try {
    // Check if user already has a city
    const existing = await getCityByUserId(userId);
    if (existing) {
      throw new Error('User already has a city');
    }

    const result = await query(
      `INSERT INTO cities (user_id, level, houses, balance)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, 1, 2, 0.00]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error in createCity:', error);
    throw error;
  }
}

export async function buildHouse(userId, costInStars) {
  try {
    const city = await getCityByUserId(userId);
    if (!city) {
      throw new Error('City not found');
    }

    // Check if user has enough balance
    if (city.balance < costInStars) {
      throw new Error('Insufficient balance');
    }

    // Get current referral count
    const refResult = await query(
      'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = $1',
      [userId]
    );
    const referralCount = parseInt(refResult.rows[0].count, 10);

    // Determine upgrade level based on referrals
    let newLevel = city.level;
    if (referralCount >= 70) newLevel = 5;
    else if (referralCount >= 35) newLevel = 4;
    else if (referralCount >= 15) newLevel = 3;
    else if (referralCount >= 0) newLevel = 2;

    const newHouses = city.level === newLevel ? city.houses + 1 : newLevel;
    const newBalance = parseFloat((city.balance - costInStars).toFixed(2));

    const result = await query(
      `UPDATE cities
       SET houses = $1, level = $2, balance = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [newHouses, Math.max(newLevel, city.level), newBalance, city.id]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error in buildHouse:', error);
    throw error;
  }
}

export async function getCityStats(userId) {
  try {
    const city = await getCityByUserId(userId);
    if (!city) {
      throw new Error('City not found');
    }

    // Get referral count
    const refResult = await query(
      'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = $1',
      [userId]
    );
    const referralCount = parseInt(refResult.rows[0].count, 10);

    // Get factories
    const factResult = await query(
      'SELECT * FROM factories WHERE city_id = $1',
      [city.id]
    );

    // Get active factory
    const activeFactory = factResult.rows.find((f) => f.is_active);

    return {
      city,
      referralCount,
      factories: factResult.rows,
      activeFactory,
    };
  } catch (error) {
    console.error('Error in getCityStats:', error);
    throw error;
  }
}

export async function updateBalance(userId, amount, description = '') {
  try {
    const city = await getCityByUserId(userId);
    if (!city) {
      throw new Error('City not found');
    }

    const newBalance = parseFloat((city.balance + amount).toFixed(2));

    const result = await query(
      `UPDATE cities
       SET balance = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [Math.max(0, newBalance), city.id]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error in updateBalance:', error);
    throw error;
  }
}
