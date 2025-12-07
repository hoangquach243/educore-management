import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all grade configs
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM grade_configs');
    res.json(rows.map(transformConfig));
  } catch (error) {
    console.error('Get grade configs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get config by course and teacher
router.get('/course/:courseId/teacher/:teacherId', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM grade_configs WHERE course_id = ? AND teacher_id = ?',
      [req.params.courseId, req.params.teacherId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Config not found' });
    }
    res.json(transformConfig(rows[0]));
  } catch (error) {
    console.error('Get grade config error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create or update grade config
router.post('/', async (req, res) => {
  try {
    const { courseId, teacherId, weights } = req.body;
    
    await pool.execute(
      `INSERT INTO grade_configs (course_id, teacher_id, weight_component, weight_midterm, weight_project, weight_final)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       weight_component = VALUES(weight_component),
       weight_midterm = VALUES(weight_midterm),
       weight_project = VALUES(weight_project),
       weight_final = VALUES(weight_final)`,
      [courseId, teacherId, weights.component, weights.midterm, weights.project, weights.final]
    );
    
    const [rows] = await pool.execute(
      'SELECT * FROM grade_configs WHERE course_id = ? AND teacher_id = ?',
      [courseId, teacherId]
    );
    
    res.json(transformConfig(rows[0]));
  } catch (error) {
    console.error('Create/update grade config error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

function transformConfig(row) {
  return {
    courseId: row.course_id,
    teacherId: row.teacher_id,
    weights: {
      component: row.weight_component,
      midterm: row.weight_midterm,
      project: row.weight_project,
      final: row.weight_final
    }
  };
}

export default router;

