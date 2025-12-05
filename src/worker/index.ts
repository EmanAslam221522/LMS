import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import {
  CreateAssignmentSchema,
  UpdateAssignmentSchema,
  SubmitAssignmentSchema,
  CreateQuizSchema,
  UpdateQuizSchema,
  SubmitQuizSchema,
  GradeSubmissionSchema,
  RegisterUserSchema,
} from "@/shared/types";

const app = new Hono<{ Bindings: Env }>();

// Auth routes
app.get("/api/oauth/google/redirect_url", async (c) => {
  const redirectUrl = await getOAuthRedirectUrl("google", {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60,
  });

  return c.json({ success: true }, 200);
});

app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

// Prototype routes
app.get("/api/prototype/users", async (c) => {
  const teacher = await c.env.DB.prepare(
    "SELECT * FROM users WHERE role = 'teacher' LIMIT 1"
  ).first();

  const student = await c.env.DB.prepare(
    "SELECT * FROM users WHERE role = 'student' LIMIT 1"
  ).first();

  return c.json({ teacher, student });
});

app.get("/api/prototype/assignments", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM assignments WHERE teacher_id = 1 ORDER BY created_at DESC"
  ).all();
  return c.json(results);
});

app.get("/api/prototype/assignments/:id/submissions", async (c) => {
  const assignmentId = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    `SELECT s.*, u.name as student_name, u.email as student_email 
     FROM submissions s 
     JOIN users u ON s.student_id = u.id 
     WHERE s.assignment_id = ? 
     ORDER BY s.submitted_at DESC`
  ).bind(assignmentId).all();
  return c.json(results);
});

app.get("/api/prototype/student/:studentId/submissions", async (c) => {
  const studentId = c.req.param("studentId");
  const assignments = await c.env.DB.prepare(
    "SELECT * FROM assignments ORDER BY created_at DESC"
  ).all();

  const submissionsMap: Record<number, any> = {};
  for (const assignment of assignments.results) {
    const submission = await c.env.DB.prepare(
      "SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?"
    ).bind(assignment.id, studentId).first();
    
    if (submission) {
      submissionsMap[assignment.id] = submission;
    }
  }

  return c.json(submissionsMap);
});

// App user routes
app.post("/api/app-users/register", authMiddleware, async (c) => {
  const mochaUser = c.get("user");
  const body = await c.req.json();
  const parsed = RegisterUserSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const { role, name } = parsed.data;

  const existing = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (existing) {
    return c.json({ error: "User already registered" }, 400);
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO users (mocha_user_id, email, name, role) VALUES (?, ?, ?, ?)"
  ).bind(mochaUser.id, mochaUser.email, name, role).run();

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE id = ?"
  ).bind(result.meta.last_row_id).first();

  return c.json(user, 201);
});

app.get("/api/app-users/profile", authMiddleware, async (c) => {
  const mochaUser = c.get("user");

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(user);
});

// Assignment routes
app.get("/api/assignments", authMiddleware, async (c) => {
  const mochaUser = c.get("user");

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  let query;
  if (user.role === 'teacher') {
    query = c.env.DB.prepare(
      "SELECT * FROM assignments WHERE teacher_id = ? ORDER BY created_at DESC"
    ).bind(user.id);
  } else {
    query = c.env.DB.prepare(
      "SELECT * FROM assignments ORDER BY created_at DESC"
    );
  }

  const { results } = await query.all();
  return c.json(results);
});

app.post("/api/assignments", authMiddleware, async (c) => {
  const mochaUser = c.get("user");

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user || user.role !== 'teacher') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const body = await c.req.json();
  const parsed = CreateAssignmentSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const { title, description, due_date, max_score } = parsed.data;

  const result = await c.env.DB.prepare(
    "INSERT INTO assignments (title, description, due_date, max_score, teacher_id) VALUES (?, ?, ?, ?, ?)"
  ).bind(title, description || null, due_date || null, max_score || 100, user.id).run();

  const assignment = await c.env.DB.prepare(
    "SELECT * FROM assignments WHERE id = ?"
  ).bind(result.meta.last_row_id).first();

  return c.json(assignment, 201);
});

app.patch("/api/assignments/:id", authMiddleware, async (c) => {
  const mochaUser = c.get("user");
  const assignmentId = c.req.param("id");

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user || user.role !== 'teacher') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const assignment = await c.env.DB.prepare(
    "SELECT * FROM assignments WHERE id = ? AND teacher_id = ?"
  ).bind(assignmentId, user.id).first();

  if (!assignment) {
    return c.json({ error: "Assignment not found" }, 404);
  }

  const body = await c.req.json();
  const parsed = UpdateAssignmentSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const updates = [];
  const values = [];

  if (parsed.data.title !== undefined) {
    updates.push("title = ?");
    values.push(parsed.data.title);
  }
  if (parsed.data.description !== undefined) {
    updates.push("description = ?");
    values.push(parsed.data.description);
  }
  if (parsed.data.due_date !== undefined) {
    updates.push("due_date = ?");
    values.push(parsed.data.due_date);
  }
  if (parsed.data.max_score !== undefined) {
    updates.push("max_score = ?");
    values.push(parsed.data.max_score);
  }

  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(assignmentId);

  await c.env.DB.prepare(
    `UPDATE assignments SET ${updates.join(", ")} WHERE id = ?`
  ).bind(...values).run();

  const updated = await c.env.DB.prepare(
    "SELECT * FROM assignments WHERE id = ?"
  ).bind(assignmentId).first();

  return c.json(updated);
});

app.delete("/api/assignments/:id", authMiddleware, async (c) => {
  const mochaUser = c.get("user");
  const assignmentId = c.req.param("id");

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user || user.role !== 'teacher') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const assignment = await c.env.DB.prepare(
    "SELECT * FROM assignments WHERE id = ? AND teacher_id = ?"
  ).bind(assignmentId, user.id).first();

  if (!assignment) {
    return c.json({ error: "Assignment not found" }, 404);
  }

  await c.env.DB.prepare("DELETE FROM submissions WHERE assignment_id = ?").bind(assignmentId).run();
  await c.env.DB.prepare("DELETE FROM assignments WHERE id = ?").bind(assignmentId).run();

  return c.json({ success: true });
});

// Submission routes
app.get("/api/assignments/:id/submissions", authMiddleware, async (c) => {
  const mochaUser = c.get("user");
  const assignmentId = c.req.param("id");

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  let query;
  if (user.role === 'teacher') {
    query = c.env.DB.prepare(
      `SELECT s.*, u.name as student_name, u.email as student_email 
       FROM submissions s 
       JOIN users u ON s.student_id = u.id 
       WHERE s.assignment_id = ? 
       ORDER BY s.submitted_at DESC`
    ).bind(assignmentId);
  } else {
    query = c.env.DB.prepare(
      "SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?"
    ).bind(assignmentId, user.id);
  }

  const { results } = await query.all();
  return c.json(results);
});

app.post("/api/assignments/:id/submit", authMiddleware, async (c) => {
  const mochaUser = c.get("user");
  const assignmentId = c.req.param("id");

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user || user.role !== 'student') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const body = await c.req.json();
  const parsed = SubmitAssignmentSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const existing = await c.env.DB.prepare(
    "SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?"
  ).bind(assignmentId, user.id).first();

  if (existing) {
    await c.env.DB.prepare(
      "UPDATE submissions SET content = ?, submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(parsed.data.content, existing.id).run();

    const updated = await c.env.DB.prepare(
      "SELECT * FROM submissions WHERE id = ?"
    ).bind(existing.id).first();

    return c.json(updated);
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO submissions (assignment_id, student_id, content, submitted_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)"
  ).bind(assignmentId, user.id, parsed.data.content).run();

  const submission = await c.env.DB.prepare(
    "SELECT * FROM submissions WHERE id = ?"
  ).bind(result.meta.last_row_id).first();

  return c.json(submission, 201);
});

app.patch("/api/submissions/:id/grade", authMiddleware, async (c) => {
  const mochaUser = c.get("user");
  const submissionId = c.req.param("id");

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user || user.role !== 'teacher') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const body = await c.req.json();
  const parsed = GradeSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  await c.env.DB.prepare(
    "UPDATE submissions SET score = ?, is_graded = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(parsed.data.score, submissionId).run();

  const submission = await c.env.DB.prepare(
    "SELECT * FROM submissions WHERE id = ?"
  ).bind(submissionId).first();

  return c.json(submission);
});

// Quiz routes
app.get("/api/quizzes", authMiddleware, async (c) => {
  const mochaUser = c.get("user");

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  let query;
  if (user.role === 'teacher') {
    query = c.env.DB.prepare(
      "SELECT * FROM quizzes WHERE teacher_id = ? ORDER BY created_at DESC"
    ).bind(user.id);
  } else {
    query = c.env.DB.prepare(
      "SELECT * FROM quizzes ORDER BY created_at DESC"
    );
  }

  const { results } = await query.all();
  return c.json(results);
});

app.post("/api/quizzes", authMiddleware, async (c) => {
  const mochaUser = c.get("user");

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user || user.role !== 'teacher') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const body = await c.req.json();
  const parsed = CreateQuizSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const { title, description, due_date, max_score } = parsed.data;

  const result = await c.env.DB.prepare(
    "INSERT INTO quizzes (title, description, due_date, max_score, teacher_id) VALUES (?, ?, ?, ?, ?)"
  ).bind(title, description || null, due_date || null, max_score || 100, user.id).run();

  const quiz = await c.env.DB.prepare(
    "SELECT * FROM quizzes WHERE id = ?"
  ).bind(result.meta.last_row_id).first();

  return c.json(quiz, 201);
});

app.delete("/api/quizzes/:id", authMiddleware, async (c) => {
  const mochaUser = c.get("user");
  const quizId = c.req.param("id");

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user || user.role !== 'teacher') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const quiz = await c.env.DB.prepare(
    "SELECT * FROM quizzes WHERE id = ? AND teacher_id = ?"
  ).bind(quizId, user.id).first();

  if (!quiz) {
    return c.json({ error: "Quiz not found" }, 404);
  }

  await c.env.DB.prepare("DELETE FROM quiz_submissions WHERE quiz_id = ?").bind(quizId).run();
  await c.env.DB.prepare("DELETE FROM quizzes WHERE id = ?").bind(quizId).run();

  return c.json({ success: true });
});

app.get("/api/quizzes/:id/submissions", authMiddleware, async (c) => {
  const mochaUser = c.get("user");
  const quizId = c.req.param("id");

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  let query;
  if (user.role === 'teacher') {
    query = c.env.DB.prepare(
      `SELECT s.*, u.name as student_name, u.email as student_email 
       FROM quiz_submissions s 
       JOIN users u ON s.student_id = u.id 
       WHERE s.quiz_id = ? 
       ORDER BY s.submitted_at DESC`
    ).bind(quizId);
  } else {
    query = c.env.DB.prepare(
      "SELECT * FROM quiz_submissions WHERE quiz_id = ? AND student_id = ?"
    ).bind(quizId, user.id);
  }

  const { results } = await query.all();
  return c.json(results);
});

app.post("/api/quizzes/:id/submit", authMiddleware, async (c) => {
  const mochaUser = c.get("user");
  const quizId = c.req.param("id");

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user || user.role !== 'student') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const body = await c.req.json();
  const parsed = SubmitQuizSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const existing = await c.env.DB.prepare(
    "SELECT * FROM quiz_submissions WHERE quiz_id = ? AND student_id = ?"
  ).bind(quizId, user.id).first();

  if (existing) {
    await c.env.DB.prepare(
      "UPDATE quiz_submissions SET content = ?, submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(parsed.data.content, existing.id).run();

    const updated = await c.env.DB.prepare(
      "SELECT * FROM quiz_submissions WHERE id = ?"
    ).bind(existing.id).first();

    return c.json(updated);
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO quiz_submissions (quiz_id, student_id, content, submitted_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)"
  ).bind(quizId, user.id, parsed.data.content).run();

  const submission = await c.env.DB.prepare(
    "SELECT * FROM quiz_submissions WHERE id = ?"
  ).bind(result.meta.last_row_id).first();

  return c.json(submission, 201);
});

app.patch("/api/quiz-submissions/:id/grade", authMiddleware, async (c) => {
  const mochaUser = c.get("user");
  const submissionId = c.req.param("id");

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user || user.role !== 'teacher') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const body = await c.req.json();
  const parsed = GradeSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  await c.env.DB.prepare(
    "UPDATE quiz_submissions SET score = ?, is_graded = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(parsed.data.score, submissionId).run();

  const submission = await c.env.DB.prepare(
    "SELECT * FROM quiz_submissions WHERE id = ?"
  ).bind(submissionId).first();

  return c.json(submission);
});

export default app;
