import { Calendar, FileText, Edit, Trash2, Users, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import type { Quiz, QuizSubmission } from '@/shared/types';

interface Props {
  quiz: Quiz;
  isTeacher: boolean;
  submission?: QuizSubmission;
  onViewSubmissions?: () => void;
  onSubmit?: () => void;
  onRefresh: () => void;
}

export default function QuizCard({ quiz, isTeacher, submission, onViewSubmissions, onSubmit, onRefresh }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/quizzes/${quiz.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = quiz.due_date && new Date(quiz.due_date) < new Date();

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-purple-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{quiz.title}</h3>
            <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">QUIZ</span>
          </div>
          {quiz.description && (
            <p className="text-gray-600 text-sm line-clamp-2">{quiz.description}</p>
          )}
        </div>
        {isTeacher && (
          <div className="flex gap-2 ml-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {quiz.due_date && (
        <div className={`flex items-center gap-2 mb-4 text-sm ${
          isOverdue ? 'text-red-600' : 'text-gray-600'
        }`}>
          <Calendar className="w-4 h-4" />
          <span>Due: {formatDate(quiz.due_date)}</span>
          {isOverdue && <span className="text-xs font-semibold">(Overdue)</span>}
        </div>
      )}

      {!isTeacher && submission && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            {submission.is_graded ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-medium">Graded</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-blue-600 font-medium">Submitted</span>
              </>
            )}
          </div>
          {submission.is_graded && submission.score !== null && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
              <div className="text-2xl font-bold text-green-700">
                {submission.score}/{quiz.max_score}
              </div>
            </div>
          )}
        </div>
      )}

      {isTeacher ? (
        <button
          onClick={onViewSubmissions}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Users className="w-4 h-4" />
          View Submissions
        </button>
      ) : (
        <button
          onClick={onSubmit}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
            submission
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          {submission ? 'Update Submission' : 'Take Quiz'}
        </button>
      )}
    </div>
  );
}
