-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  stars DECIMAL(10, 2) DEFAULT 0,
  has_bought_place BOOLEAN DEFAULT FALSE,
  parent_id BIGINT REFERENCES users(id),
  parent_position INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activation TIMESTAMP,
  inactive_days INT DEFAULT 0
);

-- Referrals table (direct invites)
CREATE TABLE IF NOT EXISTS referrals (
  id BIGSERIAL PRIMARY KEY,
  inviter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(inviter_id, invited_id)
);

-- Stars transactions table (for tracking earnings)
CREATE TABLE IF NOT EXISTS star_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(50),
  source_user_id BIGINT REFERENCES users(id),
  level INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activations table (track daily activations)
CREATE TABLE IF NOT EXISTS activations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_referrals_inviter_id ON referrals(inviter_id);
CREATE INDEX IF NOT EXISTS idx_star_transactions_user_id ON star_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_activations_user_id ON activations(user_id);
