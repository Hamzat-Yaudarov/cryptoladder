import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export async function initializeDatabase() {
  try {
    // Test connection first
    const testRes = await pool.query('SELECT NOW()');
    console.log('✅ Database connected at:', testRes.rows[0].now);

    // Check if users table exists
    const tableCheckRes = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
      )`
    );

    if (!tableCheckRes.rows[0].exists) {
      console.log('📝 Creating database schema...');
      const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schema);
      console.log('✅ Database schema created successfully');
    } else {
      console.log('✅ Database schema already exists');

      // Show users table structure
      const columnsRes = await pool.query(
        `SELECT column_name, data_type
         FROM information_schema.columns
         WHERE table_name = 'users'
         ORDER BY ordinal_position`
      );
      console.log('📋 Users table structure:');
      columnsRes.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

export async function query(text, params) {
  const start = Date.now();
  try {
    // Log query parameters for debugging
    if (params && params.length > 0) {
      console.log('🔹 Query params:', params.map((p, i) => `$${i + 1}=${p} (${typeof p})`).join(', '));
    }

    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Executed query', { text: text.substring(0, 80), duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('💥 Database query error:', error.message);
    console.error('   Query:', text.substring(0, 80));
    if (params && params.length > 0) {
      console.error('   Params:', params.map((p, i) => `$${i + 1}=${p} (${typeof p})`).join(', '));
    }
    throw error;
  }
}

export async function getClient() {
  return pool.connect();
}

export async function closeDatabase() {
  await pool.end();
}

export default pool;
