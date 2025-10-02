import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

export type UserRole = 'manager' | 'member';

let dbInstance: Database.Database | null = null;

function getDbFilePath(): string {
  const filePath = path.join(process.cwd(), 'data.sqlite');
  return filePath;
}

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  const dbPath = getDbFilePath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('manager','member')),
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manager_id INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS team_members (
      team_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL UNIQUE,
      PRIMARY KEY (team_id, user_id),
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS overtime_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      entry_date TEXT NOT NULL, -- YYYY-MM-DD
      hours REAL NOT NULL,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_overtime_user_date ON overtime_entries(user_id, entry_date);
  `);

  // Seed a default manager if none exists
  const managerCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get('manager') as { c: number };
  if (managerCount.c === 0) {
    const email = 'manager@example.com';
    const name = 'Default Manager';
    const passwordHash = bcrypt.hashSync('password123', 10);
    const insertUser = db.prepare(`INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, 'manager')`);
    const info = insertUser.run(email, name, passwordHash);
    const managerId = Number(info.lastInsertRowid);
    const insertTeam = db.prepare(`INSERT INTO teams (manager_id, name) VALUES (?, ?)`);
    insertTeam.run(managerId, 'My Team');
  }

  dbInstance = db;
  return dbInstance;
}

export type DbUser = {
  id: number;
  email: string;
  name: string;
  role: UserRole;
};

export function findUserByEmail(email: string): (DbUser & { password_hash: string }) | null {
  const db = getDb();
  const row = db.prepare('SELECT id, email, name, role, password_hash FROM users WHERE email = ?').get(email) as any;
  return row || null;
}

export function getUserById(id: number): DbUser | null {
  const db = getDb();
  const row = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(id) as any;
  return row || null;
}

export function getOrCreateManagersTeam(managerId: number): { id: number; name: string } {
  const db = getDb();
  const existing = db.prepare('SELECT id, name FROM teams WHERE manager_id = ?').get(managerId) as any;
  if (existing) return existing;
  const info = db.prepare('INSERT INTO teams (manager_id, name) VALUES (?, ?)').run(managerId, 'My Team');
  return { id: Number(info.lastInsertRowid), name: 'My Team' };
}



