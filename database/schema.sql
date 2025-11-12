-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  balance DECIMAL(18, 2) DEFAULT 0,
  total_referrals INT DEFAULT 0,
  is_city_active BOOLEAN DEFAULT FALSE,
  city_level INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_profit_claim TIMESTAMP,
  referrer_id BIGINT REFERENCES users(telegram_id) ON DELETE SET NULL
);

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
  houses INT DEFAULT 2,
  factory_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Residents table (referrals/inhabitants)
CREATE TABLE IF NOT EXISTS residents (
  id SERIAL PRIMARY KEY,
  city_owner_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
  resident_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
  level INT DEFAULT 1,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(city_owner_id, resident_id)
);

-- Factories table (active factory runs)
CREATE TABLE IF NOT EXISTS factories (
  id SERIAL PRIMARY KEY,
  owner_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
  activated_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profit distribution history
CREATE TABLE IF NOT EXISTS profit_history (
  id SERIAL PRIMARY KEY,
  earner_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
  factory_owner_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
  level INT NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weekly ratings
CREATE TABLE IF NOT EXISTS weekly_ratings (
  id SERIAL PRIMARY KEY,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
  position INT NOT NULL,
  referral_count INT NOT NULL,
  reward DECIMAL(18, 2),
  reward_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(week_start, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_cities_user_id ON cities(user_id);
CREATE INDEX IF NOT EXISTS idx_residents_city_owner ON residents(city_owner_id);
CREATE INDEX IF NOT EXISTS idx_residents_level ON residents(level);
CREATE INDEX IF NOT EXISTS idx_factories_owner_active ON factories(owner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_profit_history_earner ON profit_history(earner_id);
CREATE INDEX IF NOT EXISTS idx_profit_history_owner ON profit_history(factory_owner_id);
CREATE INDEX IF NOT EXISTS idx_weekly_ratings_week ON weekly_ratings(week_start);
