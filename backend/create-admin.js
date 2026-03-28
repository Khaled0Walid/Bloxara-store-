require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcrypt');

async function createAdmin() {
    try {
        console.log("⏳ Creating primary Admin account...");
        
        const username = 'khaled';
        const password = 'anis1232';
        const email = 'khaled@bloxara.io';
        
        // Check if admin already exists
        const check = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (check.rows.length > 0) {
            console.log("⚠️ Admin account already exists!");
        } else {
            // Hash password and insert
            const hash = await bcrypt.hash(password, 10);
            await pool.query(
                `INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, 'admin')`,
                [username, email, hash]
            );
            console.log(`✅ Admin account created successfully!`);
            console.log(`➡️ Username: ${username}`);
            console.log(`➡️ Password: ${password}`);
        }
        
    } catch (error) {
        console.error("❌ Error creating admin:", error);
    } finally {
        pool.end();
    }
}

createAdmin();

