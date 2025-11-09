import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function initializeDatabase() {
  try {
    console.log('Инициализация схемы базы данных...');

    // Создание таблиц
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        username VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        balance DECIMAL(18, 2) DEFAULT 0,
        parent_id INTEGER REFERENCES users(id),
        position_in_parent INTEGER DEFAULT NULL,
        is_active BOOLEAN DEFAULT FALSE,
        last_activation TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS activations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        activation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expiry_date TIMESTAMP,
        stars_spent INTEGER DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        referrer_id INTEGER NOT NULL REFERENCES users(id),
        referred_id INTEGER NOT NULL REFERENCES users(id),
        is_first_activation_bonus_claimed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(referrer_id, referred_id)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS earnings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        earned_from_id INTEGER REFERENCES users(id),
        level INTEGER,
        amount DECIMAL(18, 2),
        type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        stars_spent INTEGER DEFAULT 3,
        purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Добавление недостающих колонок в существующие таблицы
    await addColumnIfNotExists('users', 'photo_url', 'TEXT');

    // Создание индексов
    await createIndexIfNotExists('idx_users_telegram_id', 'users', 'telegram_id');
    await createIndexIfNotExists('idx_users_parent_id', 'users', 'parent_id');
    await createIndexIfNotExists('idx_activations_user_id', 'activations', 'user_id');
    await createIndexIfNotExists('idx_referrals_referrer_id', 'referrals', 'referrer_id');
    await createIndexIfNotExists('idx_earnings_user_id', 'earnings', 'user_id');

    console.log('Схема базы данных инициализирована успешно');
  } catch (error) {
    console.error('Ошибка инициализации базы данных:', error);
    throw error;
  }
}

async function addColumnIfNotExists(tableName, columnName, columnType) {
  try {
    const checkColumn = await query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_name = $1 AND column_name = $2`,
      [tableName, columnName]
    );

    if (checkColumn.rows.length === 0) {
      await query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType};`);
      console.log(`Колонка ${columnName} добавлена в таблицу ${tableName}`);
    }
  } catch (error) {
    console.warn(`Предупреждение: не удалось добавить колонку ${columnName}:`, error.message);
  }
}

async function createIndexIfNotExists(indexName, tableName, columnName) {
  try {
    // Проверка существования индекса
    const checkIndex = await query(
      `SELECT 1 FROM pg_indexes WHERE indexname = $1`,
      [indexName]
    );

    if (checkIndex.rows.length === 0) {
      // Проверка существования колонки перед созданием индекса
      const checkColumn = await query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = $1 AND column_name = $2`,
        [tableName, columnName]
      );

      if (checkColumn.rows.length > 0) {
        await query(`CREATE INDEX ${indexName} ON ${tableName}(${columnName});`);
        console.log(`Индекс ${indexName} создан`);
      } else {
        console.warn(`Предупреждение: колонка ${columnName} не существует в таблице ${tableName}, индекс не создан`);
      }
    }
  } catch (error) {
    console.warn(`Предупре��дение: не удалось создать индекс ${indexName}:`, error.message);
  }
}

export default pool;
