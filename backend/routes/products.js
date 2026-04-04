const express = require('express');
const router = express.Router();
const pool = require('../db');
const requireAdmin = require('../middleware/requireAdmin');

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cloudinary storage config
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'bloxara',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/products
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching product:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/products (Create with Cloudinary Image Upload) — Admin only
router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, old_price, stock } = req.body;

        if (!name || !price) {
            return res.status(400).json({ error: 'Name and price are required' });
        }

        // Cloudinary gives a permanent URL in req.file.path
        const image_url = req.file ? req.file.path : '';

        const result = await pool.query(
            'INSERT INTO products (name, description, price, old_price, image_url, stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, description, price, old_price || null, image_url, stock || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating product:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/products/:id — Admin only
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted', product: result.rows[0] });
    } catch (err) {
        console.error("Error deleting product:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;