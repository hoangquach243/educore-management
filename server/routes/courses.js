import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all courses
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM courses ORDER BY code');
    res.json(rows);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create course
router.post('/', async (req, res) => {
  try {
    const { id, code, name, credits } = req.body;
    await pool.execute('INSERT INTO courses (id, code, name, credits) VALUES (?, ?, ?, ?)', [id, code, name, credits]);
    const [rows] = await pool.execute('SELECT * FROM courses WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create course error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Course already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete course
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM courses WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

