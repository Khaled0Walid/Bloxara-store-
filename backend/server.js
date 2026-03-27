const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const requireAdmin = require('./middleware/requireAdmin');
const ordersRoutes   = require('./routes/orders');
const productsRoutes = require('./routes/products');
const statsRoutes    = require('./routes/stats');

const app = express();
const PORT = 5000;

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
        cb(null, unique + path.extname(file.originalname).toLowerCase());
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Public routes (no auth needed for storefront reads)
app.use('/api/stats', statsRoutes);

// Protected admin routes
app.use('/api/orders',   ordersRoutes);   // individual routes check auth as needed
app.use('/api/products', productsRoutes); // same

// Image upload endpoint (admin only)
app.post('/api/upload', requireAdmin, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    res.json({ url });
});

// Users listing (admin only)
app.get('/api/users', requireAdmin, async (req, res) => {
    const pool = require('./db');
    try {
        const result = await pool.query(
            'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🎮 Admin Backend running on http://localhost:${PORT}`);
    const pool = require('./db');
    pool.query('SELECT 1').then(() => console.log('✅ Admin DB Connected')).catch(console.error);
});

