-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 22, 2025 at 10:15 PM
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
  `account_type` enum('student','institution','','') NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `public_address` varchar(100) NOT NULL,
  `institution_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `account`
--

INSERT INTO `account` (`id`, `account_type`, `username`, `password`, `email`, `public_address`, `institution_id`, `created_at`) VALUES
(1, 'institution', 'wmsu', 'wmsu', 'wmsu@gmail.com', '0x852A8e5c3D309626810944b1a520Dd81B3B5A7fA', 1, '2025-09-06 17:20:14'),
(2, 'student', 'reign', 'reign', 'reign@gmail.com', '0x1f95BB47F91ea2d05436e30dA1b3282eD199DcF6', 1, '2025-09-06 17:20:56'),
(18, 'student', 'gerby', 'gerby', 'gerby@gmail.com', '', 1, '2025-09-06 17:20:56'),
(19, 'student', 'alicejohnson716', 'password123', 'alicejohnson716@student.edu', '', 1, '2025-09-17 16:31:58'),
(20, 'student', 'bobwilliams488', 'securepass!', 'bobwilliams488@student.edu', '', 1, '2025-09-17 16:31:58'),
(21, 'student', 'charliedavis863', 'mysecretpass', 'charliedavis863@student.edu', '', 1, '2025-09-17 16:31:58'),
(22, 'student', 'dianamiller768', 'studentpass', 'dianamiller768@student.edu', '', 1, '2025-09-17 16:31:58'),
(23, 'student', 'ethanbrown852', 'p@ssw0rd4u', 'ethanbrown852@student.edu', '', 1, '2025-09-17 16:31:58'),
(99, 'institution', 'bnhs', 'bnhs', '', '', 99, '2025-09-06 17:20:14'),
(100, 'student', 'alicejohnson333', 'password123', 'alicejohnson333@student.edu', '', 99, '2025-09-22 20:14:41'),
(101, 'student', 'bobwilliams412', 'securepass!', 'bobwilliams412@student.edu', '', 99, '2025-09-22 20:14:41'),
(102, 'student', 'charliedavis800', 'mysecretpass', 'charliedavis800@student.edu', '', 99, '2025-09-22 20:14:41'),
(103, 'student', 'dianamiller170', 'studentpass', 'dianamiller170@student.edu', '', 99, '2025-09-22 20:14:41'),
(104, 'student', 'ethanbrown265', 'p@ssw0rd4u', 'ethanbrown265@student.edu', '', 99, '2025-09-22 20:14:41');

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
(28, 5, NULL, 2, 1, 'QmQdgoQZihyr2AqZ4Z2fRMwzB5L181R4wJdiKLMZppzrL4', '024a443c445fcd9ea8c1b472316ef2fab101c38f1a523b0e449403fc9a57b66f', 'blockchain_verified', '12', '2025-09-19 16:14:31', '2025-09-19 16:14:38');

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
-- Table structure for table `institution`
--

CREATE TABLE `institution` (
  `id` int(11) NOT NULL,
  `institution_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `institution`
--

INSERT INTO `institution` (`id`, `institution_name`) VALUES
(1, 'WMSU'),
(99, 'bnhs');

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
-- Indexes for table `credential`
--
ALTER TABLE `credential`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `blockchain_id` (`blockchain_id`),
  ADD KEY `credential_type_id` (`credential_type_id`),
  ADD KEY `owner_id` (`owner_id`),
  ADD KEY `sender_id` (`sender_id`);

--
-- Indexes for table `credential_types`
--
ALTER TABLE `credential_types`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `institution`
--
ALTER TABLE `institution`
  ADD KEY `id` (`id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=105;

--
-- AUTO_INCREMENT for table `credential`
--
ALTER TABLE `credential`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `credential_types`
--
ALTER TABLE `credential_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `student`
--
ALTER TABLE `student`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=105;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `account`
--
ALTER TABLE `account`
  ADD CONSTRAINT `account_institution_fk` FOREIGN KEY (`institution_id`) REFERENCES `institution` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `credential`
--
ALTER TABLE `credential`
  ADD CONSTRAINT `credential_ibfk_1` FOREIGN KEY (`credential_type_id`) REFERENCES `credential_types` (`id`),
  ADD CONSTRAINT `credential_ibfk_2` FOREIGN KEY (`owner_id`) REFERENCES `account` (`id`),
  ADD CONSTRAINT `credential_ibfk_3` FOREIGN KEY (`sender_id`) REFERENCES `account` (`id`);

--
-- Constraints for table `institution`
--
ALTER TABLE `institution`
  ADD CONSTRAINT `institution_ibfk_1` FOREIGN KEY (`id`) REFERENCES `account` (`id`);

--
-- Constraints for table `student`
--
ALTER TABLE `student`
  ADD CONSTRAINT `student_ibfk_1` FOREIGN KEY (`id`) REFERENCES `account` (`id`),
  ADD CONSTRAINT `student_institution_fk` FOREIGN KEY (`institution_id`) REFERENCES `institution` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
