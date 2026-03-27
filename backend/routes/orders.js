const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/orders
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                id, item_id, item_name, item_image, order_ref, customer_email,
                roblox_username, discord_handle, status, created_at, price, quantity
            FROM orders
            ORDER BY created_at DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching orders:", err);
        res.status(500).json({ error: 'Server error while fetching orders' });
    }
});

// GET /api/orders/user/:userId — orders for one user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            `SELECT id, item_id, item_name, item_image, order_ref, status, created_at, price, quantity, discord_handle
             FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching user orders:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/orders — create a new order
router.post('/', async (req, res) => {
    const { user_id, item_id, item_name, item_image, order_ref, customer_email, discord_handle, price, quantity } = req.body;
    const qty = parseInt(quantity) || 1;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Stock check (only if item_id is provided)
        if (item_id) {
            const stockRes = await client.query(
                'SELECT stock FROM products WHERE id = $1 FOR UPDATE', [item_id]
            );
            if (stockRes.rows.length > 0) {
                const currentStock = parseInt(stockRes.rows[0].stock);
                if (currentStock < qty) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ error: 'out_of_stock', message: 'This item is out of stock.' });
                }
                // 2. Decrement stock
                await client.query(
                    'UPDATE products SET stock = stock - $1 WHERE id = $2', [qty, item_id]
                );
            }
        }

        // 3. Insert order
        const result = await client.query(
            `INSERT INTO orders (user_id, item_id, item_name, item_image, order_ref, customer_email, discord_handle, price, quantity, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending') RETURNING *`,
            [user_id || null, item_id || null, item_name || 'Unknown Item', item_image || null,
             order_ref, customer_email || null, discord_handle, price || 0, qty]
        );
        await client.query('COMMIT');
        const order = result.rows[0];

        // 4. Discord webhook notification (non-blocking)
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
        if (webhookUrl) {
            const embed = {
                embeds: [{
                    title: '🛒 New Order Received!',
                    color: 0x45f3ff,
                    fields: [
                        { name: 'Order Ref',   value: `\`${order.order_ref}\``,             inline: true },
                        { name: 'Item',        value: order.item_name || '—',               inline: true },
                        { name: 'Price',       value: `$${Number(order.price).toFixed(2)}`, inline: true },
                        { name: 'Discord',     value: order.discord_handle || '—',          inline: true },
                        { name: 'Qty',         value: String(order.quantity),               inline: true },
                        { name: 'Buyer Email', value: order.customer_email || 'Guest',      inline: true },
                    ],
                    timestamp: new Date().toISOString(),
                    footer: { text: 'Bloxara Admin' }
                }]
            };
            fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(embed)
            }).catch(e => console.warn('Discord webhook failed:', e.message));
        }

        res.status(201).json(order);
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Error creating order:', err);
        res.status(500).json({ error: 'Failed to create order' });
    } finally {
        client.release();
    }
});


// PATCH /api/orders/:id/status — update order status
router.patch('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['Pending', 'Awaiting Trade', 'Trade Sent', 'Fulfilled', 'Completed'];
    if (!allowed.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    try {
        const result = await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Order not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
