-- Migration Script: Add status column to account table
-- Date: 2025-10-26
-- Description: Adds account status tracking for approval workflow

-- Add status column to account table
ALTER TABLE `account` 
ADD COLUMN `status` ENUM('pending','approved','rejected') 
COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'approved' 
AFTER `email`;

-- Update all existing accounts to 'approved' status (they were already active)
UPDATE `account` SET `status` = 'approved' WHERE `status` IS NULL;

-- Verify the migration
SELECT 
    id, 
    account_type, 
    username, 
    email, 
    status, 
    created_at 
FROM `account` 
ORDER BY created_at DESC;

-- Expected result: All existing accounts should have status = 'approved'
