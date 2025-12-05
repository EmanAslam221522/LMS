import { useState, useEffect } from 'react';
import { X, User, Clock, CheckCircle } from 'lucide-react';
import type { Assignment } from '@/shared/types';

interface SubmissionWithStudent {
  id: number;
  assignment_id: number;
  student_id: number;
  content: string | null;
  score: number | null;
  is_graded: number;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  student_name: string;
  student_email: string;
}

interface Props {
  assignment: Assignment;
  onClose: () => void;
}

export default function SubmissionsModal({ assignment, onClose }: Props) {
  const [submissions, setSubmissions] = useState<SubmissionWithStudent[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithStudent | null>(null);
  const [score, setScore] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, [assignment.id]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`/api/assignments/${assignment.id}/submissions`);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    const scoreNum = parseInt(score);
    if (scoreNum > assignment.max_score) {
      alert(`Score cannot exceed maximum score of ${assignment.max_score}`);
      return;
    }

    setIsGrading(true);
    try {
      const response = await fetch(`/api/submissions/${selectedSubmission.id}/grade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: scoreNum }),
      });

      if (response.ok) {
        await fetchSubmissions();
        setSelectedSubmission(null);
        setScore('');
      }
    } catch (error) {
      console.error('Error grading submission:', error);
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Submissions</h2>
            <p className="text-gray-600 text-sm mt-1">{assignment.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No submissions yet</h3>
              <p className="text-gray-600">Students haven't submitted their work yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 rounded-full p-2">
                        <User className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{submission.student_name}</div>
                        <div className="text-sm text-gray-600">{submission.student_email}</div>
                      </div>
                    </div>
                    {submission.is_graded ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-bold text-green-600">{submission.score}/{assignment.max_score}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="w-5 h-5" />
                        <span className="text-sm">Not graded</span>
                      </div>
                    )}
                  </div>

                  {submission.content && (
                    <div className="bg-white rounded-lg p-3 mb-3 text-sm text-gray-700 border border-gray-200">
                      {submission.content}
                    </div>
                  )}

                  {submission.submitted_at && (
                    <div className="text-xs text-gray-500 mb-3">
                      Submitted: {new Date(submission.submitted_at).toLocaleString()}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setScore(submission.score?.toString() || '');
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
                  >
                    {submission.is_graded ? 'Update Grade' : 'Grade Submission'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedSubmission && (
          <div className="border-t border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Grade Submission - {selectedSubmission.student_name}
            </h3>
            <form onSubmit={handleGrade} className="flex gap-3">
              <input
                type="number"
                min="0"
                max={assignment.max_score}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={`Score (0-${assignment.max_score})`}
                required
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedSubmission(null);
                  setScore('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGrading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors"
              >
                {isGrading ? 'Saving...' : 'Save Grade'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
