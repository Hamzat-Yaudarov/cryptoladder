import { query } from './client.js';

export async function initDatabase() {
  try {
    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        username VARCHAR(255),
        first_name VARCHAR(255),
        referrer_id BIGINT REFERENCES users(telegram_id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Cities table
    await query(`
      CREATE TABLE IF NOT EXISTS cities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        level INTEGER DEFAULT 1,
        houses INTEGER DEFAULT 2,
        balance DECIMAL(18, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Factories table
    await query(`
      CREATE TABLE IF NOT EXISTS factories (
        id SERIAL PRIMARY KEY,
        city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT FALSE,
        activated_at TIMESTAMP,
        deactivates_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Referrals table
    await query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referred_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        level INTEGER DEFAULT 1,
        activated_factory_bonus_claimed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(referrer_id, referred_id)
      );
    `);

    // Transactions table
    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(18, 2) NOT NULL,
        description TEXT,
        source_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        level_income_from INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed BOOLEAN DEFAULT FALSE
      );
    `);

    // Weekly ratings table
    await query(`
      CREATE TABLE IF NOT EXISTS weekly_ratings (
        id SERIAL PRIMARY KEY,
        week_start DATE NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referral_count INTEGER DEFAULT 0,
        rank INTEGER,
        reward_claimed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(week_start, user_id)
      );
    `);

    // Добавить updated_at колонку если её нет (для существующих БД)
    try {
      await query(`
        ALTER TABLE weekly_ratings
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `);
    } catch (err) {
      if (err.code !== '42701') { // 42701 = column already exists
        console.warn('⚠️ Could not add updated_at to weekly_ratings:', err.message);
      }
    }

    // Indexes for performance
    await query(`CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_cities_user_id ON cities(user_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_factories_city_id ON factories(city_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_weekly_ratings_week_start ON weekly_ratings(week_start);`);

    console.log('✅ Database schema initialized');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}
