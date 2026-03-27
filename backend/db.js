const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }  // required for Supabase
});

// Test connection
pool.connect()
    .then(() => console.log('✅ DB Connected'))
    .catch(err => console.error('❌ DB Connection Error', err.stack));

module.exports = pool;




