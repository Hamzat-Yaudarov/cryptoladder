import pool from './connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeDatabase() {
  let client;

  try {
    console.log('📦 Connecting to database...');

    // Try to connect with timeout
    const connectPromise = pool.connect();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), 10000)
    );

    client = await Promise.race([connectPromise, timeoutPromise]);
    console.log('✅ Database connected');

    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split by semicolons and execute each statement
    const statements = schema.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await client.query(statement);
      }
    }

    console.log('✅ Database schema initialized');

    // Create root admin user if it doesn't exist
    const existingAdmin = await client.query(
      `SELECT id FROM users WHERE telegram_id = $1`,
      [999999999]
    );

    if (existingAdmin.rows.length === 0) {
      await client.query(
        `INSERT INTO users (telegram_id, username, first_name, last_name, has_bought_place, stars, parent_id)
         VALUES ($1, $2, $3, $4, $5, $6, NULL)`,
        [999999999, 'admin', 'Crypto', 'Ladder', true, 0]
      );
      console.log('✅ Root admin user created');
    }

    // Verify tables exist
    const tables = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );

    const tableNames = tables.rows.map(row => row.table_name).sort();
    console.log(`📊 Tables: ${tableNames.join(', ')}`);

    return true;

  } catch (err) {
    console.error('⚠️  Database initialization warning:', err.message);
    console.error('🔍 Diagnostics:');
    console.error('   - Check DATABASE_URL environment variable');
    console.error('   - Verify Neon database is accessible');
    console.error('   - Check that connection string is correct');
    console.error('   - Server will continue without database (read-only mode)');
    // Don't throw - just log and continue
    // Database might be initialized later or server might work in limited mode
    return false;
  } finally {
    if (client) {
      try {
        client.release();
      } catch (e) {
        // Ignore release errors
      }
    }
  }
}

export default initializeDatabase;
