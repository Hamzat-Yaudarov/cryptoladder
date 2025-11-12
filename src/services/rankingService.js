import { query } from '../db/connection.js';
import { UserService } from './userService.js';

export class RankingService {
  static WEEKLY_REWARDS = {
    1: parseFloat(process.env.WEEKLY_RANK_REWARD_1) || 100,
    2: parseFloat(process.env.WEEKLY_RANK_REWARD_2) || 75,
    3: parseFloat(process.env.WEEKLY_RANK_REWARD_3) || 50,
    4: parseFloat(process.env.WEEKLY_RANK_REWARD_4) || 25,
    5: parseFloat(process.env.WEEKLY_RANK_REWARD_5) || 15,
  };

  static getWeekStart(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  static async calculateWeeklyRanking(weekStart = null) {
    weekStart = weekStart || this.getWeekStart();
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Get all users with referral count
    const res = await query(
      `SELECT u.id, u.telegram_id, u.username,
              COUNT(ur.id) as referral_count
       FROM users u
       LEFT JOIN users ur ON u.id = ur.referrer_id
       GROUP BY u.id, u.telegram_id, u.username
       ORDER BY referral_count DESC`
    );

    const rankings = [];
    for (let i = 0; i < res.rows.length; i++) {
      const user = res.rows[i];
      const rank = i + 1;
      const reward = this.WEEKLY_REWARDS[rank] || null;

      rankings.push({
        userId: user.id,
        referralCount: parseInt(user.referral_count, 10),
        rank,
        reward,
      });
    }

    // Save rankings to database
    for (const ranking of rankings) {
      await query(
        `INSERT INTO weekly_rankings (week_start, user_id, referral_count, rank, reward)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (week_start, user_id) 
         DO UPDATE SET 
           referral_count = $3, 
           rank = $4, 
           reward = $5
         RETURNING *`,
        [weekStartStr, ranking.userId, ranking.referralCount, ranking.rank, ranking.reward]
      );
    }

    return rankings;
  }

  static async getWeeklyRanking(weekStart = null) {
    weekStart = weekStart || this.getWeekStart();
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const res = await query(
      `SELECT wr.*, u.username, u.telegram_id, u.first_name
       FROM weekly_rankings wr
       JOIN users u ON wr.user_id = u.id
       WHERE wr.week_start = $1
       ORDER BY wr.rank ASC`,
      [weekStartStr]
    );

    return res.rows;
  }

  static async getUserRanking(userId) {
    const res = await query(
      `SELECT * FROM weekly_rankings
       WHERE user_id = $1
       ORDER BY week_start DESC
       LIMIT 1`,
      [userId]
    );
    return res.rows[0] || null;
  }

  static async claimWeeklyReward(userId) {
    const ranking = await this.getUserRanking(userId);
    if (!ranking || !ranking.reward || ranking.claimed) {
      throw new Error('No unclaimed reward available');
    }

    // Update claim status
    await query(
      `UPDATE weekly_rankings
       SET claimed = true
       WHERE id = $1`,
      [ranking.id]
    );

    // Add reward to user balance
    await UserService.updateBalance(userId, ranking.reward);

    // Log activity
    await UserService.logActivity(userId, 'WEEKLY_REWARD_CLAIMED', {
      rank: ranking.rank,
      amount: ranking.reward,
      week: ranking.week_start,
    });

    await UserService.addTransaction(userId, 'WEEKLY_REWARD', ranking.reward, `Weekly rank reward (Rank #${ranking.rank})`);

    return ranking;
  }

  static async getTopRankers(limit = 5) {
    const weekStart = this.getWeekStart();
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const res = await query(
      `SELECT wr.*, u.username, u.telegram_id, u.first_name
       FROM weekly_rankings wr
       JOIN users u ON wr.user_id = u.id
       WHERE wr.week_start = $1 AND wr.rank <= $2
       ORDER BY wr.rank ASC`,
      [weekStartStr, limit]
    );

    return res.rows;
  }

  static async getUserStats(userId) {
    const res = await query(
      `SELECT 
        COUNT(*) as total_appearances,
        COUNT(CASE WHEN rank <= 5 THEN 1 END) as top5_count,
        SUM(CASE WHEN claimed THEN reward ELSE 0 END) as total_claimed,
        SUM(CASE WHEN NOT claimed THEN reward ELSE 0 END) as pending_rewards
       FROM weekly_rankings
       WHERE user_id = $1`,
      [userId]
    );

    const stats = res.rows[0];
    return {
      totalAppearances: parseInt(stats.total_appearances, 10),
      top5Count: parseInt(stats.top5_count, 10),
      totalClaimed: parseFloat(stats.total_claimed) || 0,
      pendingRewards: parseFloat(stats.pending_rewards) || 0,
    };
  }
}
