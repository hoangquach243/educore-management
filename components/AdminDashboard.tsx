
import React, { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { User, UserRole, TeachingAssignment, Course, ClassSection } from '../types';
import { Users, BookOpen, Plus, Trash2, Edit2, CheckCircle, Ban, GraduationCap, Search, Filter, Save, X, ChevronRight, Library, ArrowRight, Calendar, ArrowLeft, Lock, Unlock, AlertCircle } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    users, courses, classes, assignments, grades,
    addUser, updateUser, deleteUser,
    initializeSemester, addCourse, deleteCourse, addClass, deleteClass,
    assignTeacher, updateAssignment, deleteAssignment,
    submitGrades, toggleGradeLock
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'users' | 'academics' | 'assignments' | 'grades'>('users');
  
  // --- User Management State ---
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [originalUserId, setOriginalUserId] = useState('');
  const [userFormData, setUserFormData] = useState<Partial<User>>({ role: UserRole.STUDENT, isActive: true });
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<UserRole | 'ALL'>('ALL');

  // --- Assignment Management State ---
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isEditingAssign, setIsEditingAssign] = useState(false);
  const [assignFormData, setAssignFormData] = useState<Partial<TeachingAssignment>>({});
  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState('');
  const [assignSemesterFilter, setAssignSemesterFilter] = useState('ALL');

  // --- Academic Management State (Hierarchy) ---
  const [academicSelection, setAcademicSelection] = useState<{
      semester: string | null;
      courseId: string | null;
  }>({ semester: null, courseId: null });

  const [courseSearchTerm, setCourseSearchTerm] = useState('');

  // Modals
  const [showNewSemesterModal, setShowNewSemesterModal] = useState(false);
  const [newSemesterName, setNewSemesterName] = useState('');

  const [showAddCourseModal, setShowAddCourseModal] = useState(false); // Add EXISTING course to semester
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false); // Create BRAND NEW course
  const [newCourseData, setNewCourseData] = useState<Partial<Course>>({});

  const [showClassModal, setShowClassModal] = useState(false);
  const [classFormData, setClassFormData] = useState<Partial<ClassSection>>({});

  // --- Grade Report State (Drill Down) ---
  const [gradeFilter, setGradeFilter] = useState<{
    semester: string;
    courseId: string;
    classId: string;
  }>({ semester: '', courseId: '', classId: '' });

  // --- HANDLERS: USER ---
  const handleOpenUserModal = (user?: User) => {
    if (user) {
      setUserFormData({ ...user });
      setOriginalUserId(user.id);
      setIsEditingUser(true);
    } else {
      setUserFormData({ role: UserRole.STUDENT, isActive: true, id: '', name: '', email: '' });
      setIsEditingUser(false);
    }
    setShowUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.id || !userFormData.name) return;

    const idExists = users.some(u => u.id === userFormData.id);
    if (isEditingUser) {
        if (userFormData.id !== originalUserId && idExists) {
            alert("New ID already exists!");
            return;
        }
        updateUser(originalUserId, userFormData as User);
    } else {
      if (idExists) {
        alert("User ID already exists!");
        return;
      }
      addUser({
        ...userFormData,
        password: userFormData.password || '123',
        isActive: true,
      } as User);
    }
    setShowUserModal(false);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete user ${userName}?`)) {
        deleteUser(userId);
    }
  };

  // --- HANDLERS: ACADEMICS ---
  // 1. Semesters
  const allSemesters = useMemo(() => {
      const fromClasses = new Set(classes.map(c => c.semester));
      return Array.from(fromClasses).sort().reverse();
  }, [classes]);

  const handleAddSemester = () => {
      if (!newSemesterName) return;
      if (allSemesters.includes(newSemesterName)) {
          alert("Semester already exists");
          return;
      }
      
      // Initialize semester (create classes for all courses)
      initializeSemester(newSemesterName);
      
      setAcademicSelection({ semester: newSemesterName, courseId: null });
      setShowNewSemesterModal(false);
      setNewSemesterName('');
      alert(`Semester ${newSemesterName} created. Classes "L01" have been auto-generated for all ${courses.length} courses.`);
  };

  // 2. Courses (Global & In Semester)
  const coursesInSelectedSemester = useMemo(() => {
      if (!academicSelection.semester) return [];
      // Find courses that have classes in this semester
      const courseIdsInSem = new Set(classes.filter(c => c.semester === academicSelection.semester).map(c => c.courseId));
      
      return courses.filter(c => courseIdsInSem.has(c.id) || (academicSelection.courseId === c.id && academicSelection.semester)); 
      // Note: Logic allows seeing a selected course even if no classes yet (UI state)
  }, [courses, classes, academicSelection.semester, academicSelection.courseId]);

  const filteredGlobalCourses = courses.filter(c => 
      c.name.toLowerCase().includes(courseSearchTerm.toLowerCase()) || 
      c.code.toLowerCase().includes(courseSearchTerm.toLowerCase())
  );

  const handleCreateCourse = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCourseData.code || !newCourseData.name) return;
      if (courses.some(c => c.id === newCourseData.code)) {
          alert("Course Code already exists");
          return;
      }
      addCourse({
          id: newCourseData.code,
          code: newCourseData.code,
          name: newCourseData.name,
          credits: newCourseData.credits || 3
      } as Course);
      setShowCreateCourseModal(false);
      setNewCourseData({});
      // Optionally auto-select it for the semester view if we want
  };

  const handleAddCourseToSemester = (courseId: string) => {
      // Just updates UI state to show it "selected" so we can add classes
      setAcademicSelection(prev => ({ ...prev, courseId }));
      setShowAddCourseModal(false);
  };

  // 3. Classes
  const classesForSelection = useMemo(() => {
      if (!academicSelection.semester || !academicSelection.courseId) return [];
      return classes.filter(c => c.semester === academicSelection.semester && c.courseId === academicSelection.courseId);
  }, [classes, academicSelection]);

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classFormData.name || !academicSelection.semester || !academicSelection.courseId) return;
    
    // Generate ID based on name and sem
    const id = `${academicSelection.courseId}_${classFormData.name}_${academicSelection.semester}`.replace(/\s+/g, '-').toUpperCase();
    if (classes.some(c => c.id === id)) {
        alert("Class ID already exists.");
        return;
    }

    addClass({
        id: id,
        name: classFormData.name,
        semester: academicSelection.semester,
        courseId: academicSelection.courseId
    });
    setShowClassModal(false);
    setClassFormData({});
  };


  // --- HANDLERS: ASSIGNMENT ---
  const handleOpenAssignModal = (assignment?: TeachingAssignment) => {
    if (assignment) {
      setAssignFormData({ ...assignment });
      setIsEditingAssign(true);
    } else {
      setAssignFormData({ teacherId: '', courseId: '', classId: '' });
      setIsEditingAssign(false);
    }
    setShowAssignModal(true);
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignFormData.teacherId || !assignFormData.courseId || !assignFormData.classId) return;

    if (isEditingAssign && assignFormData.id) {
        updateAssignment(assignFormData as TeachingAssignment);
    } else {
        assignTeacher({
            id: '', // Context will gen ID
            teacherId: assignFormData.teacherId,
            courseId: assignFormData.courseId,
            classId: assignFormData.classId
        });
    }
    setShowAssignModal(false);
  };

  // --- LOGIC: GRADE DRILL DOWN ---
  const gradeSemesters = useMemo(() => [...new Set(classes.map(c => c.semester))].sort().reverse(), [classes]);
  
  const coursesInGradeSemester = useMemo(() => {
    if (!gradeFilter.semester) return [];
    const classIdsInSem = classes.filter(c => c.semester === gradeFilter.semester).map(c => c.id);
    const assignmentsInSem = assignments.filter(a => classIdsInSem.includes(a.classId));
    const courseIds = [...new Set(assignmentsInSem.map(a => a.courseId))];
    return courses.filter(c => courseIds.includes(c.id));
  }, [gradeFilter.semester, classes, assignments, courses]);

  const classesInGradeCourse = useMemo(() => {
    if (!gradeFilter.courseId || !gradeFilter.semester) return [];
    return classes.filter(c => 
      c.semester === gradeFilter.semester && 
      assignments.some(a => a.courseId === gradeFilter.courseId && a.classId === c.id)
    );
  }, [gradeFilter.semester, gradeFilter.courseId, classes, assignments]);

  const reportGrades = useMemo(() => {
    if (!gradeFilter.classId) return [];
    return grades.filter(g => g.classId === gradeFilter.classId);
  }, [gradeFilter.classId, grades]);
  
  const isClassSubmitted = reportGrades.length > 0 && reportGrades.every(g => g.isSubmitted);
  const isClassLocked = reportGrades.length > 0 && reportGrades.every(g => g.isLocked);


  // --- FILTERING LISTS ---
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
      user.id.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || user.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredAssignments = assignments.filter(assign => {
    const t = users.find(u => u.id === assign.teacherId);
    const c = courses.find(co => co.id === assign.courseId);
    const cl = classes.find(cls => cls.id === assign.classId);
    const term = assignmentSearchTerm.toLowerCase();
    
    // Semester Filter
    if (assignSemesterFilter !== 'ALL' && cl?.semester !== assignSemesterFilter) {
        return false;
    }

    return (
      (t?.name.toLowerCase().includes(term) || '') ||
      (c?.code.toLowerCase().includes(term) || '') ||
      (cl?.name.toLowerCase().includes(term) || '')
    );
  });

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Admin Dashboard</h2>
          <p className="text-gray-500">System configuration and data management.</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'users' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2"><Users size={16} /> User Management</div>
        </button>
        <button
          onClick={() => setActiveTab('academics')}
          className={`pb-3 px-4 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'academics' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2"><Library size={16} /> Academics</div>
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 px-4 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'assignments' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2"><BookOpen size={16} /> Course Assignments</div>
        </button>
        <button
          onClick={() => setActiveTab('grades')}
          className={`pb-3 px-4 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'grades' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2"><GraduationCap size={16} /> Grade Reports</div>
        </button>
      </div>

      {/* --- USERS TAB --- */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search by name, email, ID..." 
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select 
                   className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
                   value={userRoleFilter}
                   onChange={(e) => setUserRoleFilter(e.target.value as UserRole | 'ALL')}
                >
                  <option value="ALL">All Roles</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                  <option value={UserRole.TEACHER}>Teacher</option>
                  <option value={UserRole.STUDENT}>Student</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => handleOpenUserModal()}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 w-full sm:w-auto justify-center"
            >
              <Plus size={16} /> Add User
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-gray-500">{user.id}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-3 text-gray-500">{user.email}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' :
                        user.role === UserRole.TEACHER ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {user.isActive ? (
                        <span className="text-green-600 flex items-center gap-1"><CheckCircle size={14}/> Active</span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-1"><Ban size={14}/> Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-3 flex gap-2">
                       <button 
                        onClick={() => handleOpenUserModal(user)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
                        title="Edit User"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => updateUser(user.id, { ...user, isActive: !user.isActive })}
                        className={`p-1.5 rounded-md ${user.isActive ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                        title={user.isActive ? "Deactivate" : "Activate"}
                      >
                         <Ban size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- ACADEMICS TAB (Hierarchical) --- */}
      {activeTab === 'academics' && (
        <div className="grid grid-cols-12 gap-6 h-[650px]">
            {/* COLUMN 1: Semesters */}
            <div className="col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2"><Calendar size={14}/> Semesters</h3>
                    <button onClick={() => setShowNewSemesterModal(true)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"><Plus size={16}/></button>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1">
                    {allSemesters.map(sem => (
                        <button
                            key={sem}
                            onClick={() => setAcademicSelection({ semester: sem, courseId: null })}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex justify-between items-center ${
                                academicSelection.semester === sem ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'
                            }`}
                        >
                            <span>{sem}</span>
                            <ChevronRight size={14} className={academicSelection.semester === sem ? 'text-indigo-200' : 'text-gray-400'}/>
                        </button>
                    ))}
                </div>
            </div>

            {/* COLUMN 2: Courses */}
            <div className="col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-3 bg-gray-50 border-b">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2"><BookOpen size={14}/> Courses</h3>
                        <button 
                            onClick={() => setShowAddCourseModal(true)} 
                            className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
                            disabled={!academicSelection.semester}
                        >
                            + Add to Semester
                        </button>
                    </div>
                    {/* Course Search Box */}
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                        <input 
                            placeholder="Find Course by Name/ID..." 
                            className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                            value={courseSearchTerm}
                            onChange={e => setCourseSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-y-auto flex-1 p-0">
                    {!academicSelection.semester ? (
                         <div className="p-8 text-center text-gray-400 text-xs">Select a Semester first</div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {/* Filter the visible courses based on search AND selected semester */}
                            {coursesInSelectedSemester.filter(c => 
                                c.name.toLowerCase().includes(courseSearchTerm.toLowerCase()) || 
                                c.code.toLowerCase().includes(courseSearchTerm.toLowerCase())
                            ).map(course => (
                                <li 
                                    key={course.id}
                                    onClick={() => setAcademicSelection(prev => ({ ...prev, courseId: course.id }))}
                                    className={`px-4 py-3 cursor-pointer text-sm transition-colors border-l-4 ${
                                        academicSelection.courseId === course.id 
                                        ? 'bg-indigo-50 border-indigo-600' 
                                        : 'hover:bg-gray-50 border-transparent'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-gray-800">{course.code}</div>
                                            <div className="text-xs text-gray-500">{course.name}</div>
                                        </div>
                                        {academicSelection.courseId === course.id && <ArrowRight size={14} className="text-indigo-600 mt-1"/>}
                                    </div>
                                </li>
                            ))}
                            {coursesInSelectedSemester.length === 0 && (
                                <div className="p-6 text-center text-gray-400 text-xs">No courses in this semester yet.</div>
                            )}
                        </ul>
                    )}
                </div>
            </div>

            {/* COLUMN 3: Classes */}
            <div className="col-span-5 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2"><Users size={14}/> Classes</h3>
                    <button 
                        onClick={() => setShowClassModal(true)}
                        className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
                        disabled={!academicSelection.courseId}
                    >
                        + Create Class
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 p-0">
                     {!academicSelection.courseId ? (
                         <div className="p-8 text-center text-gray-400 text-xs">Select a Course to view classes</div>
                     ) : (
                         <table className="w-full text-left text-sm">
                             <thead className="bg-white border-b sticky top-0">
                                 <tr>
                                     <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Section</th>
                                     <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase text-right">Action</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                                 {classesForSelection.map(cls => (
                                     <tr key={cls.id} className="hover:bg-gray-50">
                                         <td className="px-4 py-3 font-medium text-indigo-900">{cls.name}</td>
                                         <td className="px-4 py-3 text-right">
                                             <button 
                                                 onClick={() => { if(confirm("Delete class?")) deleteClass(cls.id) }}
                                                 className="text-gray-400 hover:text-red-500 p-1"
                                             >
                                                 <Trash2 size={14}/>
                                             </button>
                                         </td>
                                     </tr>
                                 ))}
                                 {classesForSelection.length === 0 && (
                                     <tr><td colSpan={2} className="p-6 text-center text-gray-400 text-xs">No classes for this course in {academicSelection.semester}</td></tr>
                                 )}
                             </tbody>
                         </table>
                     )}
                </div>
            </div>
        </div>
      )}

      {/* --- ASSIGNMENTS TAB --- */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
               <div className="flex gap-4 items-center w-full sm:w-auto">
                 <h3 className="font-semibold text-gray-700">Course Assignments</h3>
                 <button 
                   onClick={() => handleOpenAssignModal()}
                   className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 flex items-center gap-1"
                 >
                   <Plus size={12}/> New
                 </button>
               </div>
               
               <div className="flex gap-2 w-full sm:w-auto">
                    {/* Semester Filter */}
                    <div className="relative">
                        <Filter className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <select 
                            className="pl-8 pr-8 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white min-w-[150px]"
                            value={assignSemesterFilter}
                            onChange={(e) => setAssignSemesterFilter(e.target.value)}
                        >
                            <option value="ALL">All Semesters</option>
                            {allSemesters.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                   <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input 
                        type="text" 
                        placeholder="Search..." 
                        className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                        value={assignmentSearchTerm}
                        onChange={(e) => setAssignmentSearchTerm(e.target.value)}
                        />
                   </div>
               </div>
             </div>
             <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-3">Teacher</th>
                  <th className="px-6 py-3">Course</th>
                  <th className="px-6 py-3">Class</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAssignments.length > 0 ? filteredAssignments.map(assign => {
                  const t = users.find(u => u.id === assign.teacherId);
                  const c = courses.find(co => co.id === assign.courseId);
                  const cl = classes.find(cls => cls.id === assign.classId);
                  return (
                    <tr key={assign.id}>
                      <td className="px-6 py-3 font-medium">{t?.name || 'Unknown'}</td>
                      <td className="px-6 py-3">{c?.code} - {c?.name}</td>
                      <td className="px-6 py-3">{cl?.name} ({cl?.semester})</td>
                      <td className="px-6 py-3 flex gap-2">
                         <button 
                            onClick={() => handleOpenAssignModal(assign)}
                            className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                         >
                            <Edit2 size={16} />
                         </button>
                         <button 
                            onClick={() => {
                                if(confirm("Remove this assignment?")) deleteAssignment(assign.id);
                            }}
                            className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50"
                         >
                            <Trash2 size={16} />
                         </button>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No assignments found.
                    </td>
                  </tr>
                )}
              </tbody>
             </table>
        </div>
      )}

      {/* --- GRADES TAB (Hierarchy) --- */}
      {activeTab === 'grades' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
             <h3 className="font-semibold text-gray-700 mb-4">Grade Report Drill-down</h3>
             <div className="flex flex-wrap gap-4 items-center">
                {/* 1. Select Semester */}
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 uppercase">1. Semester</label>
                    <select 
                        className="mt-1 p-2 border rounded-md text-sm min-w-[150px]"
                        value={gradeFilter.semester}
                        onChange={(e) => setGradeFilter({ semester: e.target.value, courseId: '', classId: '' })}
                    >
                        <option value="">Select Semester</option>
                        {gradeSemesters.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <ChevronRight className="text-gray-400 mt-5" size={20} />

                {/* 2. Select Course */}
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 uppercase">2. Course</label>
                    <select 
                        className="mt-1 p-2 border rounded-md text-sm min-w-[200px]"
                        value={gradeFilter.courseId}
                        onChange={(e) => setGradeFilter(prev => ({ ...prev, courseId: e.target.value, classId: '' }))}
                        disabled={!gradeFilter.semester}
                    >
                        <option value="">Select Course</option>
                        {coursesInGradeSemester.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                    </select>
                </div>

                <ChevronRight className="text-gray-400 mt-5" size={20} />

                {/* 3. Select Class */}
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 uppercase">3. Class</label>
                    <select 
                        className="mt-1 p-2 border rounded-md text-sm min-w-[150px]"
                        value={gradeFilter.classId}
                        onChange={(e) => setGradeFilter(prev => ({ ...prev, classId: e.target.value }))}
                        disabled={!gradeFilter.courseId}
                    >
                        <option value="">Select Class</option>
                        {classesInGradeCourse.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
             </div>
          </div>
          
          {/* Admin Grade Controls */}
          {gradeFilter.classId && reportGrades.length > 0 && (
             <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div className="flex items-center gap-4">
                     {isClassLocked ? (
                         <span className="flex items-center gap-2 text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200 font-bold">
                             <Ban size={14}/> Blocked / Locked by Admin
                         </span>
                     ) : isClassSubmitted ? (
                         <span className="flex items-center gap-2 text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200 font-bold">
                             <Lock size={14}/> Submitted by Teacher
                         </span>
                     ) : (
                         <span className="flex items-center gap-2 text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full border border-yellow-200 font-bold">
                             <Edit2 size={14}/> Draft / Editable
                         </span>
                     )}
                 </div>
                 <div className="flex gap-2">
                     {isClassLocked ? (
                         <button 
                             onClick={() => { if(confirm("Unblock grades? Teacher will be able to submit again.")) toggleGradeLock(gradeFilter.classId, false) }}
                             className="text-sm flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 shadow-sm"
                         >
                             <Unlock size={14} /> Unblock
                         </button>
                     ) : (
                         <button 
                             onClick={() => { if(confirm("Block grades? Teacher will NOT be able to submit anymore.")) toggleGradeLock(gradeFilter.classId, true) }}
                             className="text-sm flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 shadow-sm"
                         >
                             <Ban size={14} /> Block (Finalize)
                         </button>
                     )}
                 </div>
             </div>
          )}

          <div className="overflow-x-auto">
            {gradeFilter.classId ? (
                <table className="w-full text-left text-sm">
                <thead className="bg-white text-gray-600 border-b">
                    <tr>
                    <th className="px-6 py-3">Student ID</th>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3 text-center">Score (10)</th>
                    <th className="px-6 py-3 text-center">Score (4)</th>
                    <th className="px-6 py-3 text-center">Letter</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {reportGrades.length > 0 ? reportGrades.map(grade => {
                    const s = users.find(u => u.id === grade.studentId);
                    return (
                        <tr key={grade.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-mono text-gray-500">{s?.id}</td>
                        <td className="px-6 py-3 font-medium">{s?.name || grade.studentId}</td>
                        <td className="px-6 py-3 text-center">{grade.finalScore10 ?? '-'}</td>
                        <td className="px-6 py-3 text-center">{grade.finalScore4 ?? '-'}</td>
                        <td className="px-6 py-3 text-center font-bold">
                            <span className={grade.letterGrade === 'F' ? 'text-red-600' : 'text-green-600'}>
                            {grade.letterGrade ?? '-'}
                            </span>
                        </td>
                        </tr>
                    );
                    }) : (
                    <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No grades records found for this class.
                        </td>
                    </tr>
                    )}
                </tbody>
                </table>
            ) : (
                <div className="p-12 text-center text-gray-400">
                    <GraduationCap size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Please select a semester, course, and class to view the grade report.</p>
                </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL: USER --- */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h3 className="text-lg font-bold mb-4">{isEditingUser ? 'Edit User' : 'Add New User'}</h3>
            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">User ID</label>
                <input 
                  placeholder="ID" 
                  className={`w-full p-2 border rounded`}
                  value={userFormData.id || ''}
                  onChange={e => setUserFormData({...userFormData, id: e.target.value})}
                  required
                />
                {isEditingUser && (
                    <p className="text-[10px] text-yellow-600 mt-1">Warning: Changing ID will update all related records.</p>
                )}
              </div>
              <input 
                placeholder="Full Name" 
                className="w-full p-2 border rounded"
                value={userFormData.name || ''}
                onChange={e => setUserFormData({...userFormData, name: e.target.value})}
                required
              />
              <input 
                placeholder="Email" 
                className="w-full p-2 border rounded"
                value={userFormData.email || ''}
                onChange={e => setUserFormData({...userFormData, email: e.target.value})}
                required
              />
              <input 
                placeholder="Phone" 
                className="w-full p-2 border rounded"
                value={userFormData.phone || ''}
                onChange={e => setUserFormData({...userFormData, phone: e.target.value})}
              />
              <input 
                placeholder="Address" 
                className="w-full p-2 border rounded"
                value={userFormData.address || ''}
                onChange={e => setUserFormData({...userFormData, address: e.target.value})}
              />
              <select 
                className="w-full p-2 border rounded"
                value={userFormData.role}
                onChange={e => setUserFormData({...userFormData, role: e.target.value as UserRole})}
              >
                <option value={UserRole.STUDENT}>Student</option>
                <option value={UserRole.TEACHER}>Teacher</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </select>
              
              {!isEditingUser && (
                 <div className="text-xs text-gray-500 mt-2">
                   * Default password is "123"
                 </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: NEW SEMESTER --- */}
      {showNewSemesterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-80 shadow-xl">
                  <h3 className="font-bold mb-4">Add Semester</h3>
                  <div className="bg-blue-50 text-blue-700 p-3 rounded text-xs mb-4">
                      This will automatically create a default class section ("L01") for <strong>all existing courses</strong> in this new semester.
                  </div>
                  <input 
                     className="w-full p-2 border rounded mb-4"
                     placeholder="e.g. 2025-1"
                     value={newSemesterName}
                     onChange={e => setNewSemesterName(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setShowNewSemesterModal(false)} className="px-3 py-1.5 text-gray-600">Cancel</button>
                      <button onClick={handleAddSemester} className="px-3 py-1.5 bg-indigo-600 text-white rounded">Create & Initialize</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL: ADD COURSE TO SEMESTER (PICKER) --- */}
      {showAddCourseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-[500px] shadow-xl max-h-[80vh] flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">Add Course to {academicSelection.semester}</h3>
                      <button onClick={() => setShowAddCourseModal(false)}><X size={20}/></button>
                  </div>
                  
                  {/* Search inside picker */}
                  <input 
                     className="w-full p-2 border rounded mb-4"
                     placeholder="Search Global Course Catalog..."
                     value={courseSearchTerm}
                     onChange={e => setCourseSearchTerm(e.target.value)}
                  />

                  <div className="flex-1 overflow-y-auto border rounded mb-4">
                      {filteredGlobalCourses.map(c => (
                          <div key={c.id} className="p-3 border-b hover:bg-gray-50 flex justify-between items-center">
                              <div>
                                  <div className="font-bold">{c.code}</div>
                                  <div className="text-sm">{c.name}</div>
                              </div>
                              <button 
                                onClick={() => handleAddCourseToSemester(c.id)}
                                className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded border border-indigo-200"
                              >
                                  Select
                              </button>
                          </div>
                      ))}
                      {filteredGlobalCourses.length === 0 && (
                          <div className="p-4 text-center text-gray-500">No matching courses found.</div>
                      )}
                  </div>

                  <div className="pt-2 border-t text-center">
                      <p className="text-sm text-gray-500 mb-2">Can't find the course?</p>
                      <button 
                        onClick={() => { setShowAddCourseModal(false); setShowCreateCourseModal(true); }}
                        className="text-sm text-indigo-600 font-bold hover:underline"
                      >
                          + Create New Global Course
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL: CREATE NEW COURSE --- */}
      {showCreateCourseModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
                <h3 className="text-lg font-bold mb-4">Create Global Course</h3>
                <form onSubmit={handleCreateCourse} className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Course Code (ID)</label>
                        <input 
                            className="w-full p-2 border rounded"
                            placeholder="e.g., CS101"
                            value={newCourseData.code || ''}
                            onChange={e => setNewCourseData({...newCourseData, code: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Course Name</label>
                        <input 
                            className="w-full p-2 border rounded"
                            placeholder="e.g., Intro to Programming"
                            value={newCourseData.name || ''}
                            onChange={e => setNewCourseData({...newCourseData, name: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Credits</label>
                        <input 
                            type="number"
                            className="w-full p-2 border rounded"
                            value={newCourseData.credits || 3}
                            onChange={e => setNewCourseData({...newCourseData, credits: parseInt(e.target.value)})}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={() => setShowCreateCourseModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Create</button>
                    </div>
                </form>
             </div>
         </div>
      )}

      {/* --- MODAL: CLASS --- */}
      {showClassModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
                <h3 className="text-lg font-bold mb-4">
                    Add Class Section
                </h3>
                <form onSubmit={handleSaveClass} className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded text-sm mb-4">
                        <p><span className="font-bold">Semester:</span> {academicSelection.semester}</p>
                        <p><span className="font-bold">Course:</span> {academicSelection.courseId}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Class Name / Section</label>
                        <input 
                            className="w-full p-2 border rounded"
                            placeholder="e.g., L01"
                            value={classFormData.name || ''}
                            onChange={e => setClassFormData({...classFormData, name: e.target.value})}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={() => setShowClassModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Create Class</button>
                    </div>
                </form>
             </div>
         </div>
      )}

      {/* --- MODAL: ASSIGNMENT --- */}
      {showAssignModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
           <h3 className="text-lg font-bold mb-4">{isEditingAssign ? 'Edit Assignment' : 'New Assignment'}</h3>
           <form onSubmit={handleSaveAssignment} className="space-y-4">
             <div>
               <label className="block text-xs font-medium text-gray-500 mb-1">Teacher</label>
               <select 
                 className="w-full p-2 border rounded-md text-sm"
                 value={assignFormData.teacherId || ''}
                 onChange={(e) => setAssignFormData({...assignFormData, teacherId: e.target.value})}
                 required
               >
                 <option value="">Select Teacher...</option>
                 {users.filter(u => u.role === UserRole.TEACHER && u.isActive).map(t => (
                   <option key={t.id} value={t.id}>{t.name}</option>
                 ))}
               </select>
             </div>
             <div>
               <label className="block text-xs font-medium text-gray-500 mb-1">Course</label>
               <select 
                 className="w-full p-2 border rounded-md text-sm"
                 value={assignFormData.courseId || ''}
                 onChange={(e) => setAssignFormData({...assignFormData, courseId: e.target.value})}
                 required
               >
                 <option value="">Select Course...</option>
                 {courses.map(c => (
                   <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                 ))}
               </select>
             </div>
             <div>
               <label className="block text-xs font-medium text-gray-500 mb-1">Class Section</label>
               <select 
                 className="w-full p-2 border rounded-md text-sm"
                 value={assignFormData.classId || ''}
                 onChange={(e) => setAssignFormData({...assignFormData, classId: e.target.value})}
                 required
               >
                 <option value="">Select Class...</option>
                 {classes.map(c => (
                   <option key={c.id} value={c.id}>{c.name} ({c.semester})</option>
                 ))}
               </select>
             </div>
             <div className="flex justify-end gap-2 mt-4">
               <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
               <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save</button>
             </div>
           </form>
         </div>
       </div>
      )}

    </div>
  );
};
