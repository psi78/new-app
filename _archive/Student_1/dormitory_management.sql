-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: dormitory_management
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_registry`
--

DROP TABLE IF EXISTS `admin_registry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_registry` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('SYSTEM','DORM') NOT NULL,
  `perms` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_id` (`admin_id`),
  KEY `idx_admin_id` (`admin_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_registry`
--

LOCK TABLES `admin_registry` WRITE;
/*!40000 ALTER TABLE `admin_registry` DISABLE KEYS */;
INSERT INTO `admin_registry` VALUES (1,'sysadmin','admin123','System Administrator',NULL,'SYSTEM','[\"SYSTEM\", \"HOME\"]','2026-01-02 06:47:58');
/*!40000 ALTER TABLE `admin_registry` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `applications`
--

DROP TABLE IF EXISTS `applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` varchar(50) NOT NULL,
  `student_id` varchar(50) NOT NULL,
  `status` enum('Pending','Verified','Rejected','Approved') DEFAULT 'Pending',
  `doc_status` enum('Pending','Verified','Rejected') DEFAULT 'Pending',
  `residency_category` varchar(50) NOT NULL,
  `subcity` varchar(100) DEFAULT NULL,
  `woreda` varchar(50) DEFAULT NULL,
  `kebele_id_doc` varchar(255) DEFAULT NULL,
  `support_letter_doc` varchar(255) DEFAULT NULL,
  `medical_doc` varchar(255) DEFAULT NULL,
  `admin_remark` text,
  `dorm_allocation` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `application_id` (`application_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_status` (`status`),
  KEY `idx_application_id` (`application_id`),
  CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `applications`
--

LOCK TABLES `applications` WRITE;
/*!40000 ALTER TABLE `applications` DISABLE KEYS */;
INSERT INTO `applications` VALUES (1,'APP-1767361537668','STU_003','Pending','Pending','Rural',NULL,NULL,'/uploads/documents/doc-1767361537630-386737055.jpg','/uploads/documents/doc-1767361537639-313530245.pdf','/uploads/documents/doc-1767361537640-117739222.pdf','Waiting for document review',NULL,'2026-01-02 13:45:37','2026-01-02 13:45:37'),(2,'APP-1767370774427','STU_001','Pending','Pending','Addis Ababa','Bole','7','/uploads/documents/doc-1767370774392-603244943.jpg','/uploads/documents/doc-1767370774402-748528576.pdf','/uploads/documents/doc-1767370774412-726767257.pdf','Waiting for document review',NULL,'2026-01-02 16:19:34','2026-01-02 16:19:34'),(3,'APP-1767600318754','STU_004','Pending','Pending','Addis Ababa','Akaky Kaliti','12','/uploads/documents/doc-1767600318749-252759630.png','/uploads/documents/doc-1767600318750-747275272.png',NULL,'Waiting for document review',NULL,'2026-01-05 08:05:18','2026-01-05 08:05:18');
/*!40000 ALTER TABLE `applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phases`
--

DROP TABLE IF EXISTS `phases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(100) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Inactive',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phases`
--

LOCK TABLES `phases` WRITE;
/*!40000 ALTER TABLE `phases` DISABLE KEYS */;
/*!40000 ALTER TABLE `phases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `public_announcements`
--

DROP TABLE IF EXISTS `public_announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `public_announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `text` text NOT NULL,
  `date` varchar(50) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `public_announcements`
--

LOCK TABLES `public_announcements` WRITE;
/*!40000 ALTER TABLE `public_announcements` DISABLE KEYS */;
/*!40000 ALTER TABLE `public_announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_accounts`
--

DROP TABLE IF EXISTS `student_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `gender` enum('Male','Female') NOT NULL,
  `academic_year` int NOT NULL,
  `department` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`),
  KEY `idx_student_id` (`student_id`),
  CONSTRAINT `student_accounts_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_accounts`
--

LOCK TABLES `student_accounts` WRITE;
/*!40000 ALTER TABLE `student_accounts` DISABLE KEYS */;
INSERT INTO `student_accounts` VALUES (1,'STU_001','password123','Dawit Alemu','Female',2,'Mechanical E.','+251 9XX XXX XXX','2026-01-02 06:47:58'),(3,'STU_003','qwerty123','Afreha','Female',5,'Biomedical E.','+251917772656','2026-01-02 13:40:39'),(4,'STU_004','qwerty','Hasu','Female',1,'Electrical E.','+251917772656','2026-01-02 16:33:32'),(5,'UGR/9735/16','asdfgh','MUFARIHAT TADESSE','Female',3,'Software E.','+251917772656','2026-01-02 16:43:48'),(6,'UGR/0001/16','pass123','Joy','Male',1,'Civil E.','+251917772656','2026-01-03 22:44:40'),(7,'UGR/8769/17','chalaabebe','Chala Abebe','Male',2,'Software E.','+251945678389','2026-01-05 13:18:33'),(8,'UGR/3456/14','@almazdemissie','Almaz Demissie','Female',4,'Civil E.','+251912345678','2026-01-05 13:19:59'),(9,'UGR/0987/13','@abdella123','Abdellah Bekele','Male',5,'Mechanical E.','+251934567890','2026-01-05 13:21:24');
/*!40000 ALTER TABLE `student_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` varchar(50) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `gender` enum('Male','Female') NOT NULL,
  `department` varchar(100) NOT NULL,
  `academic_year` int NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `residence_category` varchar(50) DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`),
  KEY `idx_student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,'STU_001','Dawit Alemu','Female','Chemical E.',2,'+251 9XX XXX XXX','Rural ',NULL,'2026-01-02 06:47:58','2026-01-02 17:12:12'),(3,'STU_003','Afreha','Female','Biomedical E.',5,'+251917772656','AA ',NULL,'2026-01-02 13:40:39','2026-01-02 17:31:59'),(4,'STU_004','Hasu','Female','Electrical E.',1,'+251917772656','Rural ',NULL,'2026-01-02 16:33:32','2026-01-05 08:04:42'),(5,'UGR/9735/16','MUFARIHAT TADESSE','Female','Software E.',4,'+251917772656','AA ',NULL,'2026-01-02 16:43:48','2026-01-02 17:31:35'),(6,'UGR/0001/16','Joy','Male','Civil E.',1,'+251917772656','',NULL,'2026-01-03 22:44:40','2026-01-03 22:44:40'),(7,'UGR/8769/17','Chala Abebe','Male','Software E.',2,'+251945678389','',NULL,'2026-01-05 13:18:33','2026-01-05 13:18:33'),(8,'UGR/3456/14','Almaz Demissie','Female','Civil E.',4,'+251912345678','',NULL,'2026-01-05 13:19:59','2026-01-05 13:19:59'),(9,'UGR/0987/13','Abdellah Bekele','Male','Mechanical E.',5,'+251934567890','',NULL,'2026-01-05 13:21:24','2026-01-05 13:21:24');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-05 16:22:54
