import { query } from '../db/connection.js';
import { UserService } from './userService.js';
import { CityService } from './cityService.js';

export class EconomyService {
  // Profit distribution levels
  static LEVELS = {
    1: { count: 3, profitPercentage: 40, profitPerPlayer: 4 },
    2: { count: 9, profitPercentage: 25, profitPerPlayer: 2.5 },
    3: { count: 27, profitPercentage: 17, profitPerPlayer: 1.7 },
    4: { count: 81, profitPercentage: 10, profitPerPlayer: 1 },
    5: { count: 243, profitPercentage: 5, profitPerPlayer: 0.5 },
  };

  static async getFactory(userId) {
    const res = await query(
      'SELECT * FROM factories WHERE user_id = $1',
      [userId]
    );
    return res.rows[0] || null;
  }

  static async createFactory(userId) {
    const res = await query(
      `INSERT INTO factories (user_id, is_active)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, false]
    );
    return res.rows[0];
  }

  static async activateFactory(userId, durationHours = 24) {
    const cost = process.env.FACTORY_DAILY_COST || 10;
    const user = await UserService.getUserById(userId);

    if (!user || user.balance < cost) {
      throw new Error('Insufficient balance to activate factory');
    }

    // Deduct cost
    await UserService.updateBalance(userId, -cost);

    // Update factory
    const now = new Date();
    const expiryTime = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    const res = await query(
      `UPDATE factories
       SET is_active = true, activated_at = $1, activated_until = $2, last_profit_calculation = $3
       WHERE user_id = $4
       RETURNING *`,
      [now, expiryTime, now, userId]
    );

    // Log activity
    await UserService.logActivity(userId, 'FACTORY_ACTIVATED', { duration: durationHours });
    await UserService.addTransaction(userId, 'FACTORY_ACTIVATION', -cost, `Factory activated for ${durationHours}h`);

    return res.rows[0];
  }

  static async deactivateFactory(userId) {
    const res = await query(
      `UPDATE factories
       SET is_active = false, activated_until = NULL
       WHERE user_id = $1
       RETURNING *`,
      [userId]
    );

    await UserService.logActivity(userId, 'FACTORY_DEACTIVATED');

    return res.rows[0];
  }

  static async calculateProfit(userId) {
    const factory = await this.getFactory(userId);
    if (!factory || !factory.is_active) return 0;

    // Check if factory is still active
    if (new Date() > new Date(factory.activated_until)) {
      await this.deactivateFactory(userId);
      return 0;
    }

    return process.env.FACTORY_DAILY_COST || 10;
  }

  static async distributeProfitByLevel(sourcedUserId, profitAmount) {
    // Get the tree structure - all users below the source user
    // Based on referral relationships

    const results = [];

    // Level 1: Direct referrals (3 expected)
    const referrals = await UserService.getReferrals(sourcedUserId);
    for (let i = 0; i < Math.min(3, referrals.length); i++) {
      const amount = profitAmount * (this.LEVELS[1].profitPercentage / 100) / 3;
      await this.addProfit(referrals[i].id, sourcedUserId, 1, amount);
      results.push({ userId: referrals[i].id, level: 1, amount });
    }

    // Levels 2-5: Recursive distribution
    for (let level = 2; level <= 5; level++) {
      const prevLevel = level - 1;
      const currentLevelConfig = this.LEVELS[level];
      const prevLevelUsers = await query(
        `SELECT DISTINCT u.id FROM users u
         WHERE u.referrer_id IN (
           SELECT id FROM users WHERE referrer_id IN (
             -- Need to get all users at previous level
           )
         )`
      );

      // Simplified: get all users at this level depth
      const usersAtLevel = await this.getUsersAtDepth(sourcedUserId, level);
      const expectedCount = currentLevelConfig.count;
      const applicableUsers = usersAtLevel.slice(0, expectedCount);

      for (const user of applicableUsers) {
        const amount = profitAmount * (currentLevelConfig.profitPercentage / 100) / applicableUsers.length;
        await this.addProfit(user.id, sourcedUserId, level, amount);
        results.push({ userId: user.id, level, amount });
      }
    }

    return results;
  }

  static async getUsersAtDepth(rootUserId, depth) {
    // Get all users at specific depth in referral tree
    const allUsers = [];

    const getAtDepth = async (userId, currentDepth) => {
      if (currentDepth === depth) {
        const user = await UserService.getUserById(userId);
        if (user) allUsers.push(user);
        return;
      }

      const referrals = await UserService.getReferrals(userId);
      for (const referral of referrals) {
        await getAtDepth(referral.id, currentDepth + 1);
      }
    };

    await getAtDepth(rootUserId, 1);
    return allUsers;
  }

  static async addProfit(userId, sourceUserId, level, amount) {
    // Record profit distribution
    await query(
      `INSERT INTO profit_distributions (user_id, source_user_id, level, amount)
       VALUES ($1, $2, $3, $4)`,
      [userId, sourceUserId, level, amount]
    );

    // Update user balance
    await UserService.updateBalance(userId, amount);

    // Log activity
    await UserService.logActivity(userId, 'PROFIT_RECEIVED', {
      source: sourceUserId,
      level,
      amount,
    });
  }

  static async getProfitHistory(userId, limit = 100) {
    const res = await query(
      `SELECT pd.*, u.username as source_username
       FROM profit_distributions pd
       JOIN users u ON pd.source_user_id = u.id
       WHERE pd.user_id = $1
       ORDER BY pd.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return res.rows;
  }

  static async getProfitStats(userId) {
    const res = await query(
      `SELECT 
        SUM(amount) as total_profit,
        COUNT(*) as transaction_count,
        MIN(created_at) as first_profit,
        MAX(created_at) as last_profit,
        AVG(amount) as avg_amount
       FROM profit_distributions
       WHERE user_id = $1`,
      [userId]
    );

    const stats = res.rows[0];
    return {
      totalProfit: parseFloat(stats.total_profit) || 0,
      transactionCount: parseInt(stats.transaction_count, 10),
      firstProfit: stats.first_profit,
      lastProfit: stats.last_profit,
      avgAmount: parseFloat(stats.avg_amount) || 0,
    };
  }

  static async getProfitByLevel(userId) {
    const res = await query(
      `SELECT level, COUNT(*) as count, SUM(amount) as total
       FROM profit_distributions
       WHERE user_id = $1
       GROUP BY level
       ORDER BY level ASC`,
      [userId]
    );
    return res.rows;
  }
}
