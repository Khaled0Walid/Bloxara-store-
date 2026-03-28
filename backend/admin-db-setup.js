require('dotenv').config();
const pool = require('./db');

async function setupAdminDB() {
    try {
        console.log("⏳ Setting up Admin Dashboard Orders table...");

        // Drop existing orders table
        await pool.query('DROP TABLE IF EXISTS orders CASCADE');

        // Recreate orders table with the exact schema requested
        await pool.query(`
            CREATE TABLE orders (
                id SERIAL PRIMARY KEY,
                shopify_order_id TEXT,
                customer_email TEXT,
                roblox_username TEXT,
                item_id TEXT,
                price DECIMAL NOT NULL,
                status TEXT DEFAULT 'Pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ New orders table created!");

        const dummyOrders = [
            { shopify_order_id: '#1001', customer_email: 'player1@gmail.com', roblox_username: 'BloxMaster99', item_id: 'Neon Core Blade', price: 15.00, status: 'Completed' },
            { shopify_order_id: '#1002', customer_email: 'gamergirl@yahoo.com', roblox_username: 'xX_ShadowSniper_Xx', item_id: 'Void Walkers', price: 25.50, status: 'Pending' },
            { shopify_order_id: '#1003', customer_email: 'testuser123@hotmail.com', roblox_username: 'Guest1234', item_id: 'Quantum Helm', price: 30.00, status: 'Awaiting Trade' },
            { shopify_order_id: '#1004', customer_email: 'admin_buyer@bloxara.io', roblox_username: 'EliteTrader', item_id: 'Cyberpunk Jacket', price: 12.99, status: 'Trade Sent' }
        ];

        for (const order of dummyOrders) {
            await pool.query(
                'INSERT INTO orders (shopify_order_id, customer_email, roblox_username, item_id, price, status) VALUES ($1, $2, $3, $4, $5, $6)',
                [order.shopify_order_id, order.customer_email, order.roblox_username, order.item_id, order.price, order.status]
            );
        }

        console.log("✅ Inserted dummy orders for the Admin Dashboard!");
    } catch (error) {
        console.error("❌ Error setting up admin DB:", error);
    } finally {
        pool.end();
    }
}

setupAdminDB();

