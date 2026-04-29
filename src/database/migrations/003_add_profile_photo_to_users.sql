-- Migration: Add profile_photo column to users table
-- Date: 2026-04-28

USE hrm_db;

-- Add profile_photo column after account_status
ALTER TABLE users 
ADD COLUMN profile_photo VARCHAR(255) NULL AFTER account_status;

-- Add index for profile_photo
ALTER TABLE users 
ADD INDEX idx_profile_photo (profile_photo);
