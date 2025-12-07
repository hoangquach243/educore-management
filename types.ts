
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export interface User {
  id: string;
  name: string;
  email: string; // School Email
  password?: string;
  phone?: string;
  address?: string;
  personalEmail?: string;
  role: UserRole;
  isActive: boolean;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
}

export interface ClassSection {
  id: string;
  name: string; // e.g., "K64-CA-1"
  semester: string; // e.g., "2023-1"
  courseId: string; // Link to Course
}

export interface TeachingAssignment {
  id: string;
  teacherId: string;
  courseId: string;
  classId: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  courseId: string;
}

export interface GradeConfig {
  courseId: string;
  teacherId: string; // Custom config per teacher per course
  weights: {
    component: number; // e.g., 10%
    midterm: number;   // e.g., 30%
    project: number;   // e.g., 20%
    final: number;     // e.g., 40%
  };
}

export interface GradeRecord {
  id: string;
  studentId: string;
  classId: string;
  courseId: string;
  scores: {
    component?: number;
    midterm?: number;
    project?: number;
    final?: number;
  };
  finalScore10?: number;
  finalScore4?: number;
  letterGrade?: string;
  isSubmitted: boolean; // Teacher has submitted. If edited, becomes false.
  isLocked: boolean;    // Admin has blocked. Prevents editing and submitting.
}

export interface GPASummary {
  studentId: string;
  semesterGPA: Record<string, number>; // key: semester
  cumulativeGPA: number;
  totalCredits: number;
}
