-- Database Initialization Script

CREATE DATABASE IF NOT EXISTS 5kdms_db;
USE 5kdms_db;

-- Users table (Students and Admins)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE DEFAULT NULL,
    admin_id VARCHAR(50) UNIQUE DEFAULT NULL,
    full_name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    gender ENUM('male', 'female') NOT NULL,
    department VARCHAR(100),
    academic_year INT,
    phone VARCHAR(20),
    role ENUM('student', 'dorm_manager', 'system_admin') DEFAULT 'student',
    status ENUM('not_applied', 'pending', 'verified', 'rejected', 'allocated') DEFAULT 'not_applied',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Phases table
CREATE TABLE IF NOT EXISTS phases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('rural', 'addis_ababa') NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'inactive',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category ENUM('rural', 'addis_ababa') NOT NULL,
    kebele_id_url VARCHAR(255),
    support_letter_url VARCHAR(255),
    medical_doc_url VARCHAR(255),
    status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    admin_remark TEXT,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL,
    block_name VARCHAR(50) NOT NULL,
    gender_type ENUM('male', 'female') NOT NULL,
    capacity INT NOT NULL,
    occupancy_count INT DEFAULT 0,
    status ENUM('empty', 'available', 'full') DEFAULT 'empty',
    UNIQUE KEY unique_room (block_name, room_number)
);

-- Allocations table
CREATE TABLE IF NOT EXISTS allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    allocation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_audience ENUM('all', 'rural', 'addis_ababa') DEFAULT 'all',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Initial Admin Account (Password: admin123)
-- Password hash for "admin123" - pre-generated bcrypt hash
-- Both 'admin' and 'sysadmin' IDs work with password 'admin123'
INSERT INTO users (admin_id, full_name, password, gender, role) 
VALUES ('admin', 'System Administrator', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'male', 'system_admin'),
       ('sysadmin', 'System Administrator', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'male', 'system_admin')
ON DUPLICATE KEY UPDATE full_name=full_name;
