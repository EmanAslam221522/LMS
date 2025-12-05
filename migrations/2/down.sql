
DROP INDEX idx_quiz_submissions_student_id;
DROP INDEX idx_quiz_submissions_quiz_id;
DROP INDEX idx_quizzes_teacher_id;
DROP TABLE quiz_submissions;
DROP TABLE quizzes;
ALTER TABLE assignments DROP COLUMN max_score;
