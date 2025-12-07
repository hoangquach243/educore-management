import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all assignments
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM teaching_assignments');
    res.json(rows.map(row => ({
      id: row.id,
      teacherId: row.teacher_id,
      courseId: row.course_id,
      classId: row.class_id
    })));
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create assignment
router.post('/', async (req, res) => {
  try {
    const { id, teacherId, courseId, classId } = req.body;
    const assignmentId = id || `assign_${Date.now()}`;
    await pool.execute('INSERT INTO teaching_assignments (id, teacher_id, course_id, class_id) VALUES (?, ?, ?, ?)',
      [assignmentId, teacherId, courseId, classId]);
    res.status(201).json({ id: assignmentId, teacherId, courseId, classId });
  } catch (error) {
    console.error('Create assignment error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Assignment already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Update assignment
router.put('/:id', async (req, res) => {
  try {
    const { teacherId, courseId, classId } = req.body;
    await pool.execute('UPDATE teaching_assignments SET teacher_id = ?, course_id = ?, class_id = ? WHERE id = ?',
      [teacherId, courseId, classId, req.params.id]);
    res.json({ id: req.params.id, teacherId, courseId, classId });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete assignment
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM teaching_assignments WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

