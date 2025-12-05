import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { GraduationCap, Users } from 'lucide-react';

export default function Register() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isPending && !user) {
      navigate('/');
    }

    const checkExistingUser = async () => {
      try {
        const response = await fetch('/api/app-users/profile');
        if (response.ok) {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error checking user profile:', error);
      }
    };

    if (user) {
      checkExistingUser();
    }
  }, [user, isPending, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/app-users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, name }),
      });

      if (response.ok) {
        navigate('/dashboard');
      } else {
        alert('Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-indigo-600 rounded-2xl p-4 w-fit mx-auto mb-4">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to EduFlow</h1>
          <p className="text-gray-600">Complete your profile to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              I am a...
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  role === 'teacher'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <GraduationCap className={`w-8 h-8 mx-auto mb-2 ${
                  role === 'teacher' ? 'text-indigo-600' : 'text-gray-400'
                }`} />
                <div className={`font-semibold ${
                  role === 'teacher' ? 'text-indigo-900' : 'text-gray-600'
                }`}>
                  Teacher
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('student')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  role === 'student'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Users className={`w-8 h-8 mx-auto mb-2 ${
                  role === 'student' ? 'text-indigo-600' : 'text-gray-400'
                }`} />
                <div className={`font-semibold ${
                  role === 'student' ? 'text-indigo-900' : 'text-gray-600'
                }`}>
                  Student
                </div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            {isSubmitting ? 'Creating Profile...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
