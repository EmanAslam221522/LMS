import { Calendar, FileText, Edit, Trash2, Users, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import type { Assignment, Submission } from '@/shared/types';
import EditAssignmentModal from './EditAssignmentModal';

interface Props {
  assignment: Assignment;
  isTeacher: boolean;
  submission?: Submission;
  onViewSubmissions?: () => void;
  onSubmit?: () => void;
  onRefresh: () => void;
}

export default function AssignmentCard({ assignment, isTeacher, submission, onViewSubmissions, onSubmit, onRefresh }: Props) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/assignments/${assignment.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
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

  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date();

  return (
    <>
      <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{assignment.title}</h3>
            {assignment.description && (
              <p className="text-gray-600 text-sm line-clamp-2">{assignment.description}</p>
            )}
          </div>
          {isTeacher && (
            <div className="flex gap-2 ml-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
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

        {assignment.due_date && (
          <div className={`flex items-center gap-2 mb-4 text-sm ${
            isOverdue ? 'text-red-600' : 'text-gray-600'
          }`}>
            <Calendar className="w-4 h-4" />
            <span>Due: {formatDate(assignment.due_date)}</span>
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
                  {submission.score}/{assignment.max_score}
                </div>
              </div>
            )}
          </div>
        )}

        {isTeacher ? (
          <button
            onClick={onViewSubmissions}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
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
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            {submission ? 'Update Submission' : 'Submit Work'}
          </button>
        )}
      </div>

      {isEditModalOpen && (
        <EditAssignmentModal
          assignment={assignment}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
