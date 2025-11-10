import { query } from '../db.js';

export async function purchaseStars(userId, amount, provider = 'telegram-stars') {
  try {
    if (amount <= 0) {
      throw new Error('Invalid amount');
    }

    // Credit user's balance
    await query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, userId]);

    // Log payment
    await query('INSERT INTO payments (user_id, stars_amount, provider) VALUES ($1, $2, $3)', [userId, amount, provider]);

    return { success: true, amount };
  } catch (error) {
    console.error('Payment service error:', error);
    throw error;
  }
}
