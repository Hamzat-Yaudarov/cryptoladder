import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executed', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
}

export async function getClient() {
  const client = await pool.connect();
  return client;
}

export async function initializeDatabase() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const schemaPath = path.default.join(process.cwd(), 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split statements by semicolon and clean them properly
    const statements = schema
      .split(';')
      .map(stmt => {
        // Remove SQL comments (both inline and line-based)
        const lines = stmt
          .split('\n')
          .map(line => {
            // Remove inline comments
            const commentIndex = line.indexOf('--');
            return commentIndex === -1 ? line : line.substring(0, commentIndex);
          })
          .filter(line => line.trim().length > 0)
          .join('\n');

        return lines.trim();
      })
      .filter(stmt => stmt.length > 0);

    console.log(`🗄️ Выполнение ${statements.length} SQL операций...`);

    // Optionally drop existing tables only when explicitly requested
    const shouldDrop = process.env.RESET_DB === 'true';
    if (shouldDrop) {
      const tableDropOrder = ['weekly_ratings', 'profit_history', 'factories', 'residents', 'cities', 'users'];
      for (const table of tableDropOrder) {
        try {
          await query(`DROP TABLE IF EXISTS ${table} CASCADE`);
          console.log(`✓ Таблица ${table} удалена`);
        } catch (error) {
          console.warn(`⚠️ Не удалось удалить ${table}: ${error.message}`);
        }
      }
    }

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await query(statement);
      } catch (error) {
        // Ignore "already exists" errors for indexes
        if (error.message.includes('already exists') || error.code === '42P07') {
          console.log(`⚠️ Пропущено (уже существует): ${statement.substring(0, 50)}...`);
          continue;
        }
        // Ignore "duplicate key" errors for constraints
        if (error.code === '42710') {
          console.log(`⚠️ Пропущено (дублирование): ${statement.substring(0, 50)}...`);
          continue;
        }

        console.error(`❌ Ошибка в операции ${i + 1}/${statements.length}:`);
        console.error(`SQL: ${statement.substring(0, 100)}...`);
        console.error(`Ошибка: ${error.message}`);
        throw error;
      }
    }
    console.log('✅ Схема базы данных успешно инициализирована');
  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error.message);
    throw error;
  }
}

export default pool;
