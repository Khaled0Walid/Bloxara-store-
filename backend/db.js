const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' }); // Read from main project

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

// Test connection
pool.connect()
    .then(() => console.log('✅ Admin DB Connected'))
    .catch(err => console.error('❌ Admin DB Connection Error', err.stack));

module.exports = pool;

