const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const requireAdmin = require('./middleware/requireAdmin');
const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const productsRoutes = require('./routes/products');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage for multer
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'bloxara',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

// Middleware
app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);

// Protected admin routes
app.use('/api/orders', ordersRoutes);
app.use('/api/products', productsRoutes);

// Image upload endpoint (admin only)
app.post('/api/upload', requireAdmin, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: req.file.path }); // Cloudinary permanent URL
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