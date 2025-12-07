import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all enrollments
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM enrollments');
    res.json(rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      classId: row.class_id,
      courseId: row.course_id
    })));
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Enroll student
router.post('/', async (req, res) => {
  try {
    const { studentId, classId, courseId } = req.body;
    const enrollmentId = `enr_${Date.now()}`;
    
    // Check if already enrolled
    const [existing] = await pool.execute(
      'SELECT * FROM enrollments WHERE student_id = ? AND class_id = ?',
      [studentId, classId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Student already enrolled' });
    }
    
    await pool.execute('INSERT INTO enrollments (id, student_id, class_id, course_id) VALUES (?, ?, ?, ?)',
      [enrollmentId, studentId, classId, courseId]);
    
    // Create grade record if not exists
    const [gradeExists] = await pool.execute(
      'SELECT * FROM grades WHERE student_id = ? AND class_id = ?',
      [studentId, classId]
    );
    
    if (gradeExists.length === 0) {
      const gradeId = `g_${enrollmentId}`;
      await pool.execute(
        'INSERT INTO grades (id, student_id, class_id, course_id, is_submitted, is_locked) VALUES (?, ?, ?, ?, FALSE, FALSE)',
        [gradeId, studentId, classId, courseId]
      );
    }
    
    res.status(201).json({ id: enrollmentId, studentId, classId, courseId });
  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove student
router.delete('/:studentId/:classId', async (req, res) => {
  try {
    await pool.execute('DELETE FROM enrollments WHERE student_id = ? AND class_id = ?',
      [req.params.studentId, req.params.classId]);
    await pool.execute('DELETE FROM grades WHERE student_id = ? AND class_id = ?',
      [req.params.studentId, req.params.classId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Remove student error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

