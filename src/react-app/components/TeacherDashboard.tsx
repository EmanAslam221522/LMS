import { useState, useEffect } from 'react';
import { GraduationCap, Plus, LogOut, Calendar, FileText, Users, BookOpen } from 'lucide-react';
import type { User, Assignment, Quiz } from '@/shared/types';
import CreateAssignmentModal from './CreateAssignmentModal';
import CreateQuizModal from './CreateQuizModal';
import AssignmentCard from './AssignmentCard';
import QuizCard from './QuizCard';
import SubmissionsModal from './SubmissionsModal';
import QuizSubmissionsModal from './QuizSubmissionsModal';

interface Props {
  user: User;
  onLogout: () => void;
}

export default function TeacherDashboard({ user, onLogout }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isCreateAssignmentModalOpen, setIsCreateAssignmentModalOpen] = useState(false);
  const [isCreateQuizModalOpen, setIsCreateQuizModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssignments = async () => {
    try {
      const [assignmentsRes, quizzesRes] = await Promise.all([
        fetch('/api/assignments'),
        fetch('/api/quizzes'),
      ]);
      
      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json();
        setAssignments(data);
      }
      
      if (quizzesRes.ok) {
        const data = await quizzesRes.json();
        setQuizzes(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 rounded-xl p-3">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.name}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span className="text-gray-600 font-medium">Assignments</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{assignments.length}</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <span className="text-gray-600 font-medium">Quizzes</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{quizzes.length}</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-pink-600" />
              <span className="text-gray-600 font-medium">Active</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {[...assignments, ...quizzes].filter(a => !a.due_date || new Date(a.due_date) > new Date()).length}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-green-600" />
              <span className="text-gray-600 font-medium">Total Items</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{assignments.length + quizzes.length}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Assignments & Quizzes</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setIsCreateAssignmentModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Assignment
            </button>
            <button
              onClick={() => setIsCreateQuizModalOpen(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Quiz
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : assignments.length === 0 && quizzes.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-md">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No assignments or quizzes yet</h3>
            <p className="text-gray-600 mb-6">Create your first assignment or quiz to get started</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsCreateAssignmentModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Create Assignment
              </button>
              <button
                onClick={() => setIsCreateQuizModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Create Quiz
              </button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => (
              <AssignmentCard
                key={`assignment-${assignment.id}`}
                assignment={assignment}
                isTeacher={true}
                onViewSubmissions={() => setSelectedAssignment(assignment)}
                onRefresh={fetchAssignments}
              />
            ))}
            {quizzes.map((quiz) => (
              <QuizCard
                key={`quiz-${quiz.id}`}
                quiz={quiz}
                isTeacher={true}
                onViewSubmissions={() => setSelectedQuiz(quiz)}
                onRefresh={fetchAssignments}
              />
            ))}
          </div>
        )}
      </div>

      {isCreateAssignmentModalOpen && (
        <CreateAssignmentModal
          onClose={() => setIsCreateAssignmentModalOpen(false)}
          onSuccess={() => {
            setIsCreateAssignmentModalOpen(false);
            fetchAssignments();
          }}
        />
      )}

      {isCreateQuizModalOpen && (
        <CreateQuizModal
          onClose={() => setIsCreateQuizModalOpen(false)}
          onSuccess={() => {
            setIsCreateQuizModalOpen(false);
            fetchAssignments();
          }}
        />
      )}

      {selectedAssignment && (
        <SubmissionsModal
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
        />
      )}

      {selectedQuiz && (
        <QuizSubmissionsModal
          quiz={selectedQuiz}
          onClose={() => setSelectedQuiz(null)}
        />
      )}
    </>
  );
}
