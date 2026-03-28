require('dotenv').config();
const pool = require('./db');

async function initDB() {
    try {
        console.log("⏳ Initializing database...");
        
        // Create the highly secure Users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Users table is ready!");

        // Create Products table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                price DECIMAL NOT NULL,
                image_url TEXT,
                stock INT DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Products table is ready!");

        // Create Orders table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                total_amount DECIMAL NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Orders table is ready!");

        // Create Inventory (User Items) table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                product_id INT REFERENCES products(id) ON DELETE CASCADE,
                quantity INT DEFAULT 1,
                acquired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Inventory table is ready!");
        console.log("🎉 Database initialization complete.");
    } catch (error) {
        console.error("❌ Error initializing database:", error);
    } finally {
        pool.end();
    }
}

initDB();

