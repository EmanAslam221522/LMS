import { useState } from 'react';
import { X } from 'lucide-react';
import type { Quiz, QuizSubmission } from '@/shared/types';

interface Props {
  quiz: Quiz;
  existingSubmission?: QuizSubmission;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubmitQuizModal({ quiz, existingSubmission, onClose, onSuccess }: Props) {
  const [content, setContent] = useState(existingSubmission?.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {existingSubmission ? 'Update Quiz Submission' : 'Submit Quiz'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quiz
            </label>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="font-semibold text-gray-900">{quiz.title}</div>
              {quiz.description && (
                <div className="text-sm text-gray-600 mt-1">{quiz.description}</div>
              )}
              <div className="text-sm text-purple-600 mt-2 font-semibold">
                Maximum Score: {quiz.max_score}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Answers *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your quiz answers here..."
              rows={8}
              required
            />
          </div>

          {existingSubmission?.is_graded && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm text-yellow-800">
                Note: This quiz has already been graded. Updating your submission may require re-grading.
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content}
              className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors"
            >
              {isSubmitting ? 'Submitting...' : existingSubmission ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
