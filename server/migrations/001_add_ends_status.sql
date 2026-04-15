-- Migration: Add status column to ends table
-- Date: 2026-04-15
-- Purpose: Track placeholder ends created during early finish

-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- So we use PRAGMA to check if column exists before adding
PRAGMA table_info(ends);

-- Safe way: try to add, catch error gracefully by handling in code
-- For now, just ensure it exists by re-creating the table if needed
-- This is handled in db.ts with try-catch

ALTER TABLE ends ADD COLUMN status TEXT DEFAULT 'played' CHECK (status IN ('played', 'placeholder'));
