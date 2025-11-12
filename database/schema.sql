-- CityLadder Database Schema
-- Drop existing tables to ensure clean schema
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS weekly_rankings CASCADE;
DROP TABLE IF EXISTS profit_history CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS factories CASCADE;
DROP TABLE IF EXISTS houses CASCADE;
DROP TABLE IF EXISTS cities CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users (Players)
CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cities (Each user has one city)
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT UNIQUE NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
  level INT DEFAULT 1,
  total_houses INT DEFAULT 2,
  referral_code VARCHAR(255) UNIQUE NOT NULL,
  balance DECIMAL(15,2) DEFAULT 0,
  is_factory_active BOOLEAN DEFAULT FALSE,
  factory_activated_at TIMESTAMP,
  factory_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Houses (Depth levels)
CREATE TABLE houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  level INT NOT NULL,
  resident_user_id BIGINT REFERENCES users(telegram_id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Factories (Daily income sources)
CREATE TABLE factories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMP,
  expires_at TIMESTAMP,
  last_payout_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Referrals (Invite relationships)
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
  referred_user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
  house_level INT NOT NULL,
  bonus_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(referrer_user_id, referred_user_id)
);

-- Profit Distribution History
CREATE TABLE profit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
  source_user_id BIGINT REFERENCES users(telegram_id) ON DELETE SET NULL,
  amount DECIMAL(15,2) NOT NULL,
  level INT NOT NULL,
  factory_id UUID REFERENCES factories(id) ON DELETE SET NULL,
  payout_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weekly Rankings
CREATE TABLE weekly_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
  week_starting DATE NOT NULL,
  referral_count INT NOT NULL,
  rank INT,
  reward_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, week_starting)
);

-- Transactions (for Star purchases and expenses)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_cities_user_id ON cities(user_id);
CREATE INDEX idx_houses_city_id ON houses(city_id);
CREATE INDEX idx_factories_city_id ON factories(city_id);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX idx_profit_history_user ON profit_history(user_id);
CREATE INDEX idx_profit_history_time ON profit_history(payout_time);
CREATE INDEX idx_weekly_rankings_week ON weekly_rankings(week_starting);
CREATE INDEX idx_transactions_user ON transactions(user_id);
