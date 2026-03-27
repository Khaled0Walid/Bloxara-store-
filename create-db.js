require('dotenv').config();
const { Client } = require('pg');

async function createDatabase() {
    const client = new Client({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'postgres', // Connect to default DB first to create the new one
    });

    try {
        await client.connect();
        const res = await client.query('SELECT datname FROM pg_database WHERE datname = $1', [process.env.DB_NAME]);
        if (res.rowCount === 0) {
            console.log(`⏳ Database "${process.env.DB_NAME}" not found, creating it...`);
            await client.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
            console.log(`✅ Database "${process.env.DB_NAME}" created successfully.`);
        } else {
            console.log(`✅ Database "${process.env.DB_NAME}" already exists.`);
        }
    } catch (err) {
        console.error("❌ Error creating database:", err);
    } finally {
        await client.end();
    }
}

createDatabase();

