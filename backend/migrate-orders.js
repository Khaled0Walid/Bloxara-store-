require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🔧 Running orders table migration...');
        
        // Add missing columns if they don't exist
        await client.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            ADD COLUMN IF NOT EXISTS order_ref VARCHAR(50) UNIQUE,
            ADD COLUMN IF NOT EXISTS item_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS item_image VARCHAR(500),
            ADD COLUMN IF NOT EXISTS discord_handle VARCHAR(100),
            ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
        `);
        
        console.log('✅ Migration complete! New columns added to orders table.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
