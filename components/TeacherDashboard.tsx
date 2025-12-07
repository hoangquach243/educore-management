
import React, { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { GradeConfig, GradeRecord, UserRole } from '../types';
import { calculateScores } from '../constants';
import { Users, Settings, Save, Lock, Download, ChevronRight, Trash2, BookOpen, Search, UserPlus, Filter, Send, CheckCircle, Edit2, Ban, RefreshCw } from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { currentUser, assignments, classes, courses, users, enrollments, grades, gradeConfigs, updateScores, submitGrades, updateGradeConfig, enrollStudent, removeStudent, addUser } = useSchool();
  
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  // Add Student State
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentName, setNewStudentName] = useState('');

  // Search & Filter States
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // Derived Data
  const myAssignments = assignments.filter(a => a.teacherId === currentUser?.id);
  
  // Get unique semesters for filter
  const mySemesters = useMemo(() => {
     const sems = new Set(myAssignments.map(a => {
         const c = classes.find(cl => cl.id === a.classId);
         return c?.semester;
     }).filter(Boolean));
     return Array.from(sems).sort().reverse();
  }, [myAssignments, classes]);

  // Filter Class List in Sidebar
  const filteredAssignments = myAssignments.filter(assign => {
      const c = classes.find(cl => cl.id === assign.classId);
      const course = courses.find(co => co.id === assign.courseId);
      const term = classSearchTerm.toLowerCase();
      
      const matchesSearch = (
          (c?.name.toLowerCase().includes(term) || '') || 
          (c?.semester.toLowerCase().includes(term) || '') ||
          (course?.code.toLowerCase().includes(term) || '')
      );

      const matchesSemester = semesterFilter === 'ALL' || c?.semester === semesterFilter;

      return matchesSearch && matchesSemester;
  });

  const selectedAssignment = myAssignments.find(a => a.classId === selectedClassId);
  const selectedCourse = courses.find(c => c.id === selectedAssignment?.courseId);
  const selectedClassInfo = classes.find(c => c.id === selectedClassId);
  
  const classEnrollments = enrollments.filter(e => e.classId === selectedClassId);
  
  // Filter Students in Grade Table
  const filteredEnrollments = classEnrollments.filter(enr => {
      const student = users.find(u => u.id === enr.studentId);
      const term = studentSearchTerm.toLowerCase();
      
      return (
          (student?.name.toLowerCase().includes(term) || '') ||
          (student?.id.toLowerCase().includes(term) || '')
      );
  });

  const classGrades = grades.filter(g => g.classId === selectedClassId);
  
  // Current Weights
  const currentConfig = gradeConfigs.find(c => c.courseId === selectedCourse?.id && c.teacherId === currentUser?.id) 
    || { weights: { component: 10, midterm: 30, project: 20, final: 40 } };

  const [tempWeights, setTempWeights] = useState(currentConfig.weights);

  const hasSubmitted = classGrades.length > 0 && classGrades[0].isSubmitted;
  const isLocked = classGrades.length > 0 && classGrades[0].isLocked;

  // Export Class Grades to CSV
  const handleExportClassGrades = () => {
    if (!selectedClassId || !selectedCourse || !selectedClassInfo) return;

    const filename = `ClassGrades_${selectedCourse.code}_${selectedClassInfo.semester}_${selectedClassInfo.name}.csv`;

    // CSV Header
    const headers = [
      "Student ID",
      "Student Name",
      "Component Score",
      "Midterm Score",
      "Project Score",
      "Final Score",
      "Final Score (10)",
      "Final Score (4)",
      "Letter Grade",
      "Status"
    ];

    // CSV Rows
    const rows = filteredEnrollments.map(enr => {
      const student = users.find(u => u.id === enr.studentId);
      const gradeRecord = classGrades.find(g => g.studentId === enr.studentId);

      return [
        enr.studentId,
        `"${student?.name || 'N/A'}"`,
        gradeRecord?.scores.component ?? 'N/A',
        gradeRecord?.scores.midterm ?? 'N/A',
        gradeRecord?.scores.project ?? 'N/A',
        gradeRecord?.scores.final ?? 'N/A',
        gradeRecord?.finalScore10 ?? 'N/A',
        gradeRecord?.finalScore4 ?? 'N/A',
        gradeRecord?.letterGrade ?? 'N/A',
        gradeRecord?.isSubmitted ? 'Submitted' : 'Pending'
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" // BOM for Excel
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleScoreChange = (recordId: string, field: keyof GradeRecord['scores'], value: string) => {
    const numVal = value === '' ? undefined : Math.min(10, Math.max(0, parseFloat(value)));
    const record = grades.find(g => g.id === recordId);
    if (record && !record.isLocked) { // Check Lock instead of Submit
      updateScores(recordId, { ...record.scores, [field]: numVal });
    }
  };

  const handleSaveWeights = () => {
    if (selectedCourse && currentUser) {
      const total = tempWeights.component + tempWeights.midterm + tempWeights.project + tempWeights.final;
      if (total !== 100) {
        alert(`Total weights must equal 100%. Current: ${total}%`);
        return;
      }
      updateGradeConfig({
        courseId: selectedCourse.id,
        teacherId: currentUser.id,
        weights: tempWeights
      });
      setShowConfigModal(false);
    }
  };

  const handleAddStudent = () => {
    if (!selectedClassId || !selectedCourse || !newStudentId) return;

    // 1. Check if user exists
    const existingUser = users.find(u => u.id === newStudentId);

    if (existingUser) {
        if (existingUser.role !== UserRole.STUDENT) {
            alert(`User ID ${newStudentId} belongs to a ${existingUser.role}, not a student.`);
            return;
        }
        enrollStudent(existingUser.id, selectedClassId, selectedCourse.id);
        alert(`Existing student ${existingUser.name} added to class.`);
    } else {
        if (!newStudentName) {
            alert("Student ID not found. Please enter a Name to create a new student record.");
            return;
        }
        // 2. Create new user if not exists
        addUser({
            id: newStudentId,
            name: newStudentName,
            email: `${newStudentId}@student.uni.edu`, // Auto-gen email
            role: UserRole.STUDENT,
            isActive: true,
            password: '123'
        });
        // 3. Enroll
        enrollStudent(newStudentId, selectedClassId, selectedCourse.id);
        alert(`New student ${newStudentName} created and added to class.`);
    }
    
    // Reset form
    setNewStudentId('');
    setNewStudentName('');
  };

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Sidebar - Class List */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 space-y-3">
          <h3 className="font-semibold text-gray-700">My Classes</h3>
          
          {/* Semester Filter */}
          <div className="relative">
             <Filter className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
             <select 
               className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none bg-white"
               value={semesterFilter}
               onChange={e => setSemesterFilter(e.target.value)}
             >
                <option value="ALL">All Semesters</option>
                {mySemesters.map(s => <option key={s} value={s as string}>{s}</option>)}
             </select>
          </div>

          <div className="relative">
             <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
             <input 
               type="text" 
               placeholder="Search class..." 
               className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
               value={classSearchTerm}
               onChange={e => setClassSearchTerm(e.target.value)}
             />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredAssignments.map(assign => {
             const c = classes.find(cl => cl.id === assign.classId);
             const course = courses.find(co => co.id === assign.courseId);
             // Check status
             const gradesForClass = grades.filter(g => g.classId === assign.classId);
             const isSub = gradesForClass.length > 0 && gradesForClass[0].isSubmitted;
             const isLock = gradesForClass.length > 0 && gradesForClass[0].isLocked;

             return (
               <button
                 key={assign.id}
                 onClick={() => setSelectedClassId(assign.classId)}
                 className={`w-full text-left p-3 rounded-lg text-sm transition-colors relative ${
                   selectedClassId === assign.classId ? 'bg-indigo-100 text-indigo-700 font-medium' : 'hover:bg-gray-100 text-gray-600'
                 }`}
               >
                 <div className="flex justify-between">
                     <div className="font-bold">{course?.code}</div>
                     {isLock ? <Ban size={12} className="text-red-500" /> : isSub ? <Lock size={12} className="text-green-500" /> : null}
                 </div>
                 <div className="text-xs">{c?.name}</div>
                 <div className="text-[10px] text-gray-400 mt-1">{c?.semester}</div>
               </button>
             );
          })}
          {filteredAssignments.length === 0 && (
              <div className="text-xs text-center text-gray-400 py-4">No classes found</div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedClassId ? (
          <>
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 flex flex-col gap-4 bg-white">
              <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{selectedCourse?.code} - {selectedClassInfo?.name}</h2>
                    <div className="text-sm text-gray-500 mt-1 flex gap-4 items-center">
                      <span>Semester: {selectedClassInfo?.semester}</span>
                      <span>Students: {classEnrollments.length}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportClassGrades}
                      className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
                    >
                      <Download size={16} /> Export CSV
                    </button>

                    <button
                      onClick={() => {
                        setTempWeights(currentConfig.weights);
                        setShowConfigModal(true);
                      }}
                      disabled={isLocked}
                      className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 disabled:opacity-50"
                    >
                      <Settings size={16} /> Config Weights
                    </button>

                    {/* Submit Button Logic */}
                    {!isLocked ? (
                        <button
                            onClick={() => {
                                if(confirm("Submit grades to Admin? You can edit and resubmit later unless Admin blocks it.")) {
                                    submitGrades(selectedClassId);
                                }
                            }}
                            className={`flex items-center gap-2 px-3 py-2 text-sm text-white rounded-md shadow-sm ${
                                hasSubmitted ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                        >
                            {hasSubmitted ? <RefreshCw size={16} /> : <Send size={16} />}
                            {hasSubmitted ? "Resubmit Updates" : "Submit to Admin"}
                        </button>
                    ) : (
                        <button disabled className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-400 rounded-md border border-gray-200 cursor-not-allowed">
                            <Lock size={16} /> Submission Blocked
                        </button>
                    )}
                  </div>
              </div>

              {/* STATUS INDICATOR BOXES */}
              {isLocked ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-3 items-center shadow-sm">
                    <div className="bg-red-100 p-2 rounded-full text-red-600 shrink-0">
                        <Ban size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-red-800">Submission Locked by Admin</h4>
                        <p className="text-xs text-red-700">This grade report has been finalized. Editing is disabled.</p>
                    </div>
                  </div>
              ) : hasSubmitted ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-3 items-center shadow-sm">
                    <div className="bg-green-100 p-2 rounded-full text-green-600 shrink-0">
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-green-800">Grades Submitted Successfully</h4>
                        <p className="text-xs text-green-700">
                            Grades have been sent to Admin. You can continue to edit and "Resubmit Updates" if needed.
                        </p>
                    </div>
                  </div>
              ) : null}

              {/* Action Bar: Search & Add */}
              <div className="flex items-end justify-between gap-4">
                 <div className="relative w-64">
                    <label className="text-xs text-gray-500 mb-1 block">Filter Students</label>
                    <Search className="absolute left-2 bottom-2.5 text-gray-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Search name or ID..." 
                      className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      value={studentSearchTerm}
                      onChange={e => setStudentSearchTerm(e.target.value)}
                    />
                 </div>
                 
                 {/* Add Student Form */}
                 {!isLocked && (
                    <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                      <div>
                          <label className="text-xs text-gray-500 block mb-1">Student ID *</label>
                          <input 
                            type="text" 
                            className="text-sm p-1.5 border rounded w-32 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. 240001"
                            value={newStudentId}
                            onChange={(e) => setNewStudentId(e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="text-xs text-gray-500 block mb-1">Name (If new)</label>
                          <input 
                            type="text" 
                            className="text-sm p-1.5 border rounded w-40 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Full Name"
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                          />
                      </div>
                      <button 
                          onClick={handleAddStudent}
                          disabled={!newStudentId}
                          className="flex items-center gap-1 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 disabled:opacity-50 h-[34px]"
                      >
                        <UserPlus size={16} /> Add
                      </button>
                    </div>
                  )}
              </div>
            </div>

            {/* Config Weights Modal */}
            {showConfigModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                 <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                    <h3 className="font-bold text-lg mb-4">Grade Distribution</h3>
                    <div className="space-y-3">
                      {Object.entries(tempWeights).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center">
                           <label className="capitalize text-sm text-gray-600">{key}</label>
                           <div className="flex items-center gap-1">
                             <input 
                               type="number" 
                               value={val}
                               onChange={(e) => setTempWeights({...tempWeights, [key]: parseInt(e.target.value) || 0})}
                               className="w-16 p-1 border rounded text-right"
                             />
                             <span className="text-gray-500">%</span>
                           </div>
                        </div>
                      ))}
                      <div className="pt-2 border-t flex justify-between font-bold text-sm">
                        <span>Total</span>
                        <span className={
                          (tempWeights.component + tempWeights.midterm + tempWeights.project + tempWeights.final) === 100 
                          ? "text-green-600" : "text-red-600"
                        }>
                          {tempWeights.component + tempWeights.midterm + tempWeights.project + tempWeights.final}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                      <button onClick={() => setShowConfigModal(false)} className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                      <button onClick={handleSaveWeights} className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save Config</button>
                    </div>
                 </div>
              </div>
            )}

            {/* Grades Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 bg-gray-50">Student ID</th>
                    <th className="px-4 py-3 bg-gray-50">Student Name</th>
                    <th className="px-4 py-3 bg-gray-50 w-24 text-center">Component ({currentConfig.weights.component}%)</th>
                    <th className="px-4 py-3 bg-gray-50 w-24 text-center">Midterm ({currentConfig.weights.midterm}%)</th>
                    <th className="px-4 py-3 bg-gray-50 w-24 text-center">Project ({currentConfig.weights.project}%)</th>
                    <th className="px-4 py-3 bg-gray-50 w-24 text-center">Final ({currentConfig.weights.final}%)</th>
                    <th className="px-4 py-3 bg-gray-50 w-24 text-center font-bold text-gray-800">Total (10)</th>
                    <th className="px-4 py-3 bg-gray-50 w-20 text-center font-bold text-gray-800">4.0 Scale</th>
                    <th className="px-4 py-3 bg-gray-50 w-20 text-center font-bold text-gray-800">Grade</th>
                    {!isLocked && <th className="px-4 py-3 bg-gray-50">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEnrollments.map(enr => {
                    const student = users.find(u => u.id === enr.studentId);
                    const gradeRecord = grades.find(g => g.studentId === enr.studentId && g.classId === selectedClassId);
                    
                    // Display values: Use calculated preview if not strictly submitted/locked
                    let displayVals = { final10: gradeRecord?.finalScore10, final4: gradeRecord?.finalScore4, letter: gradeRecord?.letterGrade };
                    
                    // Always calc live preview if not locked, to show what "Submit" will produce
                    if (!isLocked && gradeRecord?.scores) {
                         const calc = calculateScores(gradeRecord.scores, currentConfig.weights);
                         displayVals = { final10: calc.final10, final4: calc.final4, letter: calc.letter };
                    }

                    return (
                      <tr key={enr.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-gray-500">{student?.id}</td>
                        <td className="px-4 py-2 font-medium">{student?.name}</td>
                        {['component', 'midterm', 'project', 'final'].map((field) => (
                           <td key={field} className="px-4 py-2 text-center">
                             <input 
                               type="number"
                               disabled={isLocked}
                               className={`w-16 p-1 border rounded text-center focus:ring-2 focus:ring-indigo-500 outline-none ${isLocked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                               value={gradeRecord?.scores[field as keyof typeof gradeRecord.scores] ?? ''}
                               onChange={(e) => handleScoreChange(gradeRecord!.id, field as any, e.target.value)}
                             />
                           </td>
                        ))}
                        <td className="px-4 py-2 text-center font-bold">{displayVals.final10 ?? '-'}</td>
                        <td className="px-4 py-2 text-center text-indigo-600">{displayVals.final4 ?? '-'}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`inline-block w-8 py-0.5 rounded text-xs font-bold 
                            ${displayVals.letter === 'F' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}
                          `}>
                            {displayVals.letter ?? '-'}
                          </span>
                        </td>
                        {!isLocked && (
                          <td className="px-4 py-2">
                             <button 
                               onClick={() => {
                                 if(confirm("Remove student from class?")) removeStudent(enr.studentId, enr.classId);
                               }}
                               className="text-red-500 hover:text-red-700 p-1"
                             >
                               <Trash2 size={16}/>
                             </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredEnrollments.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                    {classEnrollments.length > 0 ? "No students match your search." : "No students enrolled in this class."}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <BookOpen size={48} className="mb-4 opacity-50" />
            <p>Select a class from the sidebar to start grading.</p>
          </div>
        )}
      </div>
    </div>
  );
};
