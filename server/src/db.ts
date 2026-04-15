import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export type AppDatabase = Database.Database;

function runMigrations(db: Database.Database): void {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    return;
  }

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    try {
      db.exec(sql);
    } catch (error) {
      // Migration already applied (table/column exists) - ignore
      console.log(`Migration ${file} skipped (likely already applied)`);
    }
  }
}

export function createDb(path: string): AppDatabase {
  const db = new Database(path);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL DEFAULT (date('now')),
      team_home TEXT NOT NULL,
      team_away TEXT NOT NULL,
      color_home TEXT NOT NULL DEFAULT 'red',
      color_away TEXT NOT NULL DEFAULT 'yellow',
      hammer_first_end TEXT NOT NULL DEFAULT 'home' CHECK(hammer_first_end IN ('home', 'away')),
      max_ends INTEGER NOT NULL DEFAULT 10 CHECK(max_ends IN (8, 10)),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'finished')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      number INTEGER NOT NULL CHECK(number >= 1),
      score_home INTEGER NOT NULL DEFAULT 0,
      score_away INTEGER NOT NULL DEFAULT 0,
      hammer TEXT NOT NULL CHECK(hammer IN ('home', 'away')),
      status TEXT NOT NULL DEFAULT 'played' CHECK(status IN ('played', 'placeholder')),
      UNIQUE(game_id, number)
    );

    CREATE TABLE IF NOT EXISTS shots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      end_number INTEGER NOT NULL CHECK(end_number >= 1),
      shot_number INTEGER NOT NULL CHECK(shot_number >= 1 AND shot_number <= 16),
      team TEXT NOT NULL CHECK(team IN ('home', 'away')),
      player_number INTEGER NOT NULL CHECK(player_number >= 1 AND player_number <= 4),
      type TEXT CHECK(type IN ('draw', 'takeout') OR type IS NULL),
      turn TEXT CHECK(turn IN ('inturn', 'outturn') OR turn IS NULL),
      score INTEGER CHECK(score IN (0, 25, 50, 75, 100) OR score IS NULL),
      is_throwaway INTEGER NOT NULL DEFAULT 0 CHECK(is_throwaway IN (0, 1)),
      UNIQUE(game_id, end_number, shot_number)
    );

    CREATE INDEX IF NOT EXISTS idx_shots_game ON shots(game_id);
    CREATE INDEX IF NOT EXISTS idx_ends_game ON ends(game_id);
  `);

  // Run migrations to handle schema updates
  runMigrations(db);

  return db;
}
