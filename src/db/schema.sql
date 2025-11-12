-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  balance DECIMAL(12, 2) DEFAULT 0,
  referrer_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id)
);

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  level INTEGER DEFAULT 1,
  total_houses INTEGER DEFAULT 2,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Houses table
CREATE TABLE IF NOT EXISTS houses (
  id BIGSERIAL PRIMARY KEY,
  city_id BIGINT NOT NULL,
  level INTEGER NOT NULL,
  resident_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE,
  FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Factories table
CREATE TABLE IF NOT EXISTS factories (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMP,
  activated_until TIMESTAMP,
  last_profit_calculation TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Profit distribution history
CREATE TABLE IF NOT EXISTS profit_distributions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  source_user_id BIGINT NOT NULL,
  level INTEGER NOT NULL,
  amount DECIMAL(12, 4) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Weekly rankings
CREATE TABLE IF NOT EXISTS weekly_rankings (
  id BIGSERIAL PRIMARY KEY,
  week_start DATE NOT NULL,
  user_id BIGINT NOT NULL,
  referral_count INTEGER NOT NULL,
  rank INTEGER,
  reward DECIMAL(12, 2),
  claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(week_start, user_id)
);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Transactions (balance changes)
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_referrer_id ON users(referrer_id);
CREATE INDEX IF NOT EXISTS idx_cities_user_id ON cities(user_id);
CREATE INDEX IF NOT EXISTS idx_houses_city_id ON houses(city_id);
CREATE INDEX IF NOT EXISTS idx_houses_resident_id ON houses(resident_id);
CREATE INDEX IF NOT EXISTS idx_factories_user_id ON factories(user_id);
CREATE INDEX IF NOT EXISTS idx_factories_is_active ON factories(is_active);
CREATE INDEX IF NOT EXISTS idx_profit_distributions_user_id ON profit_distributions(user_id);
CREATE INDEX IF NOT EXISTS idx_profit_distributions_created_at ON profit_distributions(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
