const jwt = require('jsonwebtoken');
const pool = require('../db');

/**
 * Middleware: verifies JWT and checks the user has admin role.
 * Attach as middleware to any route that requires admin access.
 */
async function requireAdmin(req, res, next) {
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized — no token provided' });
    }
    const token = auth.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Verify user still exists and still has admin role in DB
        const result = await pool.query('SELECT id, role FROM users WHERE id = $1', [decoded.id]);
        if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden — admin access required' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = requireAdmin;
