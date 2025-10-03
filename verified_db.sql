-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 03, 2025 at 10:22 PM
-- Server version: 10.4.32-MariaDB
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
  `id` int(11) NOT NULL,
  `account_type` enum('student','institution','admin','') NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `password` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `institution_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `account`
--

INSERT INTO `account` (`id`, `account_type`, `username`, `password`, `email`, `institution_id`, `created_at`) VALUES
(1, 'institution', 'wmsu', 'wmsu', 'wmsu@gmail.com', 1, '2025-09-06 17:20:14'),
(2, 'student', '', 'reign', 'reign@wmsu.edu.ph', 1, '2025-09-06 17:20:56'),
(3, 'student', '', 'gerby', 'gerby@adzu.edu.ph', 99, '2025-10-01 22:06:06'),
(18, 'student', '', 'gerby', 'gerby@wmsu.edu.ph', 1, '2025-09-06 17:20:56'),
(99, 'institution', 'adzu', 'adzu', 'adzu@gmail.com', 99, '2025-09-06 17:20:14'),
(999, 'admin', 'admin', 'admin123', 'admin@verified.com', NULL, '2025-09-28 17:06:04'),
(1009, 'student', NULL, 'reign', 'reign@adzu.edu.ph', 99, '2025-10-03 16:41:29');

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `user_type` enum('institution','employer','student','other') NOT NULL,
  `message` text NOT NULL,
  `status` enum('unread','read','replied') DEFAULT 'unread',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `name`, `email`, `user_type`, `message`, `status`, `created_at`, `updated_at`) VALUES
(1, 'John University', 'contact@johnuniv.edu', 'institution', 'We are interested in integrating VerifiED into our credential issuance system. Could you provide more information about the onboarding process?', 'replied', '2025-09-25 02:30:00', '2025-09-28 17:14:21'),
(2, 'Sarah HR Manager', 'sarah.hr@techcorp.com', 'employer', 'Our company frequently verifies academic credentials. How can we access your verification API?', 'replied', '2025-09-24 06:15:00', '2025-09-28 17:14:21'),
(3, 'Mike Student', 'mike.grad@email.com', 'student', 'I have an issue accessing my credentials. Can you help me troubleshoot?', 'replied', '2025-09-23 01:45:00', '2025-09-28 17:06:04'),
(4, 'Global Education Inc', 'partnerships@globaledu.org', 'institution', 'We represent multiple educational institutions interested in blockchain credential verification. Please contact us to discuss partnership opportunities.', 'replied', '2025-09-22 08:20:00', '2025-09-28 17:14:22'),
(5, 'Hallasgo Gerby P.', 'hallasgogerby@gmail.com', 'institution', 'haha', 'replied', '2025-09-28 17:14:40', '2025-09-28 17:15:41');

-- --------------------------------------------------------

--
-- Table structure for table `credential`
--

CREATE TABLE `credential` (
  `id` int(11) NOT NULL,
  `credential_type_id` int(11) DEFAULT NULL,
  `custom_type` varchar(100) DEFAULT NULL,
  `owner_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `ipfs_cid` varchar(255) NOT NULL,
  `status` varchar(50) DEFAULT NULL,
  `blockchain_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `credential`
--

INSERT INTO `credential` (`id`, `credential_type_id`, `custom_type`, `owner_id`, `sender_id`, `ipfs_cid`, `status`, `blockchain_id`, `created_at`, `updated_at`) VALUES
(38, 1, NULL, 2, 1, 'QmS9HSkhB2RcYuc7s1rgcxAsQ5KhbXq84JMjrgV9zQrpRx', 'blockchain_verified', '20', '2025-10-02 01:40:31', '2025-10-02 01:44:56'),
(39, 2, NULL, 2, 1, 'QmS9HSkhB2RcYuc7s1rgcxAsQ5KhbXq84JMjrgV9zQrpRx', 'blockchain_verified', '21', '2025-10-03 12:50:56', '2025-10-03 12:51:07'),
(40, 1, NULL, 1009, 99, 'QmS9HSkhB2RcYuc7s1rgcxAsQ5KhbXq84JMjrgV9zQrpRx', 'blockchain_verified', '22', '2025-10-03 16:44:00', '2025-10-03 20:13:50');

-- --------------------------------------------------------

--
-- Table structure for table `credential_access`
--

CREATE TABLE `credential_access` (
  `id` int(11) NOT NULL,
  `credential_id` int(11) NOT NULL,
  `access_code` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `credential_access`
--

INSERT INTO `credential_access` (`id`, `credential_id`, `access_code`, `is_active`, `created_at`, `is_deleted`) VALUES
(6, 38, 'ERPEY6', 1, '2025-10-02 01:46:13', 0),
(7, 39, 'GEOJN3', 1, '2025-10-03 16:14:02', 0),
(8, 39, '5FG6BE', 1, '2025-10-03 16:20:47', 0),
(9, 40, 'ULHO3F', 1, '2025-10-03 16:45:16', 0);

-- --------------------------------------------------------

--
-- Table structure for table `credential_types`
--

CREATE TABLE `credential_types` (
  `id` int(11) NOT NULL,
  `type_name` varchar(100) NOT NULL
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
  `id` int(11) NOT NULL,
  `credential_id` int(11) NOT NULL,
  `access_code` varchar(50) NOT NULL,
  `verifier_ip` varchar(45) DEFAULT NULL,
  `verifier_user_agent` text DEFAULT NULL,
  `verification_timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('success','failed') DEFAULT 'success'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `credential_verifications`
--

INSERT INTO `credential_verifications` (`id`, `credential_id`, `access_code`, `verifier_ip`, `verifier_user_agent`, `verification_timestamp`, `status`) VALUES
(9, 38, 'ERPEY6', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-02 01:47:20', 'success'),
(12, 38, 'ERPEY6', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:22:43', 'success'),
(16, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:33:10', 'success'),
(17, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:33:32', 'success'),
(18, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:33:35', 'success'),
(19, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:33:36', 'success'),
(20, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:33:36', 'success'),
(21, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:33:36', 'success'),
(22, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:33:36', 'success'),
(23, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:33:37', 'success'),
(24, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:33:37', 'success'),
(25, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:33:37', 'success'),
(26, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:34:28', 'success'),
(27, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:41:35', 'success'),
(28, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:41:58', 'success'),
(29, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:42:11', 'success'),
(30, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:42:13', 'success'),
(31, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:42:16', 'success'),
(32, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:42:43', 'success'),
(33, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:42:44', 'success'),
(34, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:43:14', 'success'),
(35, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:43:44', 'success'),
(36, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:43:56', 'success'),
(37, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:43:57', 'success'),
(38, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:44:08', 'success'),
(39, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:44:43', 'success'),
(40, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:44:55', 'success'),
(41, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:54:40', 'success'),
(42, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:55:02', 'success'),
(43, 38, 'ERPEY6', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:55:25', 'success'),
(44, 39, '5FG6BE', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:55:32', 'success'),
(45, 39, '5FG6BE', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:55:55', 'success'),
(46, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 20:12:43', 'success'),
(47, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 20:12:53', 'success'),
(48, 40, 'ULHO3F', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 20:13:01', 'success');

-- --------------------------------------------------------

--
-- Table structure for table `institution`
--

CREATE TABLE `institution` (
  `id` int(11) NOT NULL,
  `institution_name` varchar(255) NOT NULL,
  `public_address` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `institution`
--

INSERT INTO `institution` (`id`, `institution_name`, `public_address`) VALUES
(1, 'Western Mindanao State University', '0x852A8e5c3D309626810944b1a520Dd81B3B5A7fA'),
(99, 'Ateneo de Zamboanga University', '0x1f95BB47F91ea2d05436e30dA1b3282eD199DcF6');

-- --------------------------------------------------------

--
-- Table structure for table `linked_accounts`
--

CREATE TABLE `linked_accounts` (
  `group_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `date_linked` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `linked_accounts`
--

INSERT INTO `linked_accounts` (`group_id`, `student_id`, `date_linked`) VALUES
(1, 2, '2025-10-03 16:46:11'),
(1, 1009, '2025-10-03 16:46:11');

-- --------------------------------------------------------

--
-- Table structure for table `multi_access_code`
--

CREATE TABLE `multi_access_code` (
  `id` int(11) NOT NULL,
  `access_code` varchar(50) NOT NULL,
  `student_id` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `multi_access_code`
--

INSERT INTO `multi_access_code` (`id`, `access_code`, `student_id`, `is_active`, `created_at`, `is_deleted`) VALUES
(5, '06JQA1', 2, 1, '2025-10-03 16:05:47', 0),
(6, 'Q8O33N', 2, 1, '2025-10-03 16:13:52', 1),
(7, 'FWMQ2H', 1009, 1, '2025-10-03 16:51:07', 0),
(8, '5PLI4U', 1009, 1, '2025-10-03 17:06:37', 0);

-- --------------------------------------------------------

--
-- Table structure for table `multi_access_code_credentials`
--

CREATE TABLE `multi_access_code_credentials` (
  `id` int(11) NOT NULL,
  `multi_access_code_id` int(11) NOT NULL,
  `credential_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `multi_access_code_credentials`
--

INSERT INTO `multi_access_code_credentials` (`id`, `multi_access_code_id`, `credential_id`, `created_at`) VALUES
(9, 5, 39, '2025-10-03 16:05:47'),
(10, 5, 38, '2025-10-03 16:05:47'),
(11, 6, 39, '2025-10-03 16:13:52'),
(12, 6, 38, '2025-10-03 16:13:52'),
(13, 7, 40, '2025-10-03 16:51:07'),
(14, 7, 38, '2025-10-03 16:51:07'),
(15, 8, 40, '2025-10-03 17:06:37'),
(16, 8, 39, '2025-10-03 17:06:37'),
(17, 8, 38, '2025-10-03 17:06:37');

-- --------------------------------------------------------

--
-- Table structure for table `student`
--

CREATE TABLE `student` (
  `id` int(11) NOT NULL,
  `student_id` varchar(50) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) NOT NULL,
  `institution_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student`
--

INSERT INTO `student` (`id`, `student_id`, `first_name`, `middle_name`, `last_name`, `institution_id`) VALUES
(2, '2022-01084', 'Reign Ian', 'Carreon', 'Magno', 1),
(3, 'ADZU202201085', 'Gerby', 'P.', 'Hallasgo', 99),
(18, '2022-01085', 'Gerby', 'P.', 'Hallasgo', 1),
(1009, 'ADZU202201084', 'Reign Ian', 'Carreon', 'Magno', 99);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `account`
--
ALTER TABLE `account`
  ADD PRIMARY KEY (`id`),
  ADD KEY `account_institution_fk` (`institution_id`);

--
-- Indexes for table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `credential`
--
ALTER TABLE `credential`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `blockchain_id` (`blockchain_id`),
  ADD KEY `credential_type_id` (`credential_type_id`),
  ADD KEY `owner_id` (`owner_id`),
  ADD KEY `sender_id` (`sender_id`);

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
-- Indexes for table `student`
--
ALTER TABLE `student`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_institution_id` (`institution_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `account`
--
ALTER TABLE `account`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1011;

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `credential`
--
ALTER TABLE `credential`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `credential_access`
--
ALTER TABLE `credential_access`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `credential_types`
--
ALTER TABLE `credential_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `credential_verifications`
--
ALTER TABLE `credential_verifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `institution`
--
ALTER TABLE `institution`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT for table `multi_access_code`
--
ALTER TABLE `multi_access_code`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `multi_access_code_credentials`
--
ALTER TABLE `multi_access_code_credentials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `student`
--
ALTER TABLE `student`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1010;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `credential`
--
ALTER TABLE `credential`
  ADD CONSTRAINT `credential_ibfk_1` FOREIGN KEY (`credential_type_id`) REFERENCES `credential_types` (`id`),
  ADD CONSTRAINT `credential_ibfk_2` FOREIGN KEY (`owner_id`) REFERENCES `account` (`id`),
  ADD CONSTRAINT `credential_ibfk_3` FOREIGN KEY (`sender_id`) REFERENCES `account` (`id`);

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
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
