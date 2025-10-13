-- Contact Rate Limiting Table
-- Tracks device fingerprints and submission timestamps for spam protection

CREATE TABLE IF NOT EXISTS `contact_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device_fingerprint` varchar(255) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `email_hash` varchar(64) NOT NULL,
  `submission_count` int(11) DEFAULT 1,
  `last_submission` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `blocked_until` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `device_fingerprint` (`device_fingerprint`),
  KEY `ip_address` (`ip_address`),
  KEY `email_hash` (`email_hash`),
  KEY `last_submission` (`last_submission`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add device fingerprint tracking to contact_messages table
ALTER TABLE `contact_messages` 
ADD COLUMN `device_fingerprint` varchar(255) DEFAULT NULL AFTER `updated_at`,
ADD COLUMN `ip_address` varchar(45) DEFAULT NULL AFTER `device_fingerprint`,
ADD COLUMN `user_agent` text DEFAULT NULL AFTER `ip_address`;

-- Create index for device fingerprint lookups
ALTER TABLE `contact_messages` 
ADD KEY `device_fingerprint` (`device_fingerprint`);
