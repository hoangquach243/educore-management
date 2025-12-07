import pool from '../config/database.js';
import dotenv from 'dotenv';
import { MOCK_USERS, MOCK_COURSES, MOCK_CLASSES, MOCK_ASSIGNMENTS, MOCK_ENROLLMENTS, MOCK_GRADES, MOCK_GRADE_CONFIGS } from '../../constants.js';

dotenv.config();

async function seedData() {
  try {
    console.log('🌱 Starting data seeding...');

    // Clear existing data
    console.log('Clearing existing data...');
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    await pool.execute('TRUNCATE TABLE grades');
    await pool.execute('TRUNCATE TABLE enrollments');
    await pool.execute('TRUNCATE TABLE teaching_assignments');
    await pool.execute('TRUNCATE TABLE grade_configs');
    await pool.execute('TRUNCATE TABLE classes');
    await pool.execute('TRUNCATE TABLE courses');
    await pool.execute('TRUNCATE TABLE users');
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

    // Insert Users
    console.log('Inserting users...');
    for (const user of MOCK_USERS) {
      await pool.execute(
        'INSERT INTO users (id, name, email, password, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, user.name, user.email, user.password || '123', user.role, user.isActive ? 1 : 0]
      );
    }

    // Insert Courses
    console.log('Inserting courses...');
    for (const course of MOCK_COURSES) {
      await pool.execute(
        'INSERT INTO courses (id, code, name, credits) VALUES (?, ?, ?, ?)',
        [course.id, course.code, course.name, course.credits]
      );
    }

    // Insert Classes
    console.log('Inserting classes...');
    for (const cls of MOCK_CLASSES) {
      await pool.execute(
        'INSERT INTO classes (id, name, semester, course_id) VALUES (?, ?, ?, ?)',
        [cls.id, cls.name, cls.semester, cls.courseId]
      );
    }

    // Insert Assignments
    console.log('Inserting assignments...');
    for (const assignment of MOCK_ASSIGNMENTS) {
      await pool.execute(
        'INSERT INTO teaching_assignments (id, teacher_id, course_id, class_id) VALUES (?, ?, ?, ?)',
        [assignment.id, assignment.teacherId, assignment.courseId, assignment.classId]
      );
    }

    // Insert Grade Configs
    console.log('Inserting grade configs...');
    for (const config of MOCK_GRADE_CONFIGS) {
      await pool.execute(
        'INSERT INTO grade_configs (course_id, teacher_id, weight_component, weight_midterm, weight_project, weight_final) VALUES (?, ?, ?, ?, ?, ?)',
        [config.courseId, config.teacherId, config.weights.component, config.weights.midterm, config.weights.project, config.weights.final]
      );
    }

    // Insert Enrollments
    console.log('Inserting enrollments...');
    for (const enrollment of MOCK_ENROLLMENTS) {
      await pool.execute(
        'INSERT INTO enrollments (id, student_id, class_id, course_id) VALUES (?, ?, ?, ?)',
        [enrollment.id, enrollment.studentId, enrollment.classId, enrollment.courseId]
      );
    }

    // Insert Grades
    console.log('Inserting grades...');
    for (const grade of MOCK_GRADES) {
      await pool.execute(
        `INSERT INTO grades (id, student_id, class_id, course_id, score_component, score_midterm, score_project, score_final, final_score_10, final_score_4, letter_grade, is_submitted, is_locked) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          grade.id,
          grade.studentId,
          grade.classId,
          grade.courseId,
          grade.scores.component || null,
          grade.scores.midterm || null,
          grade.scores.project || null,
          grade.scores.final || null,
          grade.finalScore10 || null,
          grade.finalScore4 || null,
          grade.letterGrade || null,
          grade.isSubmitted ? 1 : 0,
          grade.isLocked ? 1 : 0
        ]
      );
    }

    console.log('✅ Data seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();

