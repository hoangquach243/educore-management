
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Course, ClassSection, TeachingAssignment, Enrollment, GradeRecord, GradeConfig, UserRole } from '../types';
import * as api from '@/src/services/api';

interface SchoolContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  
  users: User[];
  courses: Course[];
  classes: ClassSection[];
  assignments: TeachingAssignment[];
  enrollments: Enrollment[];
  grades: GradeRecord[];
  gradeConfigs: GradeConfig[];

  // User Actions
  addUser: (user: User) => void;
  updateUser: (originalId: string, updatedUser: User) => void;
  updatePassword: (userId: string, newPass: string) => void;
  deleteUser: (userId: string) => void;
  
  // Academic Actions (Courses & Classes)
  initializeSemester: (semester: string) => void;
  addCourse: (course: Course) => void;
  deleteCourse: (courseId: string) => void;
  addClass: (cls: ClassSection) => void;
  deleteClass: (classId: string) => void;

  // Assignment Actions
  assignTeacher: (assignment: TeachingAssignment) => void;
  updateAssignment: (assignment: TeachingAssignment) => void;
  deleteAssignment: (id: string) => void;

  // Student/Grade Actions
  enrollStudent: (studentId: string, classId: string, courseId: string) => void;
  removeStudent: (studentId: string, classId: string) => void;
  updateGradeConfig: (config: GradeConfig) => void;
  updateScores: (recordId: string, scores: GradeRecord['scores']) => void;
  submitGrades: (classId: string) => void;
  toggleGradeLock: (classId: string, locked: boolean) => void; // Admin Action
  
  // System Actions
  resetSystem: () => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [gradeConfigs, setGradeConfigs] = useState<GradeConfig[]>([]);

  // Load all data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [usersData, coursesData, classesData, assignmentsData, enrollmentsData, gradesData, configsData] = await Promise.all([
        api.usersAPI.getAll(),
        api.coursesAPI.getAll(),
        api.classesAPI.getAll(),
        api.assignmentsAPI.getAll(),
        api.enrollmentsAPI.getAll(),
        api.gradesAPI.getAll(),
        api.gradeConfigsAPI.getAll()
      ]);

      setUsers(usersData.map(transformUser));
      setCourses(coursesData);
      setClasses(classesData.map((c: any) => ({ id: c.id, name: c.name, semester: c.semester, courseId: c.course_id })));
      setAssignments(assignmentsData);
      setEnrollments(enrollmentsData);
      setGrades(gradesData.map(transformGradeRecord));
      setGradeConfigs(configsData.map(transformGradeConfig));
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Không thể kết nối đến server. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  // Sync Current User to LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await api.authAPI.login(email, password);
      if (result.success && result.user) {
        const user = transformUser(result.user);
        if (!user.isActive) {
          alert("Account is locked. Please contact Admin.");
          return false;
        }
        setCurrentUser(user);
        return true;
      }
      return false;
    } catch (error: any) {
      alert(error.message || 'Đăng nhập thất bại');
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  // --- User Actions ---
  const addUser = async (user: User) => {
    try {
      const newUser = await api.usersAPI.create(user);
      setUsers(prev => [...prev, transformUser(newUser)]);
    } catch (error: any) {
      alert(error.message || 'Không thể thêm người dùng');
      throw error;
    }
  };
  
  const updateUser = async (originalId: string, updatedUser: User) => {
    try {
      const updated = await api.usersAPI.update(originalId, updatedUser);
      const transformed = transformUser(updated);
      setUsers(prev => prev.map(u => u.id === originalId ? transformed : u));
      if (currentUser && currentUser.id === originalId) {
        setCurrentUser(transformed);
      }
      await loadAllData(); // Reload to sync foreign keys
    } catch (error: any) {
      alert(error.message || 'Không thể cập nhật người dùng');
      throw error;
    }
  };

  const updatePassword = async (userId: string, newPass: string) => {
    try {
      await api.usersAPI.updatePassword(userId, newPass);
      if (currentUser && currentUser.id === userId) {
        setCurrentUser({ ...currentUser, password: newPass });
      }
    } catch (error: any) {
      alert(error.message || 'Không thể cập nhật mật khẩu');
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await api.usersAPI.delete(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      if (currentUser?.id === userId) logout();
    } catch (error: any) {
      alert(error.message || 'Không thể xóa người dùng');
      throw error;
    }
  };

  // --- Academic Actions ---
  const initializeSemester = async (semester: string) => {
    try {
      const newClasses = await api.classesAPI.initializeSemester(semester);
      setClasses(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const uniqueNew = newClasses.filter((c: any) => !existingIds.has(c.id));
        return [...prev, ...uniqueNew.map((c: any) => ({ id: c.id, name: c.name, semester: c.semester, courseId: c.courseId }))];
      });
    } catch (error: any) {
      alert(error.message || 'Không thể khởi tạo học kỳ');
      throw error;
    }
  };

  const addCourse = async (course: Course) => {
    try {
      const newCourse = await api.coursesAPI.create(course);
      setCourses(prev => [...prev, newCourse]);
    } catch (error: any) {
      alert(error.message || 'Không thể thêm môn học');
      throw error;
    }
  };
  
  const deleteCourse = async (courseId: string) => {
    try {
      await api.coursesAPI.delete(courseId);
      setCourses(prev => prev.filter(c => c.id !== courseId));
    } catch (error: any) {
      alert(error.message || 'Không thể xóa môn học');
      throw error;
    }
  };

  const addClass = async (cls: ClassSection) => {
    try {
      const newClass = await api.classesAPI.create({ ...cls, course_id: cls.courseId });
      setClasses(prev => [...prev, { id: newClass.id, name: newClass.name, semester: newClass.semester, courseId: newClass.course_id }]);
    } catch (error: any) {
      alert(error.message || 'Không thể thêm lớp học');
      throw error;
    }
  };

  const deleteClass = async (classId: string) => {
    try {
      await api.classesAPI.delete(classId);
      setClasses(prev => prev.filter(c => c.id !== classId));
    } catch (error: any) {
      alert(error.message || 'Không thể xóa lớp học');
      throw error;
    }
  };

  // --- Assignment Actions ---
  const assignTeacher = async (assignment: TeachingAssignment) => {
    try {
      const newAssignment = await api.assignmentsAPI.create(assignment);
      setAssignments(prev => [...prev, newAssignment]);
    } catch (error: any) {
      alert(error.message || 'Không thể phân công giảng viên');
      throw error;
    }
  };

  const updateAssignment = async (updatedAssignment: TeachingAssignment) => {
    try {
      const updated = await api.assignmentsAPI.update(updatedAssignment.id, updatedAssignment);
      setAssignments(prev => prev.map(a => a.id === updatedAssignment.id ? updated : a));
    } catch (error: any) {
      alert(error.message || 'Không thể cập nhật phân công');
      throw error;
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      await api.assignmentsAPI.delete(id);
      setAssignments(prev => prev.filter(a => a.id !== id));
    } catch (error: any) {
      alert(error.message || 'Không thể xóa phân công');
      throw error;
    }
  };

  // --- Enrollment/Grade Actions ---
  const enrollStudent = async (studentId: string, classId: string, courseId: string) => {
    try {
      const enrollment = await api.enrollmentsAPI.enroll({ studentId, classId, courseId });
      setEnrollments(prev => [...prev, enrollment]);
      await loadAllData(); // Reload to get grade record
    } catch (error: any) {
      alert(error.message || 'Không thể đăng ký học phần');
      throw error;
    }
  };

  const removeStudent = async (studentId: string, classId: string) => {
    try {
      await api.enrollmentsAPI.remove(studentId, classId);
      setEnrollments(prev => prev.filter(e => !(e.studentId === studentId && e.classId === classId)));
      setGrades(prev => prev.filter(g => !(g.studentId === studentId && g.classId === classId)));
    } catch (error: any) {
      alert(error.message || 'Không thể hủy đăng ký');
      throw error;
    }
  };

  const updateGradeConfig = async (newConfig: GradeConfig) => {
    try {
      const updated = await api.gradeConfigsAPI.createOrUpdate(newConfig);
      setGradeConfigs(prev => {
        const existingIdx = prev.findIndex(c => c.courseId === newConfig.courseId && c.teacherId === newConfig.teacherId);
        if (existingIdx >= 0) {
          const updatedList = [...prev];
          updatedList[existingIdx] = transformGradeConfig(updated);
          return updatedList;
        } else {
          return [...prev, transformGradeConfig(updated)];
        }
      });
    } catch (error: any) {
      alert(error.message || 'Không thể cập nhật cấu hình điểm');
      throw error;
    }
  };

  const updateScores = async (recordId: string, scores: GradeRecord['scores']) => {
    try {
      const updated = await api.gradesAPI.updateScores(recordId, scores);
      setGrades(prev => prev.map(g => g.id !== recordId ? g : transformGradeRecord(updated)));
    } catch (error: any) {
      alert(error.message || 'Không thể cập nhật điểm');
      throw error;
    }
  };

  const submitGrades = async (classId: string) => {
    try {
      await api.gradesAPI.submitGrades(classId);
      await loadAllData(); // Reload to get calculated grades
    } catch (error: any) {
      alert(error.message || 'Không thể nộp điểm');
      throw error;
    }
  };

  const toggleGradeLock = async (classId: string, locked: boolean) => {
    try {
      await api.gradesAPI.toggleLock(classId, locked);
      setGrades(prev => prev.map(g => g.classId !== classId ? g : { ...g, isLocked: locked }));
    } catch (error: any) {
      alert(error.message || 'Không thể khóa/mở khóa điểm');
      throw error;
    }
  };

  const resetSystem = () => {
    if (confirm("Reset all data to factory defaults? This cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Transform functions
  function transformUser(row: any): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      isActive: row.is_active === 1 || row.is_active === true,
      phone: row.phone,
      address: row.address,
      personalEmail: row.personal_email
    };
  }

  function transformGradeRecord(row: any): GradeRecord {
    return {
      id: row.id,
      studentId: row.studentId || row.student_id,
      classId: row.classId || row.class_id,
      courseId: row.courseId || row.course_id,
      scores: {
        component: row.scores?.component || row.score_component,
        midterm: row.scores?.midterm || row.score_midterm,
        project: row.scores?.project || row.score_project,
        final: row.scores?.final || row.score_final
      },
      finalScore10: row.finalScore10 || row.final_score_10,
      finalScore4: row.finalScore4 || row.final_score_4,
      letterGrade: row.letterGrade || row.letter_grade,
      isSubmitted: row.isSubmitted !== undefined ? row.isSubmitted : (row.is_submitted === 1 || row.is_submitted === true),
      isLocked: row.isLocked !== undefined ? row.isLocked : (row.is_locked === 1 || row.is_locked === true)
    };
  }

  function transformGradeConfig(row: any): GradeConfig {
    return {
      courseId: row.courseId || row.course_id,
      teacherId: row.teacherId || row.teacher_id,
      weights: {
        component: row.weights?.component || row.weight_component,
        midterm: row.weights?.midterm || row.weight_midterm,
        project: row.weights?.project || row.weight_project,
        final: row.weights?.final || row.weight_final
      }
    };
  }

  return (
    <SchoolContext.Provider value={{
      currentUser, login, logout, loading,
      users, courses, classes, assignments, enrollments, grades, gradeConfigs,
      addUser, updateUser, updatePassword, deleteUser, 
      initializeSemester, addCourse, deleteCourse, addClass, deleteClass,
      assignTeacher, updateAssignment, deleteAssignment,
      enrollStudent, removeStudent,
      updateGradeConfig, updateScores, submitGrades, toggleGradeLock, resetSystem
    }}>
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) throw new Error("useSchool must be used within SchoolProvider");
  return context;
};
