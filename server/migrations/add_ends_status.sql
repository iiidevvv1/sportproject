-- Migration: Add status column to ends table
-- Date: 2026-04-14
-- Purpose: Track placeholder ends created during early finish

ALTER TABLE ends ADD COLUMN status TEXT DEFAULT 'played' CHECK (status IN ('played', 'placeholder'));

-- Ensure all existing ends are marked as 'played'
UPDATE ends SET status = 'played' WHERE status IS NULL;
