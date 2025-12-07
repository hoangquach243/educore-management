import React, { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { Download, TrendingUp, Award, Book, List, Calendar, Filter, X } from 'lucide-react';
import { GradeRecord } from '../types';

export const StudentDashboard: React.FC = () => {
  const { currentUser, grades, courses, classes, enrollments, gradeConfigs, assignments } = useSchool();
  
  // State for View Mode and Filters
  const [viewMode, setViewMode] = useState<'SEMESTER' | 'CONSOLIDATED'>('SEMESTER');
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');

  // State for Detail Modal
  const [selectedDetail, setSelectedDetail] = useState<{
    courseName: string;
    courseCode: string;
    semester: string;
    scores?: GradeRecord['scores'];
    weights?: { component: number, midterm: number, project: number, final: number };
  } | null>(null);

  // --- CORE DATA PROCESSING ---
  const academicData = useMemo(() => {
    if (!currentUser) return null;

    // 1. Get raw history (all enrollments)
    const rawHistory = enrollments
      .filter(e => e.studentId === currentUser.id)
      .map(e => {
        const cls = classes.find(c => c.id === e.classId);
        const crs = courses.find(c => c.id === e.courseId);
        const grade = grades.find(g => g.studentId === currentUser.id && g.classId === e.classId);
        
        return {
          id: e.id,
          classId: e.classId,
          semester: cls?.semester || 'Unknown',
          courseId: crs?.id,
          courseCode: crs?.code || 'N/A',
          courseName: crs?.name || 'Unknown Course',
          credits: crs?.credits || 0,
          scores: grade?.scores, // Include raw scores
          score10: grade?.isSubmitted ? grade.finalScore10 : undefined,
          score4: grade?.isSubmitted ? grade.finalScore4 : undefined,
          letter: grade?.isSubmitted ? grade.letterGrade : undefined,
          isSubmitted: grade?.isSubmitted || false,
          status: grade?.isSubmitted 
            ? (grade.finalScore4 && grade.finalScore4 >= 1.0 ? 'Passed' : 'Failed') 
            : 'In Progress'
        };
      })
      .sort((a, b) => b.semester.localeCompare(a.semester)); // Sort recent semester first

    // 2. Calculate Consolidated History (Best Grade per Course)
    const bestGradesMap = new Map<string, typeof rawHistory[0]>();
    
    rawHistory.forEach(record => {
      if (!record.courseId) return;
      
      const existing = bestGradesMap.get(record.courseId);
      
      // Logic: Prioritize Submitted grades. If both submitted, take higher score.
      if (!existing) {
        bestGradesMap.set(record.courseId, record);
      } else {
        if (record.isSubmitted) {
            if (!existing.isSubmitted || (record.score4 || 0) > (existing.score4 || 0)) {
                bestGradesMap.set(record.courseId, record);
            }
        }
      }
    });
    
    const consolidatedHistory = Array.from(bestGradesMap.values()).sort((a, b) => a.courseCode.localeCompare(b.courseCode));

    // 3. Calculate CPA (Cumulative GPA) based on Consolidated History
    let totalPoints = 0;
    let totalCredits = 0;
    
    consolidatedHistory.forEach(record => {
      if (record.isSubmitted && record.score4 !== undefined) {
        totalPoints += record.score4 * record.credits;
        totalCredits += record.credits;
      }
    });

    const cpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
    
    // 4. Get Unique Semesters for Filter
    const semesters = [...new Set(rawHistory.map(r => r.semester))].sort().reverse();

    return { cpa, totalCredits, rawHistory, consolidatedHistory, semesters };
  }, [currentUser, grades, courses, classes, enrollments]);

  if (!academicData) return <div className="p-6">Loading academic data...</div>;

  // --- HANDLER: SHOW DETAILS ---
  const handleRowClick = (record: typeof academicData.rawHistory[0]) => {
     // 1. Find the teacher assignment for this specific class to get specific configs
     const assign = assignments.find(a => a.classId === record.classId);
     let weights = { component: 10, midterm: 30, project: 20, final: 40 }; // Default fallback

     if (assign) {
        const config = gradeConfigs.find(c => c.courseId === assign.courseId && c.teacherId === assign.teacherId);
        if (config) weights = config.weights;
     }

     setSelectedDetail({
         courseName: record.courseName,
         courseCode: record.courseCode,
         semester: record.semester,
         scores: record.scores,
         weights
     });
  };

  // --- EXPORT FUNCTION ---
  const handleExport = () => {
    let dataToExport = [];
    let filename = '';

    if (viewMode === 'SEMESTER') {
        filename = `Transcript_History_${currentUser?.id}.csv`;
        // Filter by semester if selected
        dataToExport = selectedSemester === 'ALL' 
            ? academicData.rawHistory 
            : academicData.rawHistory.filter(h => h.semester === selectedSemester);
    } else {
        filename = `Transcript_Consolidated_${currentUser?.id}.csv`;
        dataToExport = academicData.consolidatedHistory;
    }

    // CSV Header
    const headers = ["Semester", "Course Code", "Course Name", "Credits", "Score (10)", "Score (4)", "Letter Grade", "Status"];
    
    // CSV Rows
    const rows = dataToExport.map(row => [
        row.semester,
        row.courseCode,
        `"${row.courseName}"`, // Quote name to handle commas
        row.credits,
        row.score10 ?? 'N/A',
        row.score4 ?? 'N/A',
        row.letter ?? 'N/A',
        row.status
    ]);

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

  // --- FILTERED DATA FOR TABLE ---
  const tableData = viewMode === 'CONSOLIDATED' 
    ? academicData.consolidatedHistory 
    : (selectedSemester === 'ALL' ? academicData.rawHistory : academicData.rawHistory.filter(r => r.semester === selectedSemester));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold text-gray-800">My Academic Record</h2>
           <p className="text-gray-500">Welcome back, {currentUser?.name} ({currentUser?.id})</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/20 rounded-lg">
              <TrendingUp className="text-white" size={24} />
            </div>
            <div>
              <p className="text-indigo-100 text-sm font-medium">Cumulative GPA (CPA)</p>
              <h3 className="text-3xl font-bold">{academicData.cpa}</h3>
            </div>
          </div>
          <div className="text-xs text-indigo-100 mt-2 bg-black/10 inline-block px-2 py-1 rounded">
            Calculated using highest grade per course
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Award size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Credits Earned</p>
            <h3 className="text-2xl font-bold text-gray-800">{academicData.totalCredits}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-lg text-green-600">
             <Book size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Unique Courses</p>
            <h3 className="text-2xl font-bold text-gray-800">{academicData.consolidatedHistory.length}</h3>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] flex flex-col">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col lg:flex-row justify-between items-center gap-4 bg-gray-50">
           
           {/* View Switcher */}
           <div className="flex bg-gray-200 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('SEMESTER')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'SEMESTER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Calendar size={16} /> By Semester
              </button>
              <button 
                onClick={() => setViewMode('CONSOLIDATED')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'CONSOLIDATED' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <List size={16} /> Consolidated (Best Grades)
              </button>
           </div>

           {/* Filters & Actions */}
           <div className="flex items-center gap-3 w-full lg:w-auto">
              {viewMode === 'SEMESTER' && (
                  <div className="relative flex-1 lg:flex-none">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <select 
                        className="w-full lg:w-48 pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value)}
                    >
                        <option value="ALL">All Semesters</option>
                        {academicData.semesters.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                  </div>
              )}
              
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
              >
                <Download size={16} /> Export {viewMode === 'SEMESTER' ? 'History' : 'Transcript'}
              </button>
           </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 px-4 py-2 text-xs text-blue-800 border-b border-blue-100 flex items-center gap-2">
            <Book size={14} />
            {viewMode === 'SEMESTER' 
                ? "Showing complete history including all attempts. Click on a row to view detailed scores."
                : "Showing unique courses (Highest Score). Click on a row to view detailed scores."
            }
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-gray-600 border-b">
              <tr>
                <th className="px-6 py-3">Semester</th>
                <th className="px-6 py-3">Course Code</th>
                <th className="px-6 py-3">Course Name</th>
                <th className="px-6 py-3 text-center">Credits</th>
                <th className="px-6 py-3 text-center">Score (10)</th>
                <th className="px-6 py-3 text-center">Score (4.0)</th>
                <th className="px-6 py-3 text-center">Letter</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tableData.length > 0 ? tableData.map((record, idx) => (
                <tr 
                    key={`${record.semester}_${record.courseCode}_${idx}`} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => handleRowClick(record)}
                >
                  <td className="px-6 py-4 font-medium text-gray-500">{record.semester}</td>
                  <td className="px-6 py-4 font-mono font-medium text-gray-900 group-hover:text-indigo-600">{record.courseCode}</td>
                  <td className="px-6 py-4 text-gray-800">{record.courseName}</td>
                  <td className="px-6 py-4 text-center text-gray-600">{record.credits}</td>
                  
                  {/* Scores */}
                  <td className="px-6 py-4 text-center font-mono text-gray-700">
                    {record.score10 !== undefined ? record.score10 : '-'}
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-bold text-indigo-600">
                    {record.score4 !== undefined ? record.score4 : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {record.letter ? (
                      <span className={`inline-block w-8 py-0.5 rounded text-xs font-bold ${
                        record.letter === 'F' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {record.letter}
                      </span>
                    ) : '-'}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      record.status === 'Passed' ? 'bg-green-50 text-green-700 border border-green-100' : 
                      record.status === 'Failed' ? 'bg-red-50 text-red-700 border border-red-100' :
                      'bg-yellow-50 text-yellow-700 border border-yellow-100'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400 bg-gray-50">
                        No records found for the selected criteria.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- DETAIL MODAL --- */}
      {selectedDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
                      <div>
                          <h3 className="font-bold text-lg">{selectedDetail.courseCode}</h3>
                          <p className="text-indigo-100 text-sm">{selectedDetail.courseName}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedDetail(null)}
                        className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors"
                      >
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-6">
                      <div className="mb-4 text-sm text-gray-500 flex justify-between">
                          <span>Semester: <strong>{selectedDetail.semester}</strong></span>
                      </div>

                      {/* Detail Table */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                              <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                                  <tr>
                                      <th className="px-4 py-2 text-left">Component</th>
                                      <th className="px-4 py-2 text-center">Weight</th>
                                      <th className="px-4 py-2 text-right">Score</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  <tr>
                                      <td className="px-4 py-3">Attendance/Comp</td>
                                      <td className="px-4 py-3 text-center text-gray-500">{selectedDetail.weights?.component}%</td>
                                      <td className="px-4 py-3 text-right font-mono">{selectedDetail.scores?.component ?? '-'}</td>
                                  </tr>
                                  <tr>
                                      <td className="px-4 py-3">Midterm</td>
                                      <td className="px-4 py-3 text-center text-gray-500">{selectedDetail.weights?.midterm}%</td>
                                      <td className="px-4 py-3 text-right font-mono">{selectedDetail.scores?.midterm ?? '-'}</td>
                                  </tr>
                                  <tr>
                                      <td className="px-4 py-3">Project/Assign</td>
                                      <td className="px-4 py-3 text-center text-gray-500">{selectedDetail.weights?.project}%</td>
                                      <td className="px-4 py-3 text-right font-mono">{selectedDetail.scores?.project ?? '-'}</td>
                                  </tr>
                                  <tr className="bg-gray-50/50">
                                      <td className="px-4 py-3 font-medium text-indigo-900">Final Exam</td>
                                      <td className="px-4 py-3 text-center text-gray-500">{selectedDetail.weights?.final}%</td>
                                      <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700">{selectedDetail.scores?.final ?? '-'}</td>
                                  </tr>
                              </tbody>
                          </table>
                      </div>

                      <div className="mt-6 flex justify-end">
                          <button 
                             onClick={() => setSelectedDetail(null)}
                             className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                          >
                              Close
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};