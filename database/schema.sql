-- 5K Dormitory Management System Database Schema
-- Create database
CREATE DATABASE IF NOT EXISTS dormitory_management;
USE dormitory_management;

-- Students table (profile information)
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    gender ENUM('Male', 'Female') NOT NULL,
    department VARCHAR(100) NOT NULL,
    academic_year INT NOT NULL,
    phone VARCHAR(20),
    residence_category VARCHAR(50),
    profile_picture VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id)
);

-- Student accounts table (login credentials)
CREATE TABLE IF NOT EXISTS student_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    gender ENUM('Male', 'Female') NOT NULL,
    academic_year INT NOT NULL,
    department VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id)
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id VARCHAR(50) UNIQUE NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    status ENUM('Pending', 'Verified', 'Rejected', 'Approved') DEFAULT 'Pending',
    doc_status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
    residency_category VARCHAR(50) NOT NULL,
    subcity VARCHAR(100),
    woreda VARCHAR(50),
    kebele_id_doc VARCHAR(255),
    support_letter_doc VARCHAR(255),
    medical_doc VARCHAR(255),
    admin_remark TEXT,
    dorm_allocation JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    INDEX idx_application_id (application_id)
);

-- Admin registry table
CREATE TABLE IF NOT EXISTS admin_registry (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('SYSTEM', 'DORM') NOT NULL,
    perms JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_id (admin_id)
);

-- Public announcements table
CREATE TABLE IF NOT EXISTS public_announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text TEXT NOT NULL,
    date VARCHAR(50),
    type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (date)
);

-- Phases table
CREATE TABLE IF NOT EXISTS phases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Inactive',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status)
);

-- Insert default admin account
INSERT INTO admin_registry (admin_id, password, name, role, perms) 
VALUES ('sysadmin', 'admin123', 'System Administrator', 'SYSTEM', '["SYSTEM", "HOME"]')
ON DUPLICATE KEY UPDATE admin_id=admin_id;

-- Insert default student account (for testing)
INSERT INTO students (student_id, full_name, gender, department, academic_year, phone, residence_category)
VALUES ('STU_001', 'Dawit Alemu', 'Female', 'Mechanical E.', 2, '+251 9XX XXX XXX', 'Rural')
ON DUPLICATE KEY UPDATE student_id=student_id;

INSERT INTO student_accounts (student_id, password, full_name, gender, academic_year, department, phone)
VALUES ('STU_001', 'password123', 'Dawit Alemu', 'Female', 2, 'Mechanical E.', '+251 9XX XXX XXX')
ON DUPLICATE KEY UPDATE student_id=student_id;
