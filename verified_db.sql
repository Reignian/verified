-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 25, 2025 at 04:35 PM
-- Server version: 8.0.43
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `verified_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `account`
--

CREATE TABLE `account` (
  `id` int NOT NULL,
  `account_type` enum('student','institution','admin','institution_staff') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `password` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `account`
--

INSERT INTO `account` (`id`, `account_type`, `username`, `password`, `email`, `created_at`) VALUES
(1, 'institution', 'wmsu', '$2b$10$5QBpi7tFxS.ca.dvyQZDLuG.VbTFwTtOphtIi8R53ycXwhT3E3.4i', 'wmsu@gmail.com', '2025-09-06 17:20:14'),
(999, 'admin', 'admin', '$2b$10$n5S1mPhT7v/vIACT4Fv1lOZBIVsbujU2tsrEUxHEje3qZA4cldJ0C', 'admin@verified.com', '2025-10-17 23:34:01'),
(1025, 'student', 'reign', '$2b$10$yNrpxD4EpgQ8TJ2Cw/fuse0WsgDGdoQ4qaRULjW8LyBiaGX6UTtiC', 'reign@wmsu.edu.ph', '2025-10-17 23:48:58'),
(1026, 'student', 'gerby', '$2b$10$sb33aZeB1F3.lDCyLquzw.4lmIK1puBW1u3DdoHkq1QSMM39eaH.u', 'gerby@wmsu.edu.ph', '2025-10-19 06:58:40'),
(1027, 'student', 'huifon', '$2b$10$nKWmUnFje4OlSPJELbeVn.y3.jaFwHYJzXzwDHcpqb7.hLQNWuqUO', 'huifon@wmsu.edu.ph', '2025-10-19 07:04:18'),
(1028, 'institution_staff', 'jamal', '$2b$10$GbZpJM1BcH6ZYcH6L.JmLu9Wem2dg5Ayg4qo2KWt2BcnxyikREFhu', 'jamal@gmail.com', '2025-10-22 07:25:11');

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `user_type` enum('institution','employer','student','other') COLLATE utf8mb4_general_ci NOT NULL,
  `message` text COLLATE utf8mb4_general_ci NOT NULL,
  `status` enum('unread','read','replied') COLLATE utf8mb4_general_ci DEFAULT 'unread',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `device_fingerprint` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `name`, `email`, `user_type`, `message`, `status`, `created_at`, `updated_at`, `device_fingerprint`, `ip_address`, `user_agent`) VALUES
(5, 'Hallasgo Gerby P.', 'hallasgogerby@gmail.com', 'institution', 'haha', 'replied', '2025-09-28 17:14:40', '2025-10-12 15:34:25', NULL, NULL, NULL),
(6, 'ciao', 'eh202201076@wmsu.edu.ph', 'other', 'hi', 'replied', '2025-10-08 12:51:25', '2025-10-12 15:40:52', NULL, NULL, NULL),
(7, 'Hallasgo Gerby P.', 'jcpowerzone@gmail.com', 'institution', 'halo', 'replied', '2025-10-12 15:24:50', '2025-10-12 15:33:58', '5i34gr', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36');

-- --------------------------------------------------------

--
-- Table structure for table `contact_submissions`
--

CREATE TABLE `contact_submissions` (
  `id` int NOT NULL,
  `device_fingerprint` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_general_ci NOT NULL,
  `email_hash` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `submission_count` int DEFAULT '1',
  `last_submission` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `blocked_until` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contact_submissions`
--

INSERT INTO `contact_submissions` (`id`, `device_fingerprint`, `ip_address`, `email_hash`, `submission_count`, `last_submission`, `created_at`, `blocked_until`) VALUES
(1, '5i34gr', '::1', '8f318be0ba18a1d36cb81319226408b4cfeedb0cb8ba09cdeb0ae5b2c9c627ad', 1, '2025-10-12 15:24:50', '2025-10-12 15:24:50', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `credential`
--

CREATE TABLE `credential` (
  `id` int NOT NULL,
  `credential_type_id` int DEFAULT NULL,
  `custom_type` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `owner_id` int NOT NULL,
  `sender_id` int NOT NULL,
  `program_id` int DEFAULT NULL,
  `ipfs_cid` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `blockchain_id` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `credential`
--

INSERT INTO `credential` (`id`, `credential_type_id`, `custom_type`, `owner_id`, `sender_id`, `program_id`, `ipfs_cid`, `status`, `blockchain_id`, `created_at`, `updated_at`) VALUES
(51, 1, NULL, 1025, 1, 2, 'QmS9HSkhB2RcYuc7s1rgcxAsQ5KhbXq84JMjrgV9zQrpRx', 'blockchain_verified', '12', '2025-10-19 06:56:34', '2025-10-19 06:56:34'),
(52, 2, NULL, 1025, 1, 2, 'QmS9HSkhB2RcYuc7s1rgcxAsQ5KhbXq84JMjrgV9zQrpRx', 'blockchain_verified', '13', '2025-10-19 07:19:10', '2025-10-19 07:19:10'),
(53, NULL, 'test credential', 1027, 1, 3, 'QmS9HSkhB2RcYuc7s1rgcxAsQ5KhbXq84JMjrgV9zQrpRx', 'blockchain_verified', '14', '2025-10-19 07:20:18', '2025-10-19 07:20:18'),
(54, NULL, 'test credential', 1026, 1, 2, 'QmS9HSkhB2RcYuc7s1rgcxAsQ5KhbXq84JMjrgV9zQrpRx', 'blockchain_verified', '15', '2025-10-19 14:54:08', '2025-10-19 14:54:08'),
(55, NULL, 'test credential', 1025, 1, 2, 'QmS9HSkhB2RcYuc7s1rgcxAsQ5KhbXq84JMjrgV9zQrpRx', 'blockchain_verified', '16', '2025-10-19 16:11:00', '2025-10-19 16:11:00'),
(56, 3, NULL, 1027, 1, 3, 'QmS9HSkhB2RcYuc7s1rgcxAsQ5KhbXq84JMjrgV9zQrpRx', 'blockchain_verified', '17', '2025-10-19 16:11:34', '2025-10-19 16:11:34'),
(57, NULL, 'test 2', 1025, 1, 2, 'QmS9HSkhB2RcYuc7s1rgcxAsQ5KhbXq84JMjrgV9zQrpRx', 'blockchain_verified', '18', '2025-10-22 07:21:10', '2025-10-22 07:21:10'),
(58, NULL, 'test 3', 1025, 1, 2, 'QmS9HSkhB2RcYuc7s1rgcxAsQ5KhbXq84JMjrgV9zQrpRx', 'blockchain_verified', '19', '2025-10-22 07:21:51', '2025-10-22 07:21:51');

-- --------------------------------------------------------

--
-- Table structure for table `credential_access`
--

CREATE TABLE `credential_access` (
  `id` int NOT NULL,
  `credential_id` int NOT NULL,
  `access_code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `credential_access`
--

INSERT INTO `credential_access` (`id`, `credential_id`, `access_code`, `is_active`, `created_at`, `is_deleted`) VALUES
(13, 58, '9UC7JC', 1, '2025-10-25 14:24:01', 0);

-- --------------------------------------------------------

--
-- Table structure for table `credential_types`
--

CREATE TABLE `credential_types` (
  `id` int NOT NULL,
  `type_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `credential_types`
--

INSERT INTO `credential_types` (`id`, `type_name`) VALUES
(1, 'Diploma'),
(2, 'Transcript of Records (TOR)'),
(3, 'Certificate of Graduation');

-- --------------------------------------------------------

--
-- Table structure for table `credential_verifications`
--

CREATE TABLE `credential_verifications` (
  `id` int NOT NULL,
  `credential_id` int NOT NULL,
  `access_code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `verifier_ip` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `verifier_user_agent` text COLLATE utf8mb4_general_ci,
  `verification_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('success','failed') COLLATE utf8mb4_general_ci DEFAULT 'success'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `credential_verifications`
--

INSERT INTO `credential_verifications` (`id`, `credential_id`, `access_code`, `verifier_ip`, `verifier_user_agent`, `verification_timestamp`, `status`) VALUES
(60, 58, '9UC7JC', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-25 14:24:08', 'success'),
(61, 58, '9UC7JC', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-25 14:24:45', 'success');

-- --------------------------------------------------------

--
-- Table structure for table `institution`
--

CREATE TABLE `institution` (
  `id` int NOT NULL,
  `institution_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `public_address` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `institution`
--

INSERT INTO `institution` (`id`, `institution_name`, `public_address`) VALUES
(1, 'Western Mindanao State University', '0xbda9c415c28e06bffe626313c2aa429dce2c6016');

-- --------------------------------------------------------

--
-- Table structure for table `institution_addresses`
--

CREATE TABLE `institution_addresses` (
  `id` int NOT NULL,
  `institution_id` int NOT NULL,
  `public_address` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `institution_addresses`
--
DELIMITER $$
CREATE TRIGGER `check_max_addresses_before_insert` BEFORE INSERT ON `institution_addresses` FOR EACH ROW BEGIN
    DECLARE address_count INT;
    
    SELECT COUNT(*) INTO address_count 
    FROM `institution_addresses` 
    WHERE `institution_id` = NEW.`institution_id` AND `is_active` = 1;
    
    IF address_count >= 2 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Institution cannot have more than 2 active addresses';
    END IF;
    
    -- Ensure only one primary address per institution
    IF NEW.`is_primary` = 1 THEN
        UPDATE `institution_addresses` 
        SET `is_primary` = 0 
        WHERE `institution_id` = NEW.`institution_id` AND `id` != NEW.`id`;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `check_max_addresses_before_update` BEFORE UPDATE ON `institution_addresses` FOR EACH ROW BEGIN
    -- Ensure only one primary address per institution
    IF NEW.`is_primary` = 1 AND OLD.`is_primary` != 1 THEN
        UPDATE `institution_addresses` 
        SET `is_primary` = 0 
        WHERE `institution_id` = NEW.`institution_id` AND `id` != NEW.`id`;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `institution_staff`
--

CREATE TABLE `institution_staff` (
  `id` int NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `institution_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `institution_staff`
--

INSERT INTO `institution_staff` (`id`, `first_name`, `middle_name`, `last_name`, `institution_id`) VALUES
(1028, 'Jamal', 'Alumbre', 'Al badi', 1);

-- --------------------------------------------------------

--
-- Table structure for table `linked_accounts`
--

CREATE TABLE `linked_accounts` (
  `group_id` int NOT NULL,
  `student_id` int NOT NULL,
  `date_linked` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `multi_access_code`
--

CREATE TABLE `multi_access_code` (
  `id` int NOT NULL,
  `access_code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `student_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `multi_access_code_credentials`
--

CREATE TABLE `multi_access_code_credentials` (
  `id` int NOT NULL,
  `multi_access_code_id` int NOT NULL,
  `credential_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `program`
--

CREATE TABLE `program` (
  `id` int NOT NULL,
  `institution_id` int NOT NULL,
  `program_name` varchar(150) NOT NULL,
  `program_code` varchar(25) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `program`
--

INSERT INTO `program` (`id`, `institution_id`, `program_name`, `program_code`, `created_at`) VALUES
(2, 1, 'Bachelor of Science in Computer Science', 'BSCS', '2025-10-17 18:42:29'),
(3, 1, 'Bachelor of Science in Information Technology', 'BSIT', '2025-10-17 18:42:51');

-- --------------------------------------------------------

--
-- Table structure for table `student`
--

CREATE TABLE `student` (
  `id` int NOT NULL,
  `program_id` int DEFAULT NULL,
  `student_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `first_name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `middle_name` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `institution_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student`
--

INSERT INTO `student` (`id`, `program_id`, `student_id`, `first_name`, `middle_name`, `last_name`, `institution_id`) VALUES
(1025, 2, '2022-01084', 'Reign Ian', 'Carreon', 'Magno', 1),
(1026, 2, '2022-01085', 'Gerby', '', 'Hallasgo', 1),
(1027, 3, '2022-01086', 'Hui Fon', '', 'Tulawe', 1);

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int NOT NULL,
  `setting_key` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_general_ci NOT NULL,
  `setting_description` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `setting_description`, `created_at`, `updated_at`) VALUES
(1, 'reply_email', 'gerby.hallasgo@gmail.com', 'Default email address used for replying to contact messages', '2025-10-12 15:33:41', '2025-10-12 15:33:41'),
(2, 'system_name', 'VerifiED Support Team', 'Name displayed in email replies and signatures', '2025-10-12 15:33:41', '2025-10-12 15:33:41'),
(3, 'reply_signature', 'Best regards,\nVerifiED Support Team\n\nThis is an automated response from the VerifiED credential verification system.', 'Default signature for email replies', '2025-10-12 15:33:41', '2025-10-12 15:33:41');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `account`
--
ALTER TABLE `account`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `device_fingerprint` (`device_fingerprint`);

--
-- Indexes for table `contact_submissions`
--
ALTER TABLE `contact_submissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `device_fingerprint` (`device_fingerprint`),
  ADD KEY `ip_address` (`ip_address`),
  ADD KEY `email_hash` (`email_hash`),
  ADD KEY `last_submission` (`last_submission`);

--
-- Indexes for table `credential`
--
ALTER TABLE `credential`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `blockchain_id` (`blockchain_id`),
  ADD KEY `credential_type_id` (`credential_type_id`),
  ADD KEY `owner_id` (`owner_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `program_id` (`program_id`);

--
-- Indexes for table `credential_access`
--
ALTER TABLE `credential_access`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `access_code` (`access_code`),
  ADD KEY `credential_id` (`credential_id`);

--
-- Indexes for table `credential_types`
--
ALTER TABLE `credential_types`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `credential_verifications`
--
ALTER TABLE `credential_verifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_credential_verifications_credential` (`credential_id`),
  ADD KEY `fk_credential_verifications_access_code` (`access_code`);

--
-- Indexes for table `institution`
--
ALTER TABLE `institution`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `institution_addresses`
--
ALTER TABLE `institution_addresses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_institution_address` (`institution_id`,`public_address`),
  ADD KEY `idx_institution_id` (`institution_id`),
  ADD KEY `idx_institution_addresses_active` (`institution_id`),
  ADD KEY `idx_institution_addresses_primary` (`institution_id`);

--
-- Indexes for table `institution_staff`
--
ALTER TABLE `institution_staff`
  ADD PRIMARY KEY (`id`),
  ADD KEY `institution_id` (`institution_id`);

--
-- Indexes for table `linked_accounts`
--
ALTER TABLE `linked_accounts`
  ADD PRIMARY KEY (`group_id`,`student_id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `multi_access_code`
--
ALTER TABLE `multi_access_code`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `access_code` (`access_code`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `multi_access_code_credentials`
--
ALTER TABLE `multi_access_code_credentials`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `multi_access_code_id` (`multi_access_code_id`,`credential_id`),
  ADD KEY `credential_id` (`credential_id`);

--
-- Indexes for table `program`
--
ALTER TABLE `program`
  ADD PRIMARY KEY (`id`),
  ADD KEY `institution_id` (`institution_id`);

--
-- Indexes for table `student`
--
ALTER TABLE `student`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_institution_id` (`institution_id`),
  ADD KEY `program_id` (`program_id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `account`
--
ALTER TABLE `account`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1029;

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `contact_submissions`
--
ALTER TABLE `contact_submissions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `credential`
--
ALTER TABLE `credential`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;

--
-- AUTO_INCREMENT for table `credential_access`
--
ALTER TABLE `credential_access`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `credential_types`
--
ALTER TABLE `credential_types`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `credential_verifications`
--
ALTER TABLE `credential_verifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT for table `institution`
--
ALTER TABLE `institution`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1025;

--
-- AUTO_INCREMENT for table `institution_addresses`
--
ALTER TABLE `institution_addresses`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `institution_staff`
--
ALTER TABLE `institution_staff`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1029;

--
-- AUTO_INCREMENT for table `multi_access_code`
--
ALTER TABLE `multi_access_code`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `multi_access_code_credentials`
--
ALTER TABLE `multi_access_code_credentials`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `program`
--
ALTER TABLE `program`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `student`
--
ALTER TABLE `student`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1028;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `credential`
--
ALTER TABLE `credential`
  ADD CONSTRAINT `credential_ibfk_1` FOREIGN KEY (`credential_type_id`) REFERENCES `credential_types` (`id`),
  ADD CONSTRAINT `credential_ibfk_2` FOREIGN KEY (`owner_id`) REFERENCES `account` (`id`),
  ADD CONSTRAINT `credential_ibfk_3` FOREIGN KEY (`sender_id`) REFERENCES `account` (`id`),
  ADD CONSTRAINT `credential_ibfk_4` FOREIGN KEY (`program_id`) REFERENCES `program` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `credential_access`
--
ALTER TABLE `credential_access`
  ADD CONSTRAINT `credential_access_ibfk_1` FOREIGN KEY (`credential_id`) REFERENCES `credential` (`id`);

--
-- Constraints for table `credential_verifications`
--
ALTER TABLE `credential_verifications`
  ADD CONSTRAINT `fk_credential_verifications_access_code` FOREIGN KEY (`access_code`) REFERENCES `credential_access` (`access_code`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_credential_verifications_credential` FOREIGN KEY (`credential_id`) REFERENCES `credential` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `institution`
--
ALTER TABLE `institution`
  ADD CONSTRAINT `institution_ibfk_1` FOREIGN KEY (`id`) REFERENCES `account` (`id`);

--
-- Constraints for table `institution_addresses`
--
ALTER TABLE `institution_addresses`
  ADD CONSTRAINT `fk_institution_addresses_institution` FOREIGN KEY (`institution_id`) REFERENCES `institution` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `institution_staff`
--
ALTER TABLE `institution_staff`
  ADD CONSTRAINT `institution_staff_ibfk_1` FOREIGN KEY (`institution_id`) REFERENCES `institution` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `linked_accounts`
--
ALTER TABLE `linked_accounts`
  ADD CONSTRAINT `linked_accounts_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `account` (`id`);

--
-- Constraints for table `multi_access_code`
--
ALTER TABLE `multi_access_code`
  ADD CONSTRAINT `multi_access_code_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `account` (`id`);

--
-- Constraints for table `multi_access_code_credentials`
--
ALTER TABLE `multi_access_code_credentials`
  ADD CONSTRAINT `multi_access_code_credentials_ibfk_1` FOREIGN KEY (`multi_access_code_id`) REFERENCES `multi_access_code` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `multi_access_code_credentials_ibfk_2` FOREIGN KEY (`credential_id`) REFERENCES `credential` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `program`
--
ALTER TABLE `program`
  ADD CONSTRAINT `program_ibfk_1` FOREIGN KEY (`institution_id`) REFERENCES `institution` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `student`
--
ALTER TABLE `student`
  ADD CONSTRAINT `student_ibfk_1` FOREIGN KEY (`program_id`) REFERENCES `program` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `student_ibfk_2` FOREIGN KEY (`institution_id`) REFERENCES `institution` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `student_ibfk_3` FOREIGN KEY (`id`) REFERENCES `account` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
