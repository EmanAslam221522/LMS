import { useState, useEffect } from 'react';
import { GraduationCap, Users } from 'lucide-react';
import PrototypeTeacherDashboard from '@/react-app/components/PrototypeTeacherDashboard';
import PrototypeStudentDashboard from '@/react-app/components/PrototypeStudentDashboard';
import type { User } from '@/shared/types';

export default function Prototype() {
  const [view, setView] = useState<'teacher' | 'student'>('teacher');
  const [teacherUser, setTeacherUser] = useState<User | null>(null);
  const [studentUser, setStudentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDemoUsers = async () => {
      try {
        const response = await fetch('/api/prototype/users');
        if (response.ok) {
          const data = await response.json();
          setTeacherUser(data.teacher);
          setStudentUser(data.student);
        }
      } catch (error) {
        console.error('Error fetching demo users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDemoUsers();
  }, []);

  if (isLoading || !teacherUser || !studentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 rounded-xl p-2">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">EduFlow Prototype</h1>
                <p className="text-xs text-gray-600">Interactive demo of the LMS</p>
              </div>
            </div>
            
            <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('teacher')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all ${
                  view === 'teacher'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Teacher View
              </button>
              <button
                onClick={() => setView('student')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all ${
                  view === 'student'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4" />
                Student View
              </button>
            </div>
          </div>
        </div>
      </div>

      {view === 'teacher' ? (
        <PrototypeTeacherDashboard user={teacherUser} />
      ) : (
        <PrototypeStudentDashboard user={studentUser} />
      )}
    </div>
  );
}
