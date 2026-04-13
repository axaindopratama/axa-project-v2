-- Migration: Add new columns to tasks table
-- Run this SQL in your Turso/SQLite database

-- Add priority column
ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'sedang';

-- Add due_date column
ALTER TABLE tasks ADD COLUMN due_date TEXT;

-- Add assignee column
ALTER TABLE tasks ADD COLUMN assignee TEXT;

-- Verify the columns were added
SELECT * FROM tasks LIMIT 1;
PRAGMA table_info(tasks);