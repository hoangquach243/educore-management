const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Server error' }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const data = await request<{ success: boolean; user?: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return data;
  },
};

// Users API
export const usersAPI = {
  getAll: () => request<any[]>('/users'),
  getById: (id: string) => request<any>(`/users/${id}`),
  create: (user: any) => request<any>('/users', { method: 'POST', body: JSON.stringify(user) }),
  update: (id: string, user: any) => request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(user) }),
  verifyPassword: (id: string, password: string) => request<{ valid: boolean }>(`/users/${id}/verify-password`, { method: 'POST', body: JSON.stringify({ password }) }),
  updatePassword: (id: string, password: string) => request('/users/' + id + '/password', { method: 'PATCH', body: JSON.stringify({ password }) }),
  delete: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
};

// Courses API
export const coursesAPI = {
  getAll: () => request<any[]>('/courses'),
  getById: (id: string) => request<any>(`/courses/${id}`),
  create: (course: any) => request<any>('/courses', { method: 'POST', body: JSON.stringify(course) }),
  delete: (id: string) => request(`/courses/${id}`, { method: 'DELETE' }),
};

// Classes API
export const classesAPI = {
  getAll: () => request<any[]>('/classes'),
  getById: (id: string) => request<any>(`/classes/${id}`),
  create: (cls: any) => request<any>('/classes', { method: 'POST', body: JSON.stringify(cls) }),
  initializeSemester: (semester: string) => request<any[]>('/classes/initialize-semester', { method: 'POST', body: JSON.stringify({ semester }) }),
  delete: (id: string) => request(`/classes/${id}`, { method: 'DELETE' }),
};

// Assignments API
export const assignmentsAPI = {
  getAll: () => request<any[]>('/assignments'),
  create: (assignment: any) => request<any>('/assignments', { method: 'POST', body: JSON.stringify(assignment) }),
  update: (id: string, assignment: any) => request<any>(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify(assignment) }),
  delete: (id: string) => request(`/assignments/${id}`, { method: 'DELETE' }),
};

// Enrollments API
export const enrollmentsAPI = {
  getAll: () => request<any[]>('/enrollments'),
  enroll: (enrollment: any) => request<any>('/enrollments', { method: 'POST', body: JSON.stringify(enrollment) }),
  remove: (studentId: string, classId: string) => request(`/enrollments/${studentId}/${classId}`, { method: 'DELETE' }),
};

// Grades API
export const gradesAPI = {
  getAll: () => request<any[]>('/grades'),
  getByClass: (classId: string) => request<any[]>(`/grades/class/${classId}`),
  getByStudent: (studentId: string) => request<any[]>(`/grades/student/${studentId}`),
  updateScores: (id: string, scores: any) => request<any>(`/grades/${id}/scores`, { method: 'PATCH', body: JSON.stringify({ scores }) }),
  submitGrades: (classId: string) => request(`/grades/class/${classId}/submit`, { method: 'POST' }),
  toggleLock: (classId: string, locked: boolean) => request(`/grades/class/${classId}/lock`, { method: 'PATCH', body: JSON.stringify({ locked }) }),
};

// Grade Configs API
export const gradeConfigsAPI = {
  getAll: () => request<any[]>('/grade-configs'),
  getByCourseAndTeacher: (courseId: string, teacherId: string) => request<any>(`/grade-configs/course/${courseId}/teacher/${teacherId}`),
  createOrUpdate: (config: any) => request<any>('/grade-configs', { method: 'POST', body: JSON.stringify(config) }),
};
