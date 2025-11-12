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

    // Split statements by semicolon and clean them
    const statements = schema
      .split(';')
      .map(stmt => {
        // Remove SQL comments and trim
        return stmt
          .split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n')
          .trim();
      })
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      try {
        await query(statement);
      } catch (error) {
        console.error(`Failed to execute statement: ${statement.substring(0, 50)}...`);
        throw error;
      }
    }
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export default pool;
