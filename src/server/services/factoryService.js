import { query } from '../db/client.js';
import { getCity } from './cityService.js';
import { getUserById } from './userService.js';

const FACTORY_DAILY_COST = 10.00;
const ACTIVATION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const PROFIT_LEVELS = [
  { level: 1, maxPlayers: 3, percentage: 0.40 },
  { level: 2, maxPlayers: 9, percentage: 0.25 },
  { level: 3, maxPlayers: 27, percentage: 0.17 },
  { level: 4, maxPlayers: 81, percentage: 0.10 },
  { level: 5, maxPlayers: 243, percentage: 0.05 },
];

export async function getFactoriesByCity(cityId) {
  try {
    const result = await query(
      'SELECT * FROM factories WHERE city_id = $1 ORDER BY created_at ASC',
      [cityId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error in getFactoriesByCity:', error);
    throw error;
  }
}

export async function activateFactory(userId, cityId) {
  try {
    // Check user balance
    const city = await getCity(cityId);
    if (!city) {
      throw new Error('City not found');
    }

    if (city.balance < FACTORY_DAILY_COST) {
      throw new Error('Insufficient balance for factory activation');
    }

    // Deactivate other active factories for this city
    await query(
      `UPDATE factories
       SET is_active = FALSE, deactivates_at = CURRENT_TIMESTAMP
       WHERE city_id = $1 AND is_active = TRUE`,
      [cityId]
    );

    // Get or create factory
    const factories = await getFactoriesByCity(cityId);
    let factory = factories[0];

    if (!factory) {
      const result = await query(
        `INSERT INTO factories (city_id, is_active, activated_at, deactivates_at)
         VALUES ($1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '24 hours')
         RETURNING *`,
        [cityId]
      );
      factory = result.rows[0];
    } else {
      const result = await query(
        `UPDATE factories
         SET is_active = TRUE, activated_at = CURRENT_TIMESTAMP, deactivates_at = CURRENT_TIMESTAMP + INTERVAL '24 hours'
         WHERE id = $1
         RETURNING *`,
        [factory.id]
      );
      factory = result.rows[0];
    }

    // Deduct cost from city balance
    await query(
      `UPDATE cities
       SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [FACTORY_DAILY_COST, cityId]
    );

    // Record transaction
    await query(
      `INSERT INTO transactions (user_id, type, amount, description)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'factory_activation', -FACTORY_DAILY_COST, 'Factory activated for 24 hours']
    );

    return factory;
  } catch (error) {
    console.error('Error in activateFactory:', error);
    throw error;
  }
}

export async function processFactoryProfits() {
  try {
    // Get all active factories
    const result = await query(
      `SELECT f.*, c.user_id, c.level
       FROM factories f
       JOIN cities c ON f.city_id = c.id
       WHERE f.is_active = TRUE AND f.deactivates_at > CURRENT_TIMESTAMP`
    );

    const activeFactories = result.rows;

    for (const factory of activeFactories) {
      const { id: factoryId, user_id: factoryOwner, level: ownerLevel } = factory;

      // Get all referrers of this user (people above them in the network)
      const referrersResult = await query(
        `WITH RECURSIVE referral_chain AS (
          SELECT id, referrer_id, 1 as depth
          FROM users
          WHERE id = $1
          UNION ALL
          SELECT u.id, u.referrer_id, rc.depth + 1
          FROM users u
          JOIN referral_chain rc ON u.id = rc.referrer_id
          WHERE rc.depth < $2
        )
        SELECT * FROM referral_chain WHERE referrer_id IS NOT NULL`,
        [factoryOwner, ownerLevel]
      );

      const referrers = referrersResult.rows;

      // Distribute profits to referrers
      for (const referrer of referrers) {
        const { id: referrerId, depth: level } = referrer;

        if (level > PROFIT_LEVELS.length) continue;

        const profitLevel = PROFIT_LEVELS[level - 1];
        if (!profitLevel) continue;

        // Calculate daily profit
        const dailyProfit = (FACTORY_DAILY_COST * profitLevel.percentage) / 24;
        const hourlyProfit = dailyProfit / 60; // Per minute

        // Add transaction
        await query(
          `INSERT INTO transactions (user_id, type, amount, description, source_user_id, level_income_from)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            referrerId,
            'profit_distribution',
            hourlyProfit,
            `Profit from factory (level ${level})`,
            factoryOwner,
            level,
          ]
        );

        // Update user balance
        await query(
          `UPDATE cities
           SET balance = balance + $1
           WHERE user_id = $2`,
          [hourlyProfit, referrerId]
        );
      }
    }

    console.log(`✅ Processed profits for ${activeFactories.length} active factories`);
  } catch (error) {
    console.error('Error in processFactoryProfits:', error);
  }
}

export async function deactivateExpiredFactories() {
  try {
    const result = await query(
      `UPDATE factories
       SET is_active = FALSE
       WHERE is_active = TRUE AND deactivates_at <= CURRENT_TIMESTAMP
       RETURNING *`
    );

    if (result.rows.length > 0) {
      console.log(`✅ Deactivated ${result.rows.length} expired factories`);
    }
  } catch (error) {
    console.error('Error in deactivateExpiredFactories:', error);
  }
}
