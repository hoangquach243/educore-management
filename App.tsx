import React, { useState } from 'react';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { LoginForm } from './components/LoginForm';
import { AdminDashboard } from './components/AdminDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { UserProfile } from './components/UserProfile';
import { UserRole } from './types';
import { LogOut, User as UserIcon } from 'lucide-react';

const DashboardShell: React.FC = () => {
  const { currentUser, logout } = useSchool();
  const [showProfile, setShowProfile] = useState(false);

  if (!currentUser) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg font-bold">EC</div>
          <span className="font-bold text-xl text-gray-800 tracking-tight">EduCore</span>
        </div>
        <div className="flex items-center gap-6">
          <button 
             onClick={() => setShowProfile(true)}
             className="text-right hidden sm:block hover:bg-gray-50 p-2 rounded-lg transition-colors group cursor-pointer"
          >
            <div className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{currentUser.name}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">{currentUser.role}</div>
          </button>
          
          <button 
            onClick={() => setShowProfile(true)}
            className="sm:hidden p-2 text-gray-600 hover:text-indigo-600"
          >
            <UserIcon size={20} />
          </button>

          <button 
            onClick={logout}
            className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {currentUser.role === UserRole.ADMIN && <AdminDashboard />}
        {currentUser.role === UserRole.TEACHER && <TeacherDashboard />}
        {currentUser.role === UserRole.STUDENT && <StudentDashboard />}
      </main>

      {/* Profile Modal */}
      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SchoolProvider>
      <DashboardShell />
    </SchoolProvider>
  );
};

export default App;