import { useState, useEffect } from 'react';
import { GraduationCap, LogOut, FileText, CheckCircle, Clock, BookOpen } from 'lucide-react';
import type { User, Assignment, Submission, Quiz, QuizSubmission } from '@/shared/types';
import AssignmentCard from './AssignmentCard';
import QuizCard from './QuizCard';
import SubmitAssignmentModal from './SubmitAssignmentModal';
import SubmitQuizModal from './SubmitQuizModal';

interface Props {
  user: User;
  onLogout: () => void;
}

export default function StudentDashboard({ user, onLogout }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [submissions, setSubmissions] = useState<Record<number, Submission>>({});
  const [quizSubmissions, setQuizSubmissions] = useState<Record<number, QuizSubmission>>({});
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [assignmentsRes, quizzesRes] = await Promise.all([
        fetch('/api/assignments'),
        fetch('/api/quizzes'),
      ]);

      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        setAssignments(assignmentsData);

        const submissionsMap: Record<number, Submission> = {};
        for (const assignment of assignmentsData) {
          const submissionsRes = await fetch(`/api/assignments/${assignment.id}/submissions`);
          if (submissionsRes.ok) {
            const submissionsData = await submissionsRes.json();
            if (submissionsData.length > 0) {
              submissionsMap[assignment.id] = submissionsData[0];
            }
          }
        }
        setSubmissions(submissionsMap);
      }

      if (quizzesRes.ok) {
        const quizzesData = await quizzesRes.json();
        setQuizzes(quizzesData);

        const quizSubmissionsMap: Record<number, QuizSubmission> = {};
        for (const quiz of quizzesData) {
          const submissionsRes = await fetch(`/api/quizzes/${quiz.id}/submissions`);
          if (submissionsRes.ok) {
            const submissionsData = await submissionsRes.json();
            if (submissionsData.length > 0) {
              quizSubmissionsMap[quiz.id] = submissionsData[0];
            }
          }
        }
        setQuizSubmissions(quizSubmissionsMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const submittedCount = Object.keys(submissions).length + Object.keys(quizSubmissions).length;
  const gradedCount = [...Object.values(submissions), ...Object.values(quizSubmissions)].filter(s => s.is_graded).length;

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 rounded-xl p-3">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
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
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-gray-600 font-medium">Submitted</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{submittedCount}</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-pink-600" />
              <span className="text-gray-600 font-medium">Graded</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{gradedCount}</div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Assignments & Quizzes</h2>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : assignments.length === 0 && quizzes.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-md">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No assignments or quizzes yet</h3>
            <p className="text-gray-600">Check back later for new assignments and quizzes</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => (
              <AssignmentCard
                key={`assignment-${assignment.id}`}
                assignment={assignment}
                isTeacher={false}
                submission={submissions[assignment.id]}
                onSubmit={() => setSelectedAssignment(assignment)}
                onRefresh={fetchData}
              />
            ))}
            {quizzes.map((quiz) => (
              <QuizCard
                key={`quiz-${quiz.id}`}
                quiz={quiz}
                isTeacher={false}
                submission={quizSubmissions[quiz.id]}
                onSubmit={() => setSelectedQuiz(quiz)}
                onRefresh={fetchData}
              />
            ))}
          </div>
        )}
      </div>

      {selectedAssignment && (
        <SubmitAssignmentModal
          assignment={selectedAssignment}
          existingSubmission={submissions[selectedAssignment.id]}
          onClose={() => setSelectedAssignment(null)}
          onSuccess={() => {
            setSelectedAssignment(null);
            fetchData();
          }}
        />
      )}

      {selectedQuiz && (
        <SubmitQuizModal
          quiz={selectedQuiz}
          existingSubmission={quizSubmissions[selectedQuiz.id]}
          onClose={() => setSelectedQuiz(null)}
          onSuccess={() => {
            setSelectedQuiz(null);
            fetchData();
          }}
        />
      )}
    </>
  );
}
