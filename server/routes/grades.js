import express from 'express';
import pool from '../config/database.js';
import { calculateScores } from '../utils/gradeCalculator.js';

const router = express.Router();

// Get all grades
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM grades');
    res.json(rows.map(transformGradeRecord));
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get grades by class
router.get('/class/:classId', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM grades WHERE class_id = ?', [req.params.classId]);
    res.json(rows.map(transformGradeRecord));
  } catch (error) {
    console.error('Get grades by class error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get grades by student
router.get('/student/:studentId', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM grades WHERE student_id = ?', [req.params.studentId]);
    res.json(rows.map(transformGradeRecord));
  } catch (error) {
    console.error('Get grades by student error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update scores
router.patch('/:id/scores', async (req, res) => {
  try {
    const { scores } = req.body;
    
    // Check if locked
    const [rows] = await pool.execute('SELECT is_locked FROM grades WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Grade record not found' });
    }
    if (rows[0].is_locked) {
      return res.status(403).json({ error: 'Grade record is locked' });
    }
    
    await pool.execute(
      'UPDATE grades SET score_component = ?, score_midterm = ?, score_project = ?, score_final = ?, is_submitted = FALSE WHERE id = ?',
      [scores.component || null, scores.midterm || null, scores.project || null, scores.final || null, req.params.id]
    );
    
    const [updated] = await pool.execute('SELECT * FROM grades WHERE id = ?', [req.params.id]);
    res.json(transformGradeRecord(updated[0]));
  } catch (error) {
    console.error('Update scores error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit grades for a class
router.post('/class/:classId/submit', async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Get assignment to find teacher and course
    const [assignments] = await pool.execute(
      'SELECT * FROM teaching_assignments WHERE class_id = ?',
      [classId]
    );
    
    if (assignments.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    const assignment = assignments[0];
    
    // Get grade config
    const [configs] = await pool.execute(
      'SELECT * FROM grade_configs WHERE course_id = ? AND teacher_id = ?',
      [assignment.course_id, assignment.teacher_id]
    );
    
    const config = configs[0] || {
      weight_component: 20,
      weight_midterm: 30,
      weight_project: 0,
      weight_final: 50
    };
    
    const weights = {
      component: config.weight_component,
      midterm: config.weight_midterm,
      project: config.weight_project,
      final: config.weight_final
    };
    
    // Get all grades for this class
    const [grades] = await pool.execute(
      'SELECT * FROM grades WHERE class_id = ? AND is_locked = FALSE',
      [classId]
    );
    
    // Calculate and update each grade
    for (const grade of grades) {
      const scores = {
        component: grade.score_component,
        midterm: grade.score_midterm,
        project: grade.score_project,
        final: grade.score_final
      };
      
      const calc = calculateScores(scores, weights);
      
      await pool.execute(
        'UPDATE grades SET final_score_10 = ?, final_score_4 = ?, letter_grade = ?, is_submitted = TRUE WHERE id = ?',
        [calc.final10, calc.final4, calc.letter, grade.id]
      );
    }
    
    res.json({ success: true, message: `Submitted ${grades.length} grades` });
  } catch (error) {
    console.error('Submit grades error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle grade lock
router.patch('/class/:classId/lock', async (req, res) => {
  try {
    const { locked } = req.body;
    await pool.execute(
      'UPDATE grades SET is_locked = ? WHERE class_id = ?',
      [locked, req.params.classId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Toggle lock error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

function transformGradeRecord(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    classId: row.class_id,
    courseId: row.course_id,
    scores: {
      component: row.score_component,
      midterm: row.score_midterm,
      project: row.score_project,
      final: row.score_final
    },
    finalScore10: row.final_score_10,
    finalScore4: row.final_score_4,
    letterGrade: row.letter_grade,
    isSubmitted: row.is_submitted === 1,
    isLocked: row.is_locked === 1
  };
}

export default router;

