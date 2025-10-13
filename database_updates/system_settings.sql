-- System Settings Table
-- Stores configurable system settings like reply email, etc.

CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `setting_description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert default system settings
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `setting_description`) VALUES
('reply_email', 'gerby.hallasgo@gmail.com', 'Default email address used for replying to contact messages'),
('system_name', 'VerifiED Support Team', 'Name displayed in email replies and signatures'),
('reply_signature', 'Best regards,\nVerifiED Support Team\n\nThis is an automated response from the VerifiED credential verification system.', 'Default signature for email replies')
ON DUPLICATE KEY UPDATE 
  `setting_value` = VALUES(`setting_value`),
  `setting_description` = VALUES(`setting_description`);
