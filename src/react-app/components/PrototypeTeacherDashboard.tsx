import { useState, useEffect } from 'react';
import { GraduationCap, Plus, FileText, Calendar, Users } from 'lucide-react';
import type { User, Assignment } from '@/shared/types';
import CreateAssignmentModal from './CreateAssignmentModal';
import AssignmentCard from './AssignmentCard';
import SubmissionsModal from './SubmissionsModal';

interface Props {
  user: User;
}

export default function PrototypeTeacherDashboard({ user }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/prototype/assignments');
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
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
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span className="text-gray-600 font-medium">Total Assignments</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{assignments.length}</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="text-gray-600 font-medium">Active</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {assignments.filter(a => !a.due_date || new Date(a.due_date) > new Date()).length}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-pink-600" />
              <span className="text-gray-600 font-medium">Role</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">Teacher</div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Assignment
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-md">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No assignments yet</h3>
            <p className="text-gray-600 mb-6">Create your first assignment to get started</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Create Assignment
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                isTeacher={true}
                onViewSubmissions={() => setSelectedAssignment(assignment)}
                onRefresh={fetchAssignments}
              />
            ))}
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <CreateAssignmentModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            fetchAssignments();
          }}
        />
      )}

      {selectedAssignment && (
        <PrototypeSubmissionsModal
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
        />
      )}
    </>
  );
}

function PrototypeSubmissionsModal({ assignment, onClose }: { assignment: Assignment; onClose: () => void }) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch(`/api/prototype/assignments/${assignment.id}/submissions`);
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

    fetchSubmissions();
  }, [assignment.id]);

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
            <span className="text-2xl">×</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No submissions yet</h3>
              <p className="text-gray-600">Students haven't submitted their work yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-gray-50 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 rounded-full p-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{submission.student_name}</div>
                        <div className="text-sm text-gray-600">{submission.student_email}</div>
                      </div>
                    </div>
                    {submission.is_graded ? (
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="font-bold text-green-600">{submission.score}/100</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
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
                    <div className="text-xs text-gray-500">
                      Submitted: {new Date(submission.submitted_at).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            This is a read-only demo view. Grading functionality is available when logged in as a teacher.
          </p>
        </div>
      </div>
    </div>
  );
}
