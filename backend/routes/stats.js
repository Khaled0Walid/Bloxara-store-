const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/stats
router.get('/', async (req, res) => {
    try {
        const ordersCount = await pool.query('SELECT COUNT(*) FROM orders');
        const productsCount = await pool.query('SELECT COUNT(*) FROM products');
        const usersCount = await pool.query('SELECT COUNT(*) FROM users');
        const totalRevenue = await pool.query('SELECT SUM(price) FROM orders WHERE status = \'Completed\' OR status = \'Fulfilled\'');

        res.json({
            orders: parseInt(ordersCount.rows[0].count),
            products: parseInt(productsCount.rows[0].count),
            users: parseInt(usersCount.rows[0].count),
            revenue: parseFloat(totalRevenue.rows[0].sum || 0)
        });
    } catch (err) {
        console.error("Error fetching stats:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
