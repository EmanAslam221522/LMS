import z from "zod";

export const UserSchema = z.object({
  id: z.number(),
  mocha_user_id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  role: z.enum(['teacher', 'student']),
  created_at: z.string(),
  updated_at: z.string(),
});

export type User = z.infer<typeof UserSchema>;

export const AssignmentSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  due_date: z.string().nullable(),
  max_score: z.number(),
  teacher_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Assignment = z.infer<typeof AssignmentSchema>;

export const QuizSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  due_date: z.string().nullable(),
  max_score: z.number(),
  teacher_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Quiz = z.infer<typeof QuizSchema>;

export const SubmissionSchema = z.object({
  id: z.number(),
  assignment_id: z.number(),
  student_id: z.number(),
  content: z.string().nullable(),
  score: z.number().nullable(),
  is_graded: z.number(),
  submitted_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Submission = z.infer<typeof SubmissionSchema>;

export const QuizSubmissionSchema = z.object({
  id: z.number(),
  quiz_id: z.number(),
  student_id: z.number(),
  content: z.string().nullable(),
  score: z.number().nullable(),
  is_graded: z.number(),
  submitted_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type QuizSubmission = z.infer<typeof QuizSubmissionSchema>;

export const CreateAssignmentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  due_date: z.string().optional(),
  max_score: z.number().min(1).optional(),
});

export const UpdateAssignmentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  due_date: z.string().optional(),
  max_score: z.number().min(1).optional(),
});

export const CreateQuizSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  due_date: z.string().optional(),
  max_score: z.number().min(1).optional(),
});

export const UpdateQuizSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  due_date: z.string().optional(),
  max_score: z.number().min(1).optional(),
});

export const SubmitAssignmentSchema = z.object({
  content: z.string().min(1),
});

export const SubmitQuizSchema = z.object({
  content: z.string().min(1),
});

export const GradeSubmissionSchema = z.object({
  score: z.number().min(0),
});

export const RegisterUserSchema = z.object({
  role: z.enum(['teacher', 'student']),
  name: z.string().min(1),
});
