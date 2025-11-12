import { query } from '../db/connection.js';
import { UserService } from './userService.js';

export class CityService {
  // City level configuration
  static CITY_LEVELS = {
    1: { houses: 2, cost: 0, minReferrals: 0, maxReferrals: 0 },
    2: { houses: 2, cost: 0, minReferrals: 0, maxReferrals: 14 },
    3: { houses: 3, cost: 0, minReferrals: 15, maxReferrals: 34 },
    4: { houses: 4, cost: 0, minReferrals: 35, maxReferrals: 69 },
    5: { houses: 5, cost: 0, minReferrals: 70, maxReferrals: Infinity },
  };

  static async getCity(userId) {
    const res = await query(
      'SELECT * FROM cities WHERE user_id = $1',
      [userId]
    );
    return res.rows[0] || null;
  }

  static async createCity(userId) {
    const res = await query(
      `INSERT INTO cities (user_id, level, total_houses)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, 1, 2]
    );

    const city = res.rows[0];

    // Create initial houses
    for (let i = 1; i <= 2; i++) {
      await query(
        'INSERT INTO houses (city_id, level) VALUES ($1, $2)',
        [city.id, i]
      );
    }

    return city;
  }

  static async getHouses(cityId) {
    const res = await query(
      'SELECT * FROM houses WHERE city_id = $1 ORDER BY level ASC',
      [cityId]
    );
    return res.rows;
  }

  static async assignResidentToHouse(cityId, level, residentId) {
    const res = await query(
      `UPDATE houses
       SET resident_id = $1
       WHERE city_id = $2 AND level = $3 AND resident_id IS NULL
       RETURNING *`,
      [residentId, cityId, level]
    );

    return res.rows[0] || null;
  }

  static async getResidentsInCity(cityId) {
    const res = await query(
      `SELECT h.level, u.* FROM houses h
       LEFT JOIN users u ON h.resident_id = u.id
       WHERE h.city_id = $1 AND h.resident_id IS NOT NULL
       ORDER BY h.level ASC`,
      [cityId]
    );
    return res.rows;
  }

  static async upgradeCity(userId, referralCount) {
    const city = await this.getCity(userId);
    if (!city) throw new Error('City not found');

    // Find appropriate level based on referral count
    let newLevel = city.level;
    for (let level = 5; level > city.level; level--) {
      const config = this.CITY_LEVELS[level];
      if (referralCount >= config.minReferrals) {
        newLevel = level;
        break;
      }
    }

    if (newLevel === city.level) {
      return city; // No upgrade needed
    }

    const newConfig = this.CITY_LEVELS[newLevel];
    const currentConfig = this.CITY_LEVELS[city.level];
    const housesToAdd = newConfig.houses - currentConfig.houses;

    // Add new houses
    const houses = await this.getHouses(city.id);
    const maxLevel = Math.max(...houses.map((h) => h.level), 0);

    for (let i = 0; i < housesToAdd; i++) {
      await query(
        'INSERT INTO houses (city_id, level) VALUES ($1, $2)',
        [city.id, maxLevel + 1 + i]
      );
    }

    // Update city level
    const res = await query(
      `UPDATE cities
       SET level = $1, total_houses = $2, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3
       RETURNING *`,
      [newLevel, newConfig.houses, userId]
    );

    return res.rows[0];
  }

  static async getCityWithDetails(userId) {
    const city = await this.getCity(userId);
    if (!city) return null;

    const houses = await this.getHouses(city.id);
    const residents = await this.getResidentsInCity(city.id);

    return {
      ...city,
      houses,
      residents,
    };
  }

  static async getHouseStructure(userId) {
    const city = await this.getCity(userId);
    if (!city) return null;

    const houses = await this.getHouses(city.id);
    const structure = [];

    for (const house of houses) {
      const resident = house.resident_id
        ? await UserService.getUserById(house.resident_id)
        : null;

      structure.push({
        level: house.level,
        resident: resident ? {
          id: resident.id,
          username: resident.username,
          firstName: resident.first_name,
        } : null,
      });
    }

    return structure;
  }
}
