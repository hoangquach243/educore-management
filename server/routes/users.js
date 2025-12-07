import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, is_active, phone, address, personal_email FROM users ORDER BY role, id'
    );
    res.json(rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, is_active, phone, address, personal_email FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create user
router.post('/', async (req, res) => {
  try {
    const { id, name, email, password, role, phone, address, personal_email, is_active } = req.body;
    
    await pool.execute(
      'INSERT INTO users (id, name, email, password, role, phone, address, personal_email, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, password || '123', role, phone || null, address || null, personal_email || null, is_active !== undefined ? is_active : true]
    );
    
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, is_active, phone, address, personal_email FROM users WHERE id = ?',
      [id]
    );
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'User already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role, phone, address, personal_email, is_active } = req.body;
    const originalId = req.params.id;
    
    await pool.execute(
      'UPDATE users SET name = ?, email = ?, role = ?, phone = ?, address = ?, personal_email = ?, is_active = ? WHERE id = ?',
      [name, email, role, phone || null, address || null, personal_email || null, is_active !== undefined ? is_active : true, originalId]
    );
    
    // If ID changed, update foreign keys in other tables
    if (req.body.id && req.body.id !== originalId) {
      await pool.execute('UPDATE teaching_assignments SET teacher_id = ? WHERE teacher_id = ?', [req.body.id, originalId]);
      await pool.execute('UPDATE enrollments SET student_id = ? WHERE student_id = ?', [req.body.id, originalId]);
      await pool.execute('UPDATE grades SET student_id = ? WHERE student_id = ?', [req.body.id, originalId]);
      await pool.execute('UPDATE grade_configs SET teacher_id = ? WHERE teacher_id = ?', [req.body.id, originalId]);
      await pool.execute('UPDATE users SET id = ? WHERE id = ?', [req.body.id, originalId]);
    }
    
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, is_active, phone, address, personal_email FROM users WHERE id = ?',
      [req.body.id || originalId]
    );
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify password
router.post('/:id/verify-password', async (req, res) => {
  try {
    const { password } = req.body;
    const [rows] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const isValid = rows[0].password === password;
    res.json({ valid: isValid });
  } catch (error) {
    console.error('Verify password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update password
router.patch('/:id/password', async (req, res) => {
  try {
    const { password } = req.body;
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [password, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

