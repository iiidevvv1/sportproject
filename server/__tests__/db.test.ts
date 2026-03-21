import { describe, it, expect, afterEach } from 'vitest';
import { createDb, type AppDatabase } from '../src/db.js';

describe('Database', () => {
  let db: AppDatabase;

  afterEach(() => {
    db?.close();
  });

  it('creates all tables on init', () => {
    db = createDb(':memory:');

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as Array<{ name: string }>;

    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain('games');
    expect(tableNames).toContain('ends');
    expect(tableNames).toContain('shots');
  });

  it('games table has correct columns', () => {
    db = createDb(':memory:');

    const columns = db.pragma('table_info(games)') as Array<{ name: string; type: string; notnull: number }>;
    const colNames = columns.map((c) => c.name);

    expect(colNames).toContain('id');
    expect(colNames).toContain('date');
    expect(colNames).toContain('team_home');
    expect(colNames).toContain('team_away');
    expect(colNames).toContain('color_home');
    expect(colNames).toContain('color_away');
    expect(colNames).toContain('hammer_first_end');
    expect(colNames).toContain('max_ends');
    expect(colNames).toContain('status');
  });

  it('ends table has hammer column', () => {
    db = createDb(':memory:');

    const columns = db.pragma('table_info(ends)') as Array<{ name: string }>;
    const colNames = columns.map((c) => c.name);

    expect(colNames).toContain('hammer');
  });

  it('shots table has is_throwaway column', () => {
    db = createDb(':memory:');

    const columns = db.pragma('table_info(shots)') as Array<{ name: string }>;
    const colNames = columns.map((c) => c.name);

    expect(colNames).toContain('is_throwaway');
    expect(colNames).toContain('type');
    expect(colNames).toContain('turn');
    expect(colNames).toContain('score');
  });
});
