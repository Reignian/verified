-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 30, 2025 at 09:25 PM
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
  `username` varchar(100) NOT NULL,
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
(2, 'student', 'reign', 'reign', 'reign@gmail.com', 1, '2025-09-06 17:20:56'),
(18, 'student', 'gerby', 'gerby', 'gerby@gmail.com', 1, '2025-09-06 17:20:56'),
(19, 'student', 'alicejohnson716', 'password123', 'alicejohnson716@student.edu', 1, '2025-09-17 16:31:58'),
(20, 'student', 'bobwilliams488', 'securepass!', 'bobwilliams488@student.edu', 1, '2025-09-17 16:31:58'),
(21, 'student', 'charliedavis863', 'mysecretpass', 'charliedavis863@student.edu', 1, '2025-09-17 16:31:58'),
(22, 'student', 'dianamiller768', 'studentpass', 'dianamiller768@student.edu', 1, '2025-09-17 16:31:58'),
(23, 'student', 'ethanbrown852', 'p@ssw0rd4u', 'ethanbrown852@student.edu', 1, '2025-09-17 16:31:58'),
(99, 'institution', 'bnhs', 'bnhs', '', 99, '2025-09-06 17:20:14'),
(100, 'student', 'alicejohnson333', 'password123', 'alicejohnson333@student.edu', 99, '2025-09-22 20:14:41'),
(101, 'student', 'bobwilliams412', 'securepass!', 'bobwilliams412@student.edu', 99, '2025-09-22 20:14:41'),
(102, 'student', 'charliedavis800', 'mysecretpass', 'charliedavis800@student.edu', 99, '2025-09-22 20:14:41'),
(103, 'student', 'dianamiller170', 'studentpass', 'dianamiller170@student.edu', 99, '2025-09-22 20:14:41'),
(104, 'student', 'ethanbrown265', 'p@ssw0rd4u', 'ethanbrown265@student.edu', 99, '2025-09-22 20:14:41'),
(999, 'admin', 'admin', 'admin123', 'admin@verified.com', NULL, '2025-09-28 17:06:04');

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
  `ipfs_cid_hash` varchar(100) NOT NULL,
  `status` varchar(50) DEFAULT NULL,
  `blockchain_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `credential`
--

INSERT INTO `credential` (`id`, `credential_type_id`, `custom_type`, `owner_id`, `sender_id`, `ipfs_cid`, `ipfs_cid_hash`, `status`, `blockchain_id`, `created_at`, `updated_at`) VALUES
(25, 2, NULL, 18, 1, 'QmQdgoQZihyr2AqZ4Z2fRMwzB5L181R4wJdiKLMZppzrL4', '024a443c445fcd9ea8c1b472316ef2fab101c38f1a523b0e449403fc9a57b66f', 'blockchain_verified', '10', '2025-09-19 15:35:43', '2025-09-19 15:35:46'),
(27, NULL, 'nc2', 21, 1, 'QmPxDVKfUt1WWZZ87Y1iFAVxFbvmxSy646U7zuUAEubJDz', '8013e65028c2afe030d11a9cd18fbb13011cca41235af6e7eb42a6150a0f2dcf', 'blockchain_verified', '11', '2025-09-19 16:13:57', '2025-09-19 16:14:00'),
(28, 5, NULL, 2, 1, 'QmQdgoQZihyr2AqZ4Z2fRMwzB5L181R4wJdiKLMZppzrL4', '024a443c445fcd9ea8c1b472316ef2fab101c38f1a523b0e449403fc9a57b66f', 'blockchain_verified', '12', '2025-09-19 16:14:31', '2025-09-19 16:14:38'),
(29, 3, NULL, 2, 1, 'QmS9HSkhB2RcYuc7s1rgcxAsQ5KhbXq84JMjrgV9zQrpRx', '7981f09d0bebb353158d5b4bb7921ddcaf5a3b6440c33aee3cb1f6e126e21baa', 'blockchain_verified', '13', '2025-09-22 20:41:07', '2025-09-22 20:41:35'),
(30, 4, NULL, 2, 1, 'QmS9HSkhB2RcYuc7s1rgcxAsQ5KhbXq84JMjrgV9zQrpRx', '7981f09d0bebb353158d5b4bb7921ddcaf5a3b6440c33aee3cb1f6e126e21baa', 'blockchain_verified', '15', '2025-09-29 10:39:11', '2025-09-29 10:39:18'),
(31, 1, NULL, 18, 1, 'QmS9HSkhB2RcYuc7s1rgcxAsQ5KhbXq84JMjrgV9zQrpRx', '7981f09d0bebb353158d5b4bb7921ddcaf5a3b6440c33aee3cb1f6e126e21baa', 'blockchain_verified', '16', '2025-09-29 17:14:52', '2025-09-29 17:15:02'),
(32, 1, NULL, 18, 1, 'QmS9HSkhB2RcYuc7s1rgcxAsQ5KhbXq84JMjrgV9zQrpRx', '7981f09d0bebb353158d5b4bb7921ddcaf5a3b6440c33aee3cb1f6e126e21baa', 'uploaded', NULL, '2025-09-29 18:00:18', '2025-09-29 18:00:18');

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
(1, 29, '123456', 1, '2025-09-22 20:42:27', 0),
(2, 29, 'D4FY4T', 1, '2025-09-22 22:03:40', 0);

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
(1, 'High School Diploma'),
(2, 'Associate Degree'),
(3, 'Bachelor\'s Degree'),
(4, 'Master\'s Degree'),
(5, 'Doctorate (PhD)');

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
(1, 29, '123456', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-28 20:59:56', 'success');

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
(1, 'WMSU', '0x852A8e5c3D309626810944b1a520Dd81B3B5A7fA'),
(99, 'bnhs', '0x1f95BB47F91ea2d05436e30dA1b3282eD199DcF6');

-- --------------------------------------------------------

--
-- Table structure for table `linked_accounts`
--

CREATE TABLE `linked_accounts` (
  `group_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `date_linked` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(18, '2022-01085', 'gerby', 'gerby', 'gerby', 1),
(19, '1001', 'Alice', NULL, 'Johnson', 1),
(20, '1002', 'Bob', NULL, 'Williams', 1),
(21, '1003', 'Charlie', NULL, 'Davis', 1),
(22, '1004', 'Diana', NULL, 'Miller', 1),
(23, '1005', 'Ethan', NULL, 'Brown', 1),
(100, '1001', 'Alice', NULL, 'Johnson', 99),
(101, '1002', 'Bob', NULL, 'Williams', 99),
(102, '1003', 'Charlie', NULL, 'Davis', 99),
(103, '1004', 'Diana', NULL, 'Miller', 99),
(104, '1005', 'Ethan', NULL, 'Brown', 99);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1000;

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `credential`
--
ALTER TABLE `credential`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `credential_access`
--
ALTER TABLE `credential_access`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `credential_types`
--
ALTER TABLE `credential_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `credential_verifications`
--
ALTER TABLE `credential_verifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `institution`
--
ALTER TABLE `institution`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT for table `student`
--
ALTER TABLE `student`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=105;

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
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
