-- Migration: Remove duplicate profile_photo from users table
-- Date: 2026-05-06
-- Reason: profile_photo exists in employees table, removing duplication

-- Drop index first
ALTER TABLE users DROP INDEX idx_profile_photo;

-- Drop the column
ALTER TABLE users DROP COLUMN profile_photo;
