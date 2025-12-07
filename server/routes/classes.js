import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all classes
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM classes ORDER BY semester DESC, id');
    res.json(rows);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get class by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM classes WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create class
router.post('/', async (req, res) => {
  try {
    const { id, name, semester, course_id } = req.body;
    await pool.execute('INSERT INTO classes (id, name, semester, course_id) VALUES (?, ?, ?, ?)', 
      [id, name, semester, course_id]);
    const [rows] = await pool.execute('SELECT * FROM classes WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Initialize semester (create classes for all courses)
router.post('/initialize-semester', async (req, res) => {
  try {
    const { semester } = req.body;
    const [courses] = await pool.execute('SELECT id, code FROM courses');
    const classes = [];
    
    for (const course of courses) {
      const classId = `${course.code}_L01_${semester}`.replace(/\s+/g, '-').toUpperCase();
      try {
        await pool.execute('INSERT INTO classes (id, name, semester, course_id) VALUES (?, ?, ?, ?)',
          [classId, 'L01', semester, course.id]);
        classes.push({ id: classId, name: 'L01', semester, courseId: course.id });
      } catch (err) {
        // Ignore duplicate entries
        if (err.code !== 'ER_DUP_ENTRY') throw err;
      }
    }
    
    res.status(201).json(classes);
  } catch (error) {
    console.error('Initialize semester error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete class
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM classes WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

