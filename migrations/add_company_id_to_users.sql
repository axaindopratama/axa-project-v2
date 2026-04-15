-- Migration: Add company_id to users table
ALTER TABLE users ADD COLUMN company_id TEXT;