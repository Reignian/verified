-- Migration: Add plain_password column to account table
-- This column temporarily stores the plain password for email notifications
-- It will be cleared after the first credential is issued for security

ALTER TABLE account 
ADD COLUMN plain_password VARCHAR(255) NULL 
COMMENT 'Temporary plain password storage for email notifications, cleared after first credential';

-- Add index for faster lookups
CREATE INDEX idx_plain_password ON account(plain_password);
