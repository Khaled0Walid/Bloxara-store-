require('dotenv').config();
const pool = require('./db');

async function seedDB() {
    try {
        console.log("⏳ Seeding database with dummy products...");

        const products = [
            { name: 'Neon Core Blade', description: 'A glowing blade from the future.', price: 15.00, image_url: 'https://tr.rbxcdn.com/f9dfa2a3036c0fddc407ac948281358b/150/150/Hat/Png', stock: 100 },
            { name: 'Void Walkers', description: 'Shoes that let you step through dimensions.', price: 25.50, image_url: 'https://tr.rbxcdn.com/83c52e8dabc0404494d485121bbcf2ed/150/150/Hat/Png', stock: 50 },
            { name: 'Quantum Helm', description: 'Protects against all molecular attacks.', price: 30.00, image_url: 'https://tr.rbxcdn.com/39eddef6324ac5db9766bbde931c89f2/150/150/Hat/Png', stock: 20 },
            { name: 'Cyberpunk Jacket', description: 'Stay warm in the digital rain.', price: 12.99, image_url: 'https://tr.rbxcdn.com/9796ed0eebd272e5ae6d4da761358d7c/150/150/Hat/Png', stock: 200 }
        ];

        for (const p of products) {
            await pool.query(
                'INSERT INTO products (name, description, price, image_url, stock) VALUES ($1, $2, $3, $4, $5)',
                [p.name, p.description, p.price, p.image_url, p.stock]
            );
        }

        console.log("✅ Successfully added sample products to the database!");
    } catch (error) {
        console.error("❌ Error seeding database:", error);
    } finally {
        pool.end();
    }
}

seedDB();

