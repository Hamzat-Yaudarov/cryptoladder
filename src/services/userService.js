import { query } from '../db/connection.js';

export class UserService {
  static async getUserByTelegramId(telegramId) {
    const res = await query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );
    return res.rows[0] || null;
  }

  static async createUser(telegramId, username, firstName, lastName, referrerId = null) {
    const res = await query(
      `INSERT INTO users (telegram_id, username, first_name, last_name, referrer_id, balance)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [telegramId, username, firstName, lastName, referrerId || null, 0]
    );
    return res.rows[0];
  }

  static async getUserById(id) {
    const res = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  }

  static async updateBalance(userId, amount) {
    const res = await query(
      'UPDATE users SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [amount, userId]
    );
    return res.rows[0];
  }

  static async setBalance(userId, amount) {
    const res = await query(
      'UPDATE users SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [amount, userId]
    );
    return res.rows[0];
  }

  static async getReferrals(userId) {
    const res = await query(
      `SELECT u.* FROM users u
       WHERE u.referrer_id = $1
       ORDER BY u.created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  static async getReferralCount(userId) {
    const res = await query(
      'SELECT COUNT(*) as count FROM users WHERE referrer_id = $1',
      [userId]
    );
    return parseInt(res.rows[0].count, 10);
  }

  static async getReferralTree(userId, depth = 5, currentDepth = 0) {
    if (currentDepth >= depth) return [];

    const referrals = await this.getReferrals(userId);
    const tree = [];

    for (const referral of referrals) {
      const children = await this.getReferralTree(referral.id, depth, currentDepth + 1);
      tree.push({
        ...referral,
        children,
      });
    }

    return tree;
  }

  static async getActivities(userId, limit = 50) {
    const res = await query(
      `SELECT * FROM activity_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return res.rows;
  }

  static async logActivity(userId, action, details = null) {
    const res = await query(
      `INSERT INTO activity_logs (user_id, action, details)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, action, details ? JSON.stringify(details) : null]
    );
    return res.rows[0];
  }

  static async addTransaction(userId, type, amount, description = null) {
    const res = await query(
      `INSERT INTO transactions (user_id, type, amount, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, type, amount, description]
    );
    return res.rows[0];
  }

  static async getTransactions(userId, limit = 50) {
    const res = await query(
      `SELECT * FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return res.rows;
  }
}
