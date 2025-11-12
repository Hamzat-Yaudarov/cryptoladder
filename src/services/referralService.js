import { query } from '../db/connection.js';
import { UserService } from './userService.js';
import { CityService } from './cityService.js';

export class ReferralService {
  static async generateReferralLink(userId) {
    // Simple referral link format
    return `${process.env.MINIAPP_URL}?start=${userId}`;
  }

  static async processReferral(referrerId, newUserId) {
    // Link new user to referrer
    const res = await query(
      'UPDATE users SET referrer_id = $1 WHERE id = $2 RETURNING *',
      [referrerId, newUserId]
    );

    const newUser = res.rows[0];

    // Try to assign new user as resident in referrer's city
    const referrerCity = await CityService.getCity(referrerId);
    if (referrerCity) {
      const houses = await CityService.getHouses(referrerCity.id);
      for (const house of houses) {
        if (!house.resident_id) {
          await CityService.assignResidentToHouse(referrerCity.id, house.level, newUserId);
          break;
        }
      }
    }

    // Log activity
    await UserService.logActivity(referrerId, 'REFERRAL_JOINED', { referral_id: newUserId });

    return newUser;
  }

  static async giveBonusForFirstFactoryActivation(userId, sourcedUserId) {
    const bonus = parseFloat(process.env.REFERRAL_BONUS) || 0.5;

    // Give bonus to referrer
    await UserService.updateBalance(sourcedUserId, bonus);

    // Log activity
    await UserService.logActivity(sourcedUserId, 'REFERRAL_BONUS_RECEIVED', {
      referral_id: userId,
      bonus_amount: bonus,
    });

    await UserService.addTransaction(sourcedUserId, 'REFERRAL_BONUS', bonus, `Bonus for referral first activation`);
  }

  static async getReferralTree(userId, depth = 5) {
    return UserService.getReferralTree(userId, depth);
  }

  static async getReferralCount(userId) {
    return UserService.getReferralCount(userId);
  }

  static async getReferrals(userId) {
    return UserService.getReferrals(userId);
  }

  static async getReferralStats(userId) {
    const referralCount = await this.getReferralCount(userId);
    const referrals = await this.getReferrals(userId);

    // Count active referrals (those with active factories)
    let activeCount = 0;
    for (const referral of referrals) {
      const factory = await query(
        'SELECT * FROM factories WHERE user_id = $1 AND is_active = true',
        [referral.id]
      );
      if (factory.rows.length > 0) {
        activeCount++;
      }
    }

    return {
      totalReferrals: referralCount,
      activeReferrals: activeCount,
      inactiveReferrals: referralCount - activeCount,
    };
  }

  static async getReferer(userId) {
    const res = await query(
      `SELECT u.* FROM users u
       WHERE u.id = (
         SELECT referrer_id FROM users WHERE id = $1
       )`,
      [userId]
    );
    return res.rows[0] || null;
  }
}
