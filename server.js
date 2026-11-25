const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");
const path = require("node:path");
const fs = require("node:fs");
const courses = require("./data/courses");
const stokCourses = require("./data/stok-curriculum");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (process.env.NODE_ENV === "production" && (!JWT_SECRET || JWT_SECRET.length < 32)) {
  throw new Error("Defina JWT_SECRET com pelo menos 32 caracteres no ambiente de produção.");
}
const secret = JWT_SECRET || "desenvolvimento-local-nao-usar-em-producao";
const dbPath = process.env.DB_PATH || path.join(__dirname, "data", "stk-academy.sqlite");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student',
 xp INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS lesson_progress (
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 lesson_id TEXT NOT NULL, completed INTEGER NOT NULL DEFAULT 0, best_score INTEGER NOT NULL DEFAULT 0,
 attempts INTEGER NOT NULL DEFAULT 0, completed_at TEXT, UNIQUE(user_id, lesson_id)
);
CREATE TABLE IF NOT EXISTS attempts (
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 lesson_id TEXT NOT NULL, answer TEXT NOT NULL, correct INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS classrooms (
 id INTEGER PRIMARY KEY AUTOINCREMENT, teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 name TEXT NOT NULL, join_code TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS classroom_members (
 classroom_id INTEGER NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(classroom_id,user_id)
);
`);

const allLessons = courses.flatMap(c => c.lessons);
const lessonMap = new Map(allLessons.map(l => [l.id, l]));
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-7", legacyHeaders: false });
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", "data:"], connectSrc: ["'self'"] } } }));
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

function tokenFor(user) { return jwt.sign({ id: user.id }, secret, { expiresIn: "7d" }); }
function auth(req, res, next) {
  const raw = req.headers.authorization || "";
  try {
    const token = raw.startsWith("Bearer ") ? raw.slice(7) : "";
    const payload = jwt.verify(token, secret);
    const user = db.prepare("SELECT id,name,email,role,xp,created_at FROM users WHERE id=?").get(payload.id);
    if (!user) return res.status(401).json({ error: "Sessão inválida." });
    req.user = user; next();
  } catch { return res.status(401).json({ error: "Faça login para continuar." }); }
}
function teacherOnly(req, res, next) {
  if (req.user.role !== "teacher") return res.status(403).json({ error: "Acesso exclusivo do professor." });
  next();
}
function publicUser(user) { const { password_hash, ...safe } = user; return safe; }
function normalize(value) { return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " "); }
function safeLesson(lesson) {
  const { answer, solution, ...safe } = lesson;
  return safe;
}
app.get("/api/health", (_req, res) => res.json({ ok: true, app: "STK Academy" }));

app.post("/api/auth/register", authLimiter, async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (name.length < 2 || name.length > 80) return res.status(400).json({ error: "Informe um nome entre 2 e 80 caracteres." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) return res.status(400).json({ error: "Informe um e-mail válido." });
  if (password.length < 8 || password.length > 72) return res.status(400).json({ error: "A senha deve ter entre 8 e 72 caracteres." });
  try {
    const hash = await bcrypt.hash(password, 12);
    const info = db.prepare("INSERT INTO users(name,email,password_hash) VALUES(?,?,?)").run(name, email, hash);
    const user = db.prepare("SELECT id,name,email,role,xp,created_at FROM users WHERE id=?").get(info.lastInsertRowid);
    res.status(201).json({ token: tokenFor(user), user });
  } catch (e) {
    if (String(e.code).includes("SQLITE_CONSTRAINT")) return res.status(409).json({ error: "Este e-mail já está cadastrado." });
    res.status(500).json({ error: "Não foi possível criar a conta." });
  }
});
app.post("/api/auth/login", authLimiter, async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const user = db.prepare("SELECT * FROM users WHERE email=?").get(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: "E-mail ou senha incorretos." });
  const safe = publicUser(user);
  res.json({ token: tokenFor(user), user: safe });
});
app.get("/api/me", auth, (req, res) => res.json({ user: req.user }));

app.get("/api/courses", (_req, res) => res.json([...courses, ...stokCourses].map(c => ({ ...c, lessons: c.lessons.map(safeLesson) }))));
app.get("/api/progress", auth, (req, res) => {
  const rows = db.prepare("SELECT lesson_id,completed,best_score,attempts,completed_at FROM lesson_progress WHERE user_id=?").all(req.user.id);
  const completed = rows.filter(r => r.completed).length;
  res.json({ completed, total: allLessons.length, xp: req.user.xp, lessons: rows });
});
app.post("/api/lessons/:id/submit", auth, (req, res) => {
  const lesson = lessonMap.get(req.params.id);
  if (!lesson) return res.status(404).json({ error: "Desafio não encontrado." });
  const answer = String(req.body.answer ?? "").slice(0, 1000);
  const correct = normalize(answer) === normalize(lesson.answer);
  const previous = db.prepare("SELECT * FROM lesson_progress WHERE user_id=? AND lesson_id=?").get(req.user.id, lesson.id);
  const firstCompletion = correct && !previous?.completed;
  const score = correct ? 100 : 0;
  const tx = db.transaction(() => {
    db.prepare("INSERT INTO attempts(user_id,lesson_id,answer,correct) VALUES(?,?,?,?)").run(req.user.id, lesson.id, answer, correct ? 1 : 0);
    db.prepare(`INSERT INTO lesson_progress(user_id,lesson_id,completed,best_score,attempts,completed_at)
      VALUES(?,?,?,?,1,CASE WHEN ?=1 THEN CURRENT_TIMESTAMP ELSE NULL END)
      ON CONFLICT(user_id,lesson_id) DO UPDATE SET
      completed=MAX(completed,excluded.completed), best_score=MAX(best_score,excluded.best_score),
      attempts=attempts+1, completed_at=CASE WHEN lesson_progress.completed_at IS NULL AND excluded.completed=1 THEN CURRENT_TIMESTAMP ELSE lesson_progress.completed_at END`)
      .run(req.user.id, lesson.id, correct ? 1 : 0, score, correct ? 1 : 0);
    if (firstCompletion) db.prepare("UPDATE users SET xp=xp+? WHERE id=?").run(lesson.xp, req.user.id);
  });
  tx();
  const updated = db.prepare("SELECT id,name,email,role,xp,created_at FROM users WHERE id=?").get(req.user.id);
  const progress = db.prepare("SELECT COUNT(*) AS n FROM lesson_progress WHERE user_id=? AND completed=1").get(req.user.id).n;
  res.json({ correct, firstCompletion, xpEarned: firstCompletion ? lesson.xp : 0, user: updated, completed: progress, total: allLessons.length, feedback: correct ? lesson.solution : lesson.hint, solution: correct ? lesson.solution : undefined });
});

app.get("/api/leaderboard", (_req, res) => {
  const rows = db.prepare(`SELECT u.name,u.xp,COUNT(p.lesson_id) AS completed
    FROM users u LEFT JOIN lesson_progress p ON p.user_id=u.id AND p.completed=1
    WHERE u.role='student' GROUP BY u.id ORDER BY u.xp DESC,u.name ASC LIMIT 20`).all();
  res.json(rows);
});
app.get("/api/certificate", auth, (req, res) => {
  const completed = db.prepare("SELECT COUNT(*) AS n FROM lesson_progress WHERE user_id=? AND completed=1").get(req.user.id).n;
  if (completed < allLessons.length) return res.status(403).json({ error: "Conclua todos os desafios para liberar o certificado.", completed, total: allLessons.length });
  res.json({ eligible: true, name: req.user.name, course: "Trilha Fundamentos ao Back-end", completedAt: new Date().toISOString(), code: "STK-" + req.user.id + "-" + completed });
});

app.post("/api/classrooms", auth, teacherOnly, (req, res) => {
  const name = String(req.body.name || "").trim().slice(0, 80);
  if (name.length < 2) return res.status(400).json({ error: "Informe o nome da turma." });
  let code;
  do { code = Math.random().toString(36).slice(2, 8).toUpperCase(); }
  while (db.prepare("SELECT id FROM classrooms WHERE join_code=?").get(code));
  const info = db.prepare("INSERT INTO classrooms(teacher_id,name,join_code) VALUES(?,?,?)").run(req.user.id, name, code);
  res.status(201).json({ id: info.lastInsertRowid, name, joinCode: code });
});
app.post("/api/classrooms/join", auth, (req, res) => {
  if (req.user.role !== "student") return res.status(403).json({ error: "Somente contas de aluno podem entrar em turmas." });
  const code = String(req.body.code || "").trim().toUpperCase();
  const classroom = db.prepare("SELECT id,name FROM classrooms WHERE join_code=?").get(code);
  if (!classroom) return res.status(404).json({ error: "Código de turma não encontrado." });
  db.prepare("INSERT OR IGNORE INTO classroom_members(classroom_id,user_id) VALUES(?,?)").run(classroom.id, req.user.id);
  res.json({ joined: true, classroom });
});
app.get("/api/teacher/dashboard", auth, teacherOnly, (req, res) => {
  const classrooms = db.prepare("SELECT c.id,c.name,c.join_code AS joinCode,COUNT(m.user_id) AS students FROM classrooms c LEFT JOIN classroom_members m ON m.classroom_id=c.id WHERE c.teacher_id=? GROUP BY c.id ORDER BY c.id DESC").all(req.user.id);
  const students = db.prepare(`SELECT u.id,u.name,u.email,u.xp,COUNT(p.lesson_id) AS completed
    FROM classroom_members m JOIN classrooms c ON c.id=m.classroom_id JOIN users u ON u.id=m.user_id
    LEFT JOIN lesson_progress p ON p.user_id=u.id AND p.completed=1
    WHERE c.teacher_id=? GROUP BY u.id ORDER BY u.name`).all(req.user.id);
  res.json({ classrooms, students, totals: { classrooms: classrooms.length, students: students.length } });
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.use("/api", (_req, res) => res.status(404).json({ error: "Rota não encontrada." }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno. Tente novamente." });
});

app.listen(PORT, () => console.log(`STK Academy disponível na porta ${PORT}`));
