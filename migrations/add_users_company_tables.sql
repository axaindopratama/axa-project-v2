-- Migration: Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  supabase_user_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user',
  avatar TEXT,
  phone TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- Migration: Create company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id TEXT PRIMARY KEY NOT NULL,
  company_name TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_npwp TEXT,
  logo TEXT,
  created_at TEXT,
  updated_at TEXT
);
