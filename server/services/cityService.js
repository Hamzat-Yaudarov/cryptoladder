import { query } from '../db.js';
import { generateReferralCode } from '../utils/helpers.js';
import { calculateCityLevel } from './profitService.js';

const CITY_CREATION_COST = 3; // Stars
const REFERRAL_BONUS = 0.5; // Stars

/**
 * Create a new city for a user
 */
export async function createCity(userId, username) {
  try {
    const referralCode = generateReferralCode();
    
    const cityRes = await query(
      `INSERT INTO cities (user_id, referral_code, total_houses)
       VALUES ($1, $2, 2)
       RETURNING *`,
      [userId, referralCode]
    );
    
    const city = cityRes.rows[0];
    
    // Create initial 2 houses
    await query(
      `INSERT INTO houses (city_id, level) VALUES ($1, 1), ($1, 2)`,
      [city.id]
    );
    
    // Create initial factory (inactive)
    await query(
      `INSERT INTO factories (city_id, is_active) VALUES ($1, false)`,
      [city.id]
    );
    
    return city;
  } catch (error) {
    console.error('Error creating city:', error);
    throw error;
  }
}

/**
 * Get city data with all related information
 */
export async function getCityData(telegramId) {
  try {
    const numTelegramId = Number(telegramId);

    const cityRes = await query(
      `SELECT * FROM cities WHERE user_id = $1`,
      [numTelegramId]
    );
    
    if (cityRes.rows.length === 0) return null;
    
    const city = cityRes.rows[0];
    
    // Get houses
    const housesRes = await query(
      `SELECT * FROM houses WHERE city_id = $1 ORDER BY level`,
      [city.id]
    );
    
    // Get factory info
    const factoryRes = await query(
      `SELECT * FROM factories WHERE city_id = $1`,
      [city.id]
    );
    
    // Get referral count
    const referralsRes = await query(
      `SELECT COUNT(*) as count FROM referrals WHERE referrer_user_id = $1`,
      [numTelegramId]
    );
    
    const referralCount = parseInt(referralsRes.rows[0].count);
    
    return {
      ...city,
      houses: housesRes.rows,
      factory: factoryRes.rows[0] || null,
      referral_count: referralCount,
      level: calculateCityLevel(referralCount),
    };
  } catch (error) {
    console.error('Error getting city data:', error);
    throw error;
  }
}

/**
 * Activate factory for 24 hours
 */
export async function activateFactory(cityId, telegramId) {
  try {
    const numTelegramId = Number(telegramId);

    // Check if user has enough balance
    const balanceRes = await query(
      `SELECT balance FROM cities WHERE user_id = $1`,
      [numTelegramId]
    );
    
    if (balanceRes.rows.length === 0) {
      throw new Error('City not found');
    }
    
    const balance = parseFloat(balanceRes.rows[0].balance);
    
    // Cost is 10 stars per day
    if (balance < 10) {
      return {
        success: false,
        error: 'Insufficient balance. Need 10⭐️',
        current_balance: balance,
      };
    }
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Deduct cost and activate factory
    await query(
      `BEGIN`
    );
    
    try {
      await query(
        `UPDATE cities SET balance = balance - 10 WHERE user_id = $1`,
        [numTelegramId]
      );

      await query(
        `UPDATE factories
         SET is_active = true, activated_at = $1, expires_at = $2, last_payout_time = $3
         WHERE city_id = $4`,
        [now, expiresAt, now, cityId]
      );

      // Record transaction
      await query(
        `INSERT INTO transactions (user_id, type, amount, description)
         VALUES ($1, 'factory_activation', 10, 'Factory activation for 24 hours')`,
        [numTelegramId]
      );
      
      await query(`COMMIT`);
      
      return {
        success: true,
        expires_at: expiresAt,
        remaining_balance: balance - 10,
      };
    } catch (error) {
      await query(`ROLLBACK`);
      throw error;
    }
  } catch (error) {
    console.error('Error activating factory:', error);
    throw error;
  }
}

/**
 * Check and deactivate expired factories
 */
export async function checkAndDeactivateExpiredFactories() {
  try {
    const now = new Date();
    
    const result = await query(
      `UPDATE factories 
       SET is_active = false
       WHERE is_active = true AND expires_at < $1
       RETURNING id, city_id`,
      [now]
    );
    
    if (result.rows.length > 0) {
      console.log(`✅ Deactivated ${result.rows.length} expired factories`);
    }
    
    return result.rows;
  } catch (error) {
    console.error('Error checking expired factories:', error);
    throw error;
  }
}

/**
 * Get user's residents (referred users assigned to houses)
 */
export async function getCityResidents(cityId) {
  try {
    const result = await query(
      `SELECT 
        h.id as house_id,
        h.level,
        h.resident_user_id,
        u.first_name,
        u.username,
        c.balance,
        c.is_factory_active
       FROM houses h
       LEFT JOIN users u ON h.resident_user_id = u.telegram_id
       LEFT JOIN cities c ON u.telegram_id = c.user_id
       WHERE h.city_id = $1
       ORDER BY h.level`,
      [cityId]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting city residents:', error);
    throw error;
  }
}

/**
 * Add a new house to a city (if upgraded)
 */
export async function addHouseToCity(cityId) {
  try {
    const housesRes = await query(
      `SELECT COUNT(*) as count FROM houses WHERE city_id = $1`,
      [cityId]
    );

    const newLevel = parseInt(housesRes.rows[0].count) + 1;
    
    const result = await query(
      `INSERT INTO houses (city_id, level) VALUES ($1, $2) RETURNING *`,
      [cityId, newLevel]
    );
    
    // Update city total_houses
    await query(
      `UPDATE cities SET total_houses = $1 WHERE id = $2`,
      [newLevel, cityId]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error adding house to city:', error);
    throw error;
  }
}

export const CITY_CREATION_COST_STARS = CITY_CREATION_COST;
export const REFERRAL_BONUS_STARS = REFERRAL_BONUS;
