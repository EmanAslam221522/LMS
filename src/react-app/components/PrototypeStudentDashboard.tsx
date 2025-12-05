import { useState, useEffect } from 'react';
import { GraduationCap, FileText, CheckCircle, Clock } from 'lucide-react';
import type { User, Assignment, Submission } from '@/shared/types';
import AssignmentCard from './AssignmentCard';

interface Props {
  user: User;
}

export default function PrototypeStudentDashboard({ user }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<number, Submission>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [assignmentsRes, submissionsRes] = await Promise.all([
        fetch('/api/prototype/assignments'),
        fetch(`/api/prototype/student/${user.id}/submissions`),
      ]);

      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        setAssignments(assignmentsData);
      }

      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json();
        setSubmissions(submissionsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const submittedCount = Object.keys(submissions).length;
  const gradedCount = Object.values(submissions).filter(s => s.is_graded).length;

  return (
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
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-gray-600 font-medium">Submitted</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{submittedCount}</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="text-gray-600 font-medium">Graded</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{gradedCount}</div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Assignments</h2>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-md">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No assignments yet</h3>
          <p className="text-gray-600">Check back later for new assignments</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <PrototypeAssignmentCard
              key={assignment.id}
              assignment={assignment}
              submission={submissions[assignment.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PrototypeAssignmentCard({ assignment, submission }: { assignment: Assignment; submission?: Submission }) {
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
    <div className="bg-white rounded-xl p-6 shadow-md">
      <div className="flex-1 mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{assignment.title}</h3>
        {assignment.description && (
          <p className="text-gray-600 text-sm line-clamp-2">{assignment.description}</p>
        )}
      </div>

      {assignment.due_date && (
        <div className={`flex items-center gap-2 mb-4 text-sm ${
          isOverdue ? 'text-red-600' : 'text-gray-600'
        }`}>
          <span>📅</span>
          <span>Due: {formatDate(assignment.due_date)}</span>
          {isOverdue && <span className="text-xs font-semibold">(Overdue)</span>}
        </div>
      )}

      {submission && (
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
                {submission.score}/100
              </div>
            </div>
          )}
        </div>
      )}

      <button
        disabled
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold bg-gray-100 text-gray-500 cursor-not-allowed"
      >
        <FileText className="w-4 h-4" />
        {submission ? 'Submitted' : 'Demo Mode'}
      </button>
    </div>
  );
}
