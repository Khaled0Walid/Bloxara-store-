const express = require('express');
const router = express.Router();
const pool = require('../db');

const multer = require('multer');
const path = require('path');

// Configure Multer for local storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/')); // Save to the backend/uploads folder
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

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

// POST /api/products (Create with Image Upload)
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, old_price, stock } = req.body;
        
        if (!name || !price) {
            return res.status(400).json({ error: 'Name and price are required' });
        }

        let image_url = '';
        if (req.file) {
            // Build the URL to the static file.
            // Example result: http://localhost:5000/uploads/162384732-4938.jpg
            image_url = `http://localhost:5000/uploads/${req.file.filename}`;
        }

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

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
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
