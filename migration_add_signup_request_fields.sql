-- Migration Script: Add signup request support to contact_messages table
-- Date: 2025-01-26
-- Description: Adds message_type and account_id fields to support signup requests in Messages tab

-- Add message_type column to contact_messages table
ALTER TABLE `contact_messages` 
ADD COLUMN `message_type` ENUM('contact','signup_request') 
COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'contact' 
AFTER `status`;

-- Add account_id column to link signup requests to accounts
ALTER TABLE `contact_messages` 
ADD COLUMN `account_id` INT DEFAULT NULL 
AFTER `message_type`;

-- Update all existing messages to 'contact' type (they were already contact messages)
UPDATE `contact_messages` SET `message_type` = 'contact' WHERE `message_type` IS NULL;

-- Verify the migration
SELECT 
    id, 
    name, 
    email, 
    user_type, 
    status,
    message_type,
    account_id,
    created_at 
FROM `contact_messages` 
ORDER BY created_at DESC;

-- Expected result: All existing messages should have message_type = 'contact' and account_id = NULL
