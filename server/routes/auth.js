import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, is_active, phone, address, personal_email FROM users WHERE (email = ? OR id = ?) AND password = ?',
      [email, email, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];
    
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is locked' });
    }

    // Remove password from response
    delete user.password;
    res.json({ success: true, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

