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
  // Get factory owner's residents by level
  const residentsResult = await query(
    `SELECT u.telegram_id, r.level
     FROM residents r
     JOIN users u ON r.resident_id = u.telegram_id
     WHERE r.city_owner_id = $1 AND r.is_active = true
     ORDER BY r.level ASC`,
    [factoryOwnerId]
  );
  
  const residents = residentsResult.rows;
  
  // Distribute profits by level
  for (const resident of residents) {
    const profitInfo = PROFIT_STRUCTURE[resident.level];
    if (!profitInfo) continue;
    
    const profit = profitInfo.profit_per_player;
    
    // Add profit to resident
    await query(
      'UPDATE users SET balance = balance + $1 WHERE telegram_id = $2',
      [profit, resident.telegram_id]
    );
    
    // Record profit distribution
    await query(
      `INSERT INTO profit_history (earner_id, factory_owner_id, level, amount)
       VALUES ($1, $2, $3, $4)`,
      [resident.telegram_id, factoryOwnerId, resident.level, profit]
    );
  }
  
  return residents.length;
}

export async function processProfitDistribution() {
  // Get all active factories
  const factoriesResult = await query(
    `SELECT DISTINCT owner_id FROM factories 
     WHERE is_active = true AND expires_at > NOW()`
  );
  
  const factories = factoriesResult.rows;
  let totalProcessed = 0;
  
  for (const factory of factories) {
    try {
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
