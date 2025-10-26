-- Migration: Create activity_log table for tracking institution settings actions
-- This table logs all CRUD operations performed in the institution settings page

CREATE TABLE IF NOT EXISTS `activity_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT 'References account.id - can be institution admin or staff',
  `institution_id` INT NOT NULL COMMENT 'The institution this activity belongs to',
  `action` ENUM(
    'credential_issued',
    'credential_deleted',
    'credential_viewed',
    'student_added',
    'student_deleted',
    'student_imported',
    'profile_updated',
    'address_updated',
    'staff_added',
    'staff_deleted',
    'program_added',
    'program_deleted',
    'login',
    'logout',
    'settings_viewed',
    'other'
  ) NOT NULL DEFAULT 'other',
  `description` TEXT COMMENT 'Detailed description of the action',
  `target_id` INT DEFAULT NULL COMMENT 'ID of the affected entity (optional)',
  `target_type` VARCHAR(50) DEFAULT NULL COMMENT 'Type of the affected entity (staff, program, etc.)',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'IP address of the user who performed the action',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_institution_id` (`institution_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `account`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`institution_id`) REFERENCES `institution`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comments to the table and columns for documentation
ALTER TABLE `activity_log` 
  COMMENT = 'Tracks all actions performed in institution settings';

-- Sample query to view recent activity logs
-- SELECT al.*, a.username 
-- FROM activity_log al 
-- JOIN account a ON al.user_id = a.id 
-- WHERE al.institution_id = ? 
-- ORDER BY al.created_at DESC 
-- LIMIT 100;
