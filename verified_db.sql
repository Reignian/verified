-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 07, 2025 at 05:28 AM
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
  `username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `plain_password` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Temporary plain password storage for email notifications, cleared after first credential'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `account`
--

INSERT INTO `account` (`id`, `account_type`, `username`, `password`, `email`, `status`, `created_at`, `plain_password`) VALUES
(1, 'institution', 'wmsu', '$2b$10$5QBpi7tFxS.ca.dvyQZDLuG.VbTFwTtOphtIi8R53ycXwhT3E3.4i', 'wmsu@gmail.com', 'approved', '2025-09-06 17:20:14', NULL),
(999, 'admin', 'admin', '$2b$10$n5S1mPhT7v/vIACT4Fv1lOZBIVsbujU2tsrEUxHEje3qZA4cldJ0C', 'admin@verified.com', 'approved', '2025-10-17 23:34:01', NULL),
(1030, 'institution_staff', 'jamal', '$2b$10$lwZI11oQ2qFfro7XpFwqTOR3heLpG/eha/b2Qs3t7efXh7RdH6oMe', 'jamal@gmail.com', 'approved', '2025-10-27 03:10:08', NULL),
(1039, 'student', 'gerby', '$2b$10$FJq3WZbppKNxoibiPRpF8uHsw7ROH.T9Gvcm32/r6TwywHAw0Q892', 'gerby@wmsu.edu.ph', NULL, '2025-10-29 13:03:13', NULL),
(1041, 'institution', 'sample', '$2b$10$pUPqOhYA2Bz9lZY6yqEErOcNyhGEEaKGxpF66c2RQma43RrAObCrW', 'reignianc.magno@gmail.com', 'approved', '2025-10-30 13:30:32', NULL),
(1045, 'student', 'reign', '$2b$10$gBYKMgRmTi9Iq/rci1I6yO2JLQG3QxVlmyTi74HLwLXSlfQxM8Na.', 'reign@wmsu.edu.ph', NULL, '2025-11-08 09:30:45', NULL),
(1048, 'institution', 'sampleuniversity', '$2b$10$lzwRFSNy1MAVTKEwuosVJuzCF9wlLl69CD2YS6qs7PRK62PsMH4qu', 'sample.university1@gmail.com', 'approved', '2025-11-09 07:11:14', NULL),
(1050, 'student', 'juan2022123', '$2b$10$cgVAa2tFYmZQ6t1vVgWgAeqOhs9aOBBlmSU5BX7JIoxZYAQr.ZEyK', 'jdc.juandelacruz20@gmail.com', NULL, '2025-11-09 07:44:36', NULL),
(1052, 'student', 'hui fon2022-011111', '$2b$10$NWjMSVUXwvIoZX3mhaqNT.DBs1s.nrDrRd0ry0243nPl.mFvgyJF.', 'huifon.tulawe@sample.edu.ph', NULL, '2025-11-10 18:07:55', NULL),
(1053, 'student', 'gerby202201085', '$2b$10$yoawuFG0xscRZbm9bdFqV.1gSVR8B1ujnUWy9e254PABN5BEPsB6K', 'gerby.hallasgo@sample.edu.ph', NULL, '2025-11-10 18:09:47', NULL),
(1054, 'student', 'jamal20230000', '$2b$10$6anU.CEj1vv70zqDGc2.we42vqxGayAgvZ2GKYRvsyAHRhSaYY0Nq', 'jamal.albadi@sample.edu.ph', NULL, '2025-11-10 18:10:57', NULL),
(1055, 'student', 'stephanie mei20231111', '$2b$10$qWphfjGAKXaQQ5.9ZQZYzeAng9NSt.MzBQUpWzfTlvHdZJN4Cl0we', 'stephanie@sample.edu.ph', NULL, '2025-11-10 18:12:30', NULL),
(1056, 'student', 'jerard20214321', '$2b$10$1BYPX7G9H1zqIr.jYJUM5.cld1oGNEnZv7VhozAz.RTGYfUV0ulq2', 'jerard@sample.edu.ph', NULL, '2025-11-10 18:13:51', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `activity_log`
--

CREATE TABLE `activity_log` (
  `id` int NOT NULL,
  `institution_id` int NOT NULL,
  `user_id` int NOT NULL,
  `action` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `action_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `activity_log`
--

INSERT INTO `activity_log` (`id`, `institution_id`, `user_id`, `action`, `action_type`, `description`, `created_at`) VALUES
(44, 1, 1, 'student_added', 'create', 'Added student: Gerby P. Hallasgo', '2025-10-29 13:03:13'),
(45, 1, 1, 'credential_issued', 'create', 'Issued test credential credential to Gerby P. Hallasgo', '2025-10-29 13:06:00'),
(46, 1, 1, 'program_added', 'create', 'Added program: Associate in Computer Technology', '2025-10-29 13:10:14'),
(47, 1, 1, 'student_added', 'create', 'Added student: Hui Fon Tulawe', '2025-10-29 13:10:59'),
(48, 1, 1, 'credential_issued', 'create', 'Issued Certificate of Graduation credential to Hui Fon Tulawe', '2025-10-29 13:11:48'),
(49, 1, 1, 'credential_issued', 'create', 'Issued test credential credential to Reign Ian Carreon Magno', '2025-10-30 06:09:38'),
(50, 1, 1, 'credential_issued', 'create', 'Issued test credential credential to Reign Ian Carreon Magno', '2025-10-30 06:50:24'),
(51, 1041, 1041, 'program_added', 'create', 'Added program: Bachelor of Science in Computer Science', '2025-10-30 13:31:16'),
(52, 1041, 1041, 'student_added', 'create', 'Added student: Reign Ian Carreon Magno', '2025-10-30 13:31:58'),
(53, 1041, 1041, 'credential_issued', 'create', 'Issued Diploma credential to Reign Ian Carreon Magno', '2025-10-30 13:32:33'),
(54, 1, 1, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Reign Ian Carreon Magno', '2025-11-05 03:50:51'),
(55, 1, 1, 'credential_issued', 'create', 'Issued Diploma credential to Reign Ian Carreon Magno', '2025-11-05 04:04:45'),
(56, 1, 1, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Reign Ian Carreon Magno', '2025-11-05 12:28:07'),
(57, 1, 1, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Reign Ian Carreon Magno', '2025-11-05 13:32:28'),
(58, 1, 1, 'credential_issued', 'create', 'Issued Diploma credential to Reign Ian Carreon Magno', '2025-11-05 14:15:13'),
(59, 1, 1, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Reign Ian Carreon Magno', '2025-11-07 03:41:15'),
(60, 1, 1, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Reign Ian Carreon Magno', '2025-11-07 03:46:43'),
(61, 1, 1, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Reign Ian Carreon Magno', '2025-11-07 03:49:43'),
(62, 1, 1030, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Reign Ian Carreon Magno', '2025-11-07 04:00:42'),
(63, 1, 1, 'student_added', 'create', 'Added student: Hui Fon Tulawe', '2025-11-07 07:44:02'),
(64, 1, 1, 'student_added', 'create', 'Added student: Reign Ian Carreon Magno', '2025-11-08 09:25:30'),
(65, 1, 1, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Reign Ian Carreon Magno', '2025-11-08 09:26:38'),
(66, 1, 1, 'student_added', 'create', 'Added student: Reign Ian Carreon Magno', '2025-11-08 09:31:00'),
(67, 1, 1, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Reign Ian Carreon Magno', '2025-11-08 09:35:29'),
(68, 1, 1, 'student_added', 'create', 'Added student: sample sample sample', '2025-11-09 06:41:42'),
(69, 1, 1, 'credential_issued', 'create', 'Issued test credential to sample sample sample', '2025-11-09 06:45:05'),
(70, 1048, 1048, 'program_added', 'create', 'Added program: Bachelor of Science in Computer Science', '2025-11-09 07:41:58'),
(71, 1048, 1048, 'student_added', 'create', 'Added student: Juan Dela Cruz', '2025-11-09 07:42:58'),
(72, 1048, 1048, 'student_deleted', 'delete', 'Deleted student: Juan Dela Cruz', '2025-11-09 07:43:38'),
(73, 1048, 1048, 'student_added', 'create', 'Added student: Juan Dela Cruz', '2025-11-09 07:44:40'),
(74, 1048, 1048, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Juan Dela Cruz', '2025-11-10 08:19:11'),
(75, 1048, 1048, 'staff_added', 'create', 'Added staff member: Jamal alumbre Al badi', '2025-11-10 09:06:55'),
(76, 1048, 1048, 'staff_deleted', 'delete', 'Deleted staff member: Jamal Al badi', '2025-11-10 09:07:05'),
(77, 1048, 1048, 'program_added', 'create', 'Added program: Bachelor of Science in Information Technology', '2025-11-10 18:05:40'),
(78, 1048, 1048, 'program_added', 'create', 'Added program: Associate in Computer Technology', '2025-11-10 18:05:59'),
(79, 1048, 1048, 'program_added', 'create', 'Added program: Bachelor of Science in Civil Engineering', '2025-11-10 18:06:30'),
(80, 1048, 1048, 'program_added', 'create', 'Added program: Bachelor of Science in Nursing', '2025-11-10 18:06:51'),
(81, 1048, 1048, 'student_added', 'create', 'Added student: Hui Fon Tulawe', '2025-11-10 18:07:59'),
(82, 1048, 1048, 'student_added', 'create', 'Added student: Gerby Hallasgo', '2025-11-10 18:09:50'),
(83, 1048, 1048, 'student_added', 'create', 'Added student: Jamal Alumbre Al badi', '2025-11-10 18:11:00'),
(84, 1048, 1048, 'student_added', 'create', 'Added student: Stephanie Mei Bobon', '2025-11-10 18:12:33'),
(85, 1048, 1048, 'student_added', 'create', 'Added student: Jerard Jamilon Regalado', '2025-11-10 18:13:54'),
(86, 1048, 1048, 'credential_issued', 'create', 'Issued Certificate of Graduation credential to Gerby Hallasgo', '2025-11-10 18:15:16'),
(87, 1048, 1048, 'credential_issued', 'create', 'Issued Certificate of Graduation credential to Hui Fon Tulawe', '2025-11-10 18:16:21'),
(88, 1048, 1048, 'credential_issued', 'create', 'Issued Diploma credential to Jamal Alumbre Al badi', '2025-11-10 18:17:51'),
(89, 1048, 1048, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Stephanie Mei Bobon', '2025-11-10 18:18:39'),
(90, 1048, 1048, 'credential_issued', 'create', 'Issued Diploma credential to Jerard Jamilon Regalado', '2025-11-10 18:19:34'),
(91, 1048, 1048, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Juan Dela Cruz', '2025-11-12 08:36:18'),
(92, 1048, 1048, 'credential_issued', 'create', 'Issued Diploma credential to Juan Dela Cruz', '2025-11-15 10:57:55'),
(93, 1048, 1048, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Juan Dela Cruz', '2025-11-18 18:58:34'),
(94, 1048, 1048, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Juan Dela Cruz', '2025-11-18 19:24:14'),
(95, 1048, 1048, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Juan Dela Cruz', '2025-11-18 19:29:32'),
(96, 1048, 1048, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Juan Dela Cruz', '2025-11-18 20:04:46'),
(97, 1048, 1048, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Juan Dela Cruz', '2025-11-18 20:16:15'),
(98, 1048, 1048, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Juan Dela Cruz', '2025-11-18 20:17:50'),
(99, 1048, 1048, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Juan Dela Cruz', '2025-11-18 20:30:58'),
(100, 1048, 1048, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Juan Dela Cruz', '2025-11-19 01:17:25'),
(101, 1048, 1048, 'credential_issued', 'create', 'Issued Diploma credential to Juan Dela Cruz', '2025-11-26 08:36:36'),
(102, 1048, 1048, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Juan Dela Cruz', '2025-11-26 18:01:21'),
(103, 1048, 1048, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Juan Dela Cruz', '2025-11-26 19:14:57'),
(104, 1048, 1048, 'credential_issued', 'create', 'Issued Transcript of Records (TOR) credential to Jerard Jamilon Regalado', '2025-11-26 19:18:45');

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `user_type` enum('institution','employer','student','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `status` enum('unread','read','replied') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'unread',
  `message_type` enum('contact','signup_request') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'contact',
  `account_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `device_fingerprint` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `name`, `email`, `user_type`, `message`, `status`, `message_type`, `account_id`, `created_at`, `updated_at`, `device_fingerprint`, `ip_address`, `user_agent`) VALUES
(6, 'ciao', 'eh202201076@wmsu.edu.ph', 'other', 'hi', 'replied', 'contact', NULL, '2025-10-08 12:51:25', '2025-10-12 15:40:52', NULL, NULL, NULL),
(7, 'Hallasgo Gerby P.', 'jcpowerzone@gmail.com', 'institution', 'halo', 'replied', 'contact', NULL, '2025-10-12 15:24:50', '2025-10-12 15:33:58', '5i34gr', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'),
(8, 'test', 'hallasgogerby@gmail.com', 'institution', 'New institution signup request from test.\n\nUsername: test\nEmail: hallasgogerby@gmail.com\n\nPlease review and approve or reject this request.', 'replied', 'signup_request', 1026, '2025-10-25 17:51:08', '2025-10-25 17:55:51', NULL, NULL, NULL),
(9, 'hui', 'thuifon@gmail.com', 'institution', 'test 1', 'replied', 'contact', NULL, '2025-10-25 18:04:57', '2025-10-25 18:28:44', '60kd3r', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'),
(10, 'sample university', 'reignianc.magno@gmail.com', 'institution', 'New institution signup request from sample university.\n\nUsername: sample\nEmail: reignianc.magno@gmail.com\n\nPlease review and approve or reject this request.', 'replied', 'signup_request', 1041, '2025-10-30 13:30:32', '2025-10-30 13:30:48', NULL, NULL, NULL),
(11, 'SAmple University', 'sample.university1@gmail.com', 'institution', 'New institution signup request from SAmple University.\n\nUsername: sampleuniversity\nEmail: sample.university1@gmail.com\n\nPlease review and approve or reject this request.', 'replied', 'signup_request', 1047, '2025-11-09 06:57:14', '2025-11-09 06:57:53', NULL, NULL, NULL),
(12, 'Sample University', 'sample.university1@gmail.com', 'institution', 'New institution signup request from Sample University.\n\nUsername: sampleuniversity\nEmail: sample.university1@gmail.com\n\nPlease review and approve or reject this request.', 'replied', 'signup_request', 1048, '2025-11-09 07:11:14', '2025-11-09 07:11:53', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `contact_submissions`
--

CREATE TABLE `contact_submissions` (
  `id` int NOT NULL,
  `device_fingerprint` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `email_hash` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `submission_count` int DEFAULT '1',
  `last_submission` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `blocked_until` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contact_submissions`
--

INSERT INTO `contact_submissions` (`id`, `device_fingerprint`, `ip_address`, `email_hash`, `submission_count`, `last_submission`, `created_at`, `blocked_until`) VALUES
(1, '5i34gr', '::1', '8f318be0ba18a1d36cb81319226408b4cfeedb0cb8ba09cdeb0ae5b2c9c627ad', 1, '2025-10-12 15:24:50', '2025-10-12 15:24:50', NULL),
(2, '60kd3r', '::1', '92095580f0b957bf368016762d4d32dca67ba29c8f1afee59228e8fada3ab843', 1, '2025-10-25 18:04:57', '2025-10-25 18:04:57', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `credential`
--

CREATE TABLE `credential` (
  `id` int NOT NULL,
  `credential_type_id` int DEFAULT NULL,
  `custom_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `owner_id` int NOT NULL,
  `sender_id` int NOT NULL,
  `program_id` int DEFAULT NULL,
  `ipfs_cid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `blockchain_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `transaction_id` varchar(70) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `credential`
--

INSERT INTO `credential` (`id`, `credential_type_id`, `custom_type`, `owner_id`, `sender_id`, `program_id`, `ipfs_cid`, `status`, `blockchain_id`, `transaction_id`, `created_at`, `updated_at`) VALUES
(93, 2, NULL, 1056, 1048, 12, 'QmeCPp35YQ8LXubBGGLZVQsMSYyVD5QU3w6JFvibGNAeXp', 'blockchain_verified', '157', '0x19cf0f10eb44f4d127e8c550a94cdb769bd9b660d050baef75fb42b56de92f4f', '2025-11-26 19:18:44', '2025-11-26 19:18:44');

-- --------------------------------------------------------

--
-- Table structure for table `credential_access`
--

CREATE TABLE `credential_access` (
  `id` int NOT NULL,
  `credential_id` int NOT NULL,
  `access_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `credential_types`
--

CREATE TABLE `credential_types` (
  `id` int NOT NULL,
  `type_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
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
-- Table structure for table `credential_validation_logs`
--

CREATE TABLE `credential_validation_logs` (
  `id` int NOT NULL,
  `credential_type_id` int NOT NULL,
  `uploaded_file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `validation_result` enum('valid','invalid','error') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `ai_confidence` decimal(5,2) DEFAULT NULL,
  `ai_reasoning` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `detected_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `validated_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `credential_verifications`
--

CREATE TABLE `credential_verifications` (
  `id` int NOT NULL,
  `credential_id` int NOT NULL,
  `access_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `verifier_ip` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `verifier_user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `verification_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'success'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `institution`
--

CREATE TABLE `institution` (
  `id` int NOT NULL,
  `institution_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `public_address` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `institution`
--

INSERT INTO `institution` (`id`, `institution_name`, `public_address`) VALUES
(1, 'Western Mindanao State University', '0xbda9c415c28e06bffe626313c2aa429dce2c6016'),
(1041, 'sample university', '0xbda9c415c28e06bffe626313c2aa429dce2c6016'),
(1048, 'Sample University', '0xbda9c415c28e06bffe626313c2aa429dce2c6016');

-- --------------------------------------------------------

--
-- Table structure for table `institution_addresses`
--

CREATE TABLE `institution_addresses` (
  `id` int NOT NULL,
  `institution_id` int NOT NULL,
  `public_address` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `institution_addresses`
--

INSERT INTO `institution_addresses` (`id`, `institution_id`, `public_address`, `created_at`) VALUES
(1, 1, '0xbda9c415c28e06bffe626313c2aa429dce2c6016', '2025-10-27 13:15:08'),
(2, 1, '0x852a8e5c3d309626810944b1a520dd81b3b5a7fa', '2025-10-27 13:15:56'),
(5, 1048, '0xbda9c415c28e06bffe626313c2aa429dce2c6016', '2025-11-09 07:14:35');

-- --------------------------------------------------------

--
-- Table structure for table `institution_staff`
--

CREATE TABLE `institution_staff` (
  `id` int NOT NULL,
  `first_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `middle_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `last_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `institution_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `institution_staff`
--

INSERT INTO `institution_staff` (`id`, `first_name`, `middle_name`, `last_name`, `institution_id`) VALUES
(1030, 'Jamal', 'Alumbre', 'Al badi', 1);

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
  `access_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `student_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `multi_access_code`
--

INSERT INTO `multi_access_code` (`id`, `access_code`, `student_id`, `is_active`, `created_at`, `is_deleted`) VALUES
(11, '0H0SPG', 1050, 1, '2025-11-15 11:05:27', 0);

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
  `program_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `program_code` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `program`
--

INSERT INTO `program` (`id`, `institution_id`, `program_name`, `program_code`, `created_at`) VALUES
(2, 1, 'Bachelor of Science in Computer Science', 'BSCS', '2025-10-17 18:42:29'),
(3, 1, 'Bachelor of Science in Information Technology', 'BSIT', '2025-10-17 18:42:51'),
(7, 1, 'Associate in Computer Technology', 'ACT', '2025-10-29 13:10:14'),
(8, 1041, 'Bachelor of Science in Computer Science', 'BSCS', '2025-10-30 13:31:16'),
(9, 1048, 'Bachelor of Science in Computer Science', 'BSCS', '2025-11-09 07:41:58'),
(10, 1048, 'Bachelor of Science in Information Technology', 'BSIT', '2025-11-10 18:05:40'),
(11, 1048, 'Associate in Computer Technology', 'ACT', '2025-11-10 18:05:59'),
(12, 1048, 'Bachelor of Science in Civil Engineering', 'BSCE', '2025-11-10 18:06:30'),
(13, 1048, 'Bachelor of Science in Nursing', 'BSN', '2025-11-10 18:06:51');

-- --------------------------------------------------------

--
-- Table structure for table `student`
--

CREATE TABLE `student` (
  `id` int NOT NULL,
  `program_id` int DEFAULT NULL,
  `student_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `first_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `middle_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `institution_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student`
--

INSERT INTO `student` (`id`, `program_id`, `student_id`, `first_name`, `middle_name`, `last_name`, `institution_id`) VALUES
(1039, 3, '2022-01085', 'Gerby', 'P.', 'Hallasgo', 1),
(1045, 2, '2022-01084', 'Reign Ian', 'Carreon', 'Magno', 1),
(1050, 9, '2022123', 'Juan', '', 'Dela Cruz', 1048),
(1052, 9, '202201111', 'Hui Fon', '', 'Tulawe', 1048),
(1053, 9, '202201085', 'Gerby', '', 'Hallasgo', 1048),
(1054, 10, '20230000', 'Jamal', 'Alumbre', 'Al badi', 1048),
(1055, 13, '20231111', 'Stephanie Mei', '', 'Bobon', 1048),
(1056, 12, '20214321', 'Jerard', 'Jamilon', 'Regalado', 1048);

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int NOT NULL,
  `setting_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `setting_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `setting_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
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

-- --------------------------------------------------------

--
-- Table structure for table `transaction_costs`
--

CREATE TABLE `transaction_costs` (
  `id` int NOT NULL,
  `credential_id` int NOT NULL,
  `transaction_hash` varchar(66) COLLATE utf8mb4_unicode_ci NOT NULL,
  `institution_id` int NOT NULL,
  `gas_used` bigint NOT NULL,
  `gas_price_gwei` decimal(20,9) NOT NULL,
  `gas_cost_pol` decimal(20,18) NOT NULL,
  `pol_price_usd` decimal(10,6) NOT NULL,
  `pol_price_php` decimal(10,4) NOT NULL,
  `gas_cost_usd` decimal(10,6) NOT NULL,
  `gas_cost_php` decimal(10,4) NOT NULL,
  `tx_timestamp` bigint NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transaction_costs`
--

INSERT INTO `transaction_costs` (`id`, `credential_id`, `transaction_hash`, `institution_id`, `gas_used`, `gas_price_gwei`, `gas_cost_pol`, `pol_price_usd`, `pol_price_php`, `gas_cost_usd`, `gas_cost_php`, `tx_timestamp`, `created_at`) VALUES
(26, 93, '0x19cf0f10eb44f4d127e8c550a94cdb769bd9b660d050baef75fb42b56de92f4f', 1048, 119327, 30.009092950, 0.003580895034444650, 0.138027, 8.1200, 0.000494, 0.0291, 79539842, '2025-11-26 19:18:45');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `account`
--
ALTER TABLE `account`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_plain_password` (`plain_password`);

--
-- Indexes for table `activity_log`
--
ALTER TABLE `activity_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_institution_id` (`institution_id`),
  ADD KEY `idx_user_id` (`user_id`);

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
-- Indexes for table `credential_validation_logs`
--
ALTER TABLE `credential_validation_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `credential_type_id` (`credential_type_id`),
  ADD KEY `validated_by` (`validated_by`);

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
  ADD KEY `idx_institution_id` (`institution_id`);

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
-- Indexes for table `transaction_costs`
--
ALTER TABLE `transaction_costs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_transaction` (`transaction_hash`),
  ADD KEY `idx_credential_id` (`credential_id`),
  ADD KEY `idx_institution_id` (`institution_id`),
  ADD KEY `idx_transaction_hash` (`transaction_hash`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `account`
--
ALTER TABLE `account`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1057;

--
-- AUTO_INCREMENT for table `activity_log`
--
ALTER TABLE `activity_log`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=105;

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `contact_submissions`
--
ALTER TABLE `contact_submissions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `credential`
--
ALTER TABLE `credential`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=94;

--
-- AUTO_INCREMENT for table `credential_access`
--
ALTER TABLE `credential_access`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `credential_types`
--
ALTER TABLE `credential_types`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `credential_validation_logs`
--
ALTER TABLE `credential_validation_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `credential_verifications`
--
ALTER TABLE `credential_verifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=107;

--
-- AUTO_INCREMENT for table `institution`
--
ALTER TABLE `institution`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1049;

--
-- AUTO_INCREMENT for table `institution_addresses`
--
ALTER TABLE `institution_addresses`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `institution_staff`
--
ALTER TABLE `institution_staff`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1052;

--
-- AUTO_INCREMENT for table `multi_access_code`
--
ALTER TABLE `multi_access_code`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `multi_access_code_credentials`
--
ALTER TABLE `multi_access_code_credentials`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `program`
--
ALTER TABLE `program`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `student`
--
ALTER TABLE `student`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1057;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `transaction_costs`
--
ALTER TABLE `transaction_costs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_log`
--
ALTER TABLE `activity_log`
  ADD CONSTRAINT `activity_log_ibfk_1` FOREIGN KEY (`institution_id`) REFERENCES `account` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `activity_log_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `account` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `credential`
--
ALTER TABLE `credential`
  ADD CONSTRAINT `credential_ibfk_1` FOREIGN KEY (`credential_type_id`) REFERENCES `credential_types` (`id`),
  ADD CONSTRAINT `credential_ibfk_2` FOREIGN KEY (`owner_id`) REFERENCES `account` (`id`),
  ADD CONSTRAINT `credential_ibfk_3` FOREIGN KEY (`sender_id`) REFERENCES `account` (`id`),
  ADD CONSTRAINT `credential_ibfk_4` FOREIGN KEY (`program_id`) REFERENCES `program` (`id`);

--
-- Constraints for table `credential_access`
--
ALTER TABLE `credential_access`
  ADD CONSTRAINT `credential_access_ibfk_1` FOREIGN KEY (`credential_id`) REFERENCES `credential` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

--
-- Constraints for table `credential_validation_logs`
--
ALTER TABLE `credential_validation_logs`
  ADD CONSTRAINT `credential_validation_logs_ibfk_1` FOREIGN KEY (`credential_type_id`) REFERENCES `credential_types` (`id`),
  ADD CONSTRAINT `credential_validation_logs_ibfk_2` FOREIGN KEY (`validated_by`) REFERENCES `account` (`id`);

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
  ADD CONSTRAINT `institution_ibfk_1` FOREIGN KEY (`id`) REFERENCES `account` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

--
-- Constraints for table `institution_addresses`
--
ALTER TABLE `institution_addresses`
  ADD CONSTRAINT `institution_addresses_ibfk_1` FOREIGN KEY (`institution_id`) REFERENCES `institution` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `institution_staff`
--
ALTER TABLE `institution_staff`
  ADD CONSTRAINT `institution_staff_ibfk_1` FOREIGN KEY (`institution_id`) REFERENCES `institution` (`id`),
  ADD CONSTRAINT `institution_staff_ibfk_2` FOREIGN KEY (`id`) REFERENCES `account` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

--
-- Constraints for table `linked_accounts`
--
ALTER TABLE `linked_accounts`
  ADD CONSTRAINT `linked_accounts_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `account` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

--
-- Constraints for table `multi_access_code`
--
ALTER TABLE `multi_access_code`
  ADD CONSTRAINT `multi_access_code_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `account` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

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
  ADD CONSTRAINT `program_ibfk_1` FOREIGN KEY (`institution_id`) REFERENCES `institution` (`id`);

--
-- Constraints for table `student`
--
ALTER TABLE `student`
  ADD CONSTRAINT `student_ibfk_1` FOREIGN KEY (`program_id`) REFERENCES `program` (`id`),
  ADD CONSTRAINT `student_ibfk_2` FOREIGN KEY (`institution_id`) REFERENCES `institution` (`id`),
  ADD CONSTRAINT `student_ibfk_3` FOREIGN KEY (`id`) REFERENCES `account` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `transaction_costs`
--
ALTER TABLE `transaction_costs`
  ADD CONSTRAINT `transaction_costs_ibfk_1` FOREIGN KEY (`credential_id`) REFERENCES `credential` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transaction_costs_ibfk_2` FOREIGN KEY (`institution_id`) REFERENCES `institution` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
