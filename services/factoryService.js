import { query } from '../database/client.js';

const DAILY_FACTORY_COST = 10; // Stars per day

// Profit structure by level
const PROFIT_STRUCTURE = {
  1: { players: 3, profit_per_player: 4, percentage: 0.40 },
  2: { players: 9, profit_per_player: 2.5, percentage: 0.25 },
  3: { players: 27, profit_per_player: 1.7, percentage: 0.17 },
  4: { players: 81, profit_per_player: 1, percentage: 0.10 },
  5: { players: 243, profit_per_player: 0.5, percentage: 0.05 }
};

export async function activateFactory(telegramId) {
  // Check if user has city and balance
  const userResult = await query(
    'SELECT * FROM users WHERE telegram_id = $1',
    [telegramId]
  );
  
  if (!userResult.rows[0]) {
    throw new Error('User not found');
  }
  
  const user = userResult.rows[0];
  
  if (!user.is_city_active) {
    throw new Error('City is not active');
  }
  
  if (user.balance < DAILY_FACTORY_COST) {
    throw new Error('Insufficient balance');
  }
  
  // Deduct cost from balance
  await query(
    'UPDATE users SET balance = balance - $1 WHERE telegram_id = $2',
    [DAILY_FACTORY_COST, telegramId]
  );
  
  // Create factory record (24-hour activation)
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  const result = await query(
    `INSERT INTO factories (owner_id, activated_at, expires_at, is_active)
     VALUES ($1, $2, $3, true)
     RETURNING *`,
    [telegramId, now, expiresAt]
  );
  
  return result.rows[0];
}

export async function getActiveFactories(telegramId) {
  const result = await query(
    `SELECT * FROM factories 
     WHERE owner_id = $1 AND is_active = true AND expires_at > NOW()
     ORDER BY activated_at DESC`,
    [telegramId]
  );
  
  return result.rows;
}

export async function deactivateExpiredFactories() {
  const result = await query(
    `UPDATE factories SET is_active = false
     WHERE is_active = true AND expires_at <= NOW()
     RETURNING *`
  );
  
  return result.rows;
}

export async function distributeProfits(factoryOwnerId) {
  // For each active factory owned by factoryOwnerId, distribute profits up the referrer chain
  const factoriesRes = await query(
    `SELECT id, owner_id, activated_at FROM factories
     WHERE owner_id = $1 AND is_active = true AND expires_at > NOW()`,
    [factoryOwnerId]
  );

  const factories = factoriesRes.rows;
  let totalDistributed = 0;

  for (const factory of factories) {
    let current = factory.owner_id.toString();

    // Walk up to 5 levels of referrers
    for (let level = 1; level <= 5; level++) {
      const refRes = await query(
        'SELECT referrer_id FROM users WHERE telegram_id = $1',
        [current]
      );
      const ref = refRes.rows[0]?.referrer_id;
      if (!ref) break; // no more ancestors

      const ancestorId = ref.toString();
      const profitInfo = PROFIT_STRUCTURE[level];
      if (!profitInfo) {
        current = ancestorId;
        continue;
      }

      const profit = profitInfo.profit_per_player;

      // Add profit to ancestor
      await query(
        'UPDATE users SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = $2',
        [profit, ancestorId]
      );

      // Record profit distribution
      await query(
        `INSERT INTO profit_history (earner_id, factory_owner_id, level, amount)
         VALUES ($1, $2, $3, $4)`,
        [ancestorId, factoryOwnerId, level, profit]
      );

      totalDistributed++;

      // Move up the chain
      current = ancestorId;
    }
  }

  return totalDistributed;
}

export async function processProfitDistribution() {
  // Get all active factories
  const factoriesResult = await query(
    `SELECT id, owner_id FROM factories
     WHERE is_active = true AND expires_at > NOW()`
  );

  const factories = factoriesResult.rows;
  let totalProcessed = 0;

  for (const factory of factories) {
    try {
      // Distribute profits for this factory's owner (distributeProfits will handle all active factories for owner)
      const distributed = await distributeProfits(factory.owner_id);
      totalProcessed += distributed;
    } catch (error) {
      console.error(`Failed to distribute profits for factory owner ${factory.owner_id}:`, error);
    }
  }

  return totalProcessed;
}

export async function getFactoryStats(telegramId) {
  const result = await query(
    `SELECT 
      COUNT(*) as total_factories,
      SUM(CASE WHEN is_active = true AND expires_at > NOW() THEN 1 ELSE 0 END) as active_factories,
      SUM(CASE WHEN is_active = false OR expires_at <= NOW() THEN 1 ELSE 0 END) as inactive_factories
     FROM factories
     WHERE owner_id = $1`,
    [telegramId]
  );
  
  return result.rows[0] || {
    total_factories: 0,
    active_factories: 0,
    inactive_factories: 0
  };
}

export const DAILY_FACTORY_COST_CONST = DAILY_FACTORY_COST;
export const PROFIT_STRUCTURE_CONST = PROFIT_STRUCTURE;
