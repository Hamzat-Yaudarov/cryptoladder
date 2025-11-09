import pool from '../src/db/connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Initializing database schema...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '../src/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await client.query(schema);
    
    console.log('✓ Database schema created successfully');
    
    // Create initial root user (creator/admin)
    const rootUser = await client.query(
      `INSERT INTO users (telegram_id, username, first_name, last_name, has_bought_place, stars)
       VALUES (999999999, 'admin', 'Crypto', 'Ladder')
       ON CONFLICT (telegram_id) DO NOTHING
       RETURNING *`
    );
    
    if (rootUser.rows.length > 0) {
      console.log('✓ Root admin user created');
    } else {
      console.log('✓ Root admin user already exists');
    }
    
    // Verify tables
    const tables = await client.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public'`
    );
    
    console.log('\nCreated tables:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

initializeDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
