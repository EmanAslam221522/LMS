import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import type { User } from '@/shared/types';
import TeacherDashboard from '@/react-app/components/TeacherDashboard';
import StudentDashboard from '@/react-app/components/StudentDashboard';

export default function Dashboard() {
  const { user: mochaUser, isPending, logout } = useAuth();
  const navigate = useNavigate();
  const [appUser, setAppUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !mochaUser) {
      navigate('/');
    }
  }, [mochaUser, isPending, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/app-users/profile');
        if (response.ok) {
          const data = await response.json();
          setAppUser(data);
        } else {
          navigate('/register');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (mochaUser) {
      fetchProfile();
    }
  }, [mochaUser, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isPending || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!appUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="bg-indigo-600 text-white py-2 px-4 text-center text-sm">
        Testing the app? Try the <a href="/prototype" className="underline font-semibold hover:text-indigo-200">interactive prototype</a> to see both teacher and student views
      </div>
      {appUser.role === 'teacher' ? (
        <TeacherDashboard user={appUser} onLogout={handleLogout} />
      ) : (
        <StudentDashboard user={appUser} onLogout={handleLogout} />
      )}
    </div>
  );
}
