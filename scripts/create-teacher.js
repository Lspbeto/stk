const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("node:path");
const fs = require("node:fs");

const [name, email, password] = process.argv.slice(2);
if (!name || !email || !password || password.length < 10) {
  console.error('Uso: npm run create-teacher -- "Nome" email senha-com-10-caracteres');
  process.exit(1);
}
const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "stk-academy.sqlite");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student', xp INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
`);
const hash = bcrypt.hashSync(password, 12);
try {
  db.prepare("INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,'teacher')").run(name.trim(), email.toLowerCase().trim(), hash);
  console.log("Professor criado com sucesso.");
} catch (error) {
  console.error("Não foi possível criar. O e-mail pode já estar cadastrado.", error.message);
  process.exitCode = 1;
}
db.close();
