
import { User, UserRole, Course, ClassSection, TeachingAssignment, Enrollment, GradeRecord, GradeConfig } from './types';

// --- Helper Functions for Grading ---

export const calculateScores = (
  scores: { component?: number; midterm?: number; project?: number; final?: number },
  weights: GradeConfig['weights']
) => {
  const c = (scores.component || 0) * (weights.component / 100);
  const m = (scores.midterm || 0) * (weights.midterm / 100);
  const p = (scores.project || 0) * (weights.project / 100);
  const f = (scores.final || 0) * (weights.final / 100);

  // Round to 1 decimal place
  const final10 = Math.round((c + m + p + f) * 10) / 10;
  
  let final4 = 0;
  let letter = 'F';

  if (final10 >= 8.5) { final4 = 4.0; letter = 'A'; }
  else if (final10 >= 8.0) { final4 = 3.5; letter = 'B+'; }
  else if (final10 >= 7.0) { final4 = 3.0; letter = 'B'; }
  else if (final10 >= 6.5) { final4 = 2.5; letter = 'C+'; }
  else if (final10 >= 5.5) { final4 = 2.0; letter = 'C'; }
  else if (final10 >= 5.0) { final4 = 1.5; letter = 'D+'; }
  else if (final10 >= 4.0) { final4 = 1.0; letter = 'D'; }
  else { final4 = 0.0; letter = 'F'; }

  return { final10, final4, letter };
};

// --- DATA GENERATION ---

const USERS: User[] = [];
const COURSES: Course[] = [];
const CLASSES: ClassSection[] = [];
const ASSIGNMENTS: TeachingAssignment[] = [];
const ENROLLMENTS: Enrollment[] = [];
const GRADES: GradeRecord[] = [];
const GRADE_CONFIGS: GradeConfig[] = [];

// 1. Admin
USERS.push({
  id: 'admin',
  name: 'System Admin',
  email: 'admin@hcmut.edu.vn',
  role: UserRole.ADMIN,
  isActive: true,
  password: '123'
});

// 2. Teachers (5) -> a2400001 - a2400005
const TEACHER_IDS: string[] = [];
for (let i = 1; i <= 5; i++) {
  const id = `a24${i.toString().padStart(5, '0')}`;
  TEACHER_IDS.push(id);
  USERS.push({
    id,
    name: `Giảng viên ${i}`,
    email: `${id}@hcmut.edu.vn`,
    role: UserRole.TEACHER,
    isActive: true,
    password: '123'
  });
}

// 3. Students (40) -> 2400001 - 2400040
const STUDENT_IDS: string[] = [];
for (let i = 1; i <= 40; i++) {
  const id = `24${i.toString().padStart(5, '0')}`;
  STUDENT_IDS.push(id);
  USERS.push({
    id,
    name: `Sinh viên ${i}`,
    email: `${id}@hcmut.edu.vn`,
    role: UserRole.STUDENT,
    isActive: true,
    password: '123'
  });
}

// 4. Courses (20) -> CO1001, PH1002...
const SUBJECT_PREFIXES = ['CO', 'PH', 'MA', 'CH', 'ME'];
for (let i = 1; i <= 20; i++) {
  const prefix = SUBJECT_PREFIXES[i % 5];
  const num = 1000 + i;
  const id = `${prefix}${num}`;
  COURSES.push({
    id,
    code: id,
    name: `Môn học Đại cương ${id}`,
    credits: Math.floor(Math.random() * 3) + 2 // 2-4 credits
  });
}

// 5. Classes, Assignments & Grade Configs
// Semesters: Past (2022-2, 2023-1, 2023-2) & Current (2024-1)
const PAST_SEMESTERS = ['2022-2', '2023-1', '2023-2'];
const CURRENT_SEMESTER = '2024-1';

COURSES.forEach(course => {
  // Create 4 classes per course
  // 3 classes in Past Semesters (Submitted Grades)
  // 1 class in Current Semester (In Progress)
  
  // Past Classes
  PAST_SEMESTERS.forEach((sem, idx) => {
    const classSuffix = `L0${idx + 1}`; // L01, L02, L03
    const classId = `${course.code}_${classSuffix}_${sem}`; // Unique ID
    
    CLASSES.push({
      id: classId,
      name: classSuffix,
      semester: sem,
      courseId: course.id
    });

    // Assign random teacher
    const teacherId = TEACHER_IDS[Math.floor(Math.random() * TEACHER_IDS.length)];
    ASSIGNMENTS.push({
      id: `assign_${classId}`,
      teacherId,
      courseId: course.id,
      classId: classId
    });

    // Config for this teacher/course (if not exists)
    if (!GRADE_CONFIGS.find(gc => gc.courseId === course.id && gc.teacherId === teacherId)) {
       GRADE_CONFIGS.push({
         courseId: course.id,
         teacherId,
         weights: { component: 20, midterm: 30, project: 0, final: 50 }
       });
    }
  });

  // Current Class
  const currentSuffix = 'L04';
  const currentClassId = `${course.code}_${currentSuffix}_${CURRENT_SEMESTER}`;
  CLASSES.push({
    id: currentClassId,
    name: currentSuffix,
    semester: CURRENT_SEMESTER,
    courseId: course.id
  });

  const currentTeacherId = TEACHER_IDS[Math.floor(Math.random() * TEACHER_IDS.length)];
  ASSIGNMENTS.push({
    id: `assign_${currentClassId}`,
    teacherId: currentTeacherId,
    courseId: course.id,
    classId: currentClassId
  });
   if (!GRADE_CONFIGS.find(gc => gc.courseId === course.id && gc.teacherId === currentTeacherId)) {
       GRADE_CONFIGS.push({
         courseId: course.id,
         teacherId: currentTeacherId,
         weights: { component: 20, midterm: 30, project: 0, final: 50 }
       });
    }
});

// 6. Enrollments & Grades
// Each student: ~15 past courses, ~2 current courses

const pastClasses = CLASSES.filter(c => c.semester !== CURRENT_SEMESTER);
const currentClasses = CLASSES.filter(c => c.semester === CURRENT_SEMESTER);

STUDENT_IDS.forEach(studentId => {
  // A. PAST ENROLLMENTS (Submitted & Locked)
  // Shuffle past classes and pick 15
  const shuffledPast = [...pastClasses].sort(() => 0.5 - Math.random());
  const selectedPast = shuffledPast.slice(0, 15);

  selectedPast.forEach(cls => {
    // Enroll
    const enrId = `enr_${studentId}_${cls.id}`;
    ENROLLMENTS.push({
      id: enrId,
      studentId,
      classId: cls.id,
      courseId: cls.courseId
    });

    // Grade (Submitted)
    const assign = ASSIGNMENTS.find(a => a.classId === cls.id);
    const config = GRADE_CONFIGS.find(gc => gc.courseId === cls.courseId && gc.teacherId === assign?.teacherId) 
                   || { weights: { component: 20, midterm: 30, project: 0, final: 50 } };
    
    // Randomize scores high enough to pass mostly
    const scores = {
      component: Math.floor(Math.random() * 4) + 6, // 6-10
      midterm: Math.floor(Math.random() * 5) + 5,   // 5-10
      project: 0,
      final: Math.floor(Math.random() * 5) + 5      // 5-10
    };

    const calc = calculateScores(scores, config.weights);

    GRADES.push({
      id: `g_${enrId}`,
      studentId,
      classId: cls.id,
      courseId: cls.courseId,
      scores,
      finalScore10: calc.final10,
      finalScore4: calc.final4,
      letterGrade: calc.letter,
      isSubmitted: true,
      isLocked: true // Past semesters are finalized
    });
  });

  // B. CURRENT ENROLLMENTS (In Progress)
  const shuffledCurrent = [...currentClasses].sort(() => 0.5 - Math.random());
  const selectedCurrent = shuffledCurrent.slice(0, 2);

  selectedCurrent.forEach(cls => {
     const enrId = `enr_${studentId}_${cls.id}`;
     ENROLLMENTS.push({
        id: enrId,
        studentId,
        classId: cls.id,
        courseId: cls.courseId
     });

     // Grade (Partial, Not Submitted)
     GRADES.push({
        id: `g_${enrId}`,
        studentId,
        classId: cls.id,
        courseId: cls.courseId,
        scores: { component: Math.floor(Math.random() * 8) }, // Just some progress
        isSubmitted: false,
        isLocked: false
     });
  });
});

export const MOCK_USERS = USERS;
export const MOCK_COURSES = COURSES;
export const MOCK_CLASSES = CLASSES;
export const MOCK_ASSIGNMENTS = ASSIGNMENTS;
export const MOCK_ENROLLMENTS = ENROLLMENTS;
export const MOCK_GRADES = GRADES;
export const MOCK_GRADE_CONFIGS = GRADE_CONFIGS;
