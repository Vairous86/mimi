-- MySQL Database Schema for Mimi Educational Academy
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS mimi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mimi_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(50) PRIMARY KEY,
    passwordHash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'assistant') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Academic Years Table
CREATE TABLE IF NOT EXISTS years (
    year VARCHAR(10) PRIMARY KEY
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Students Table
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    guardianPhone VARCHAR(20),
    grade INT NOT NULL, -- 1, 2, or 3
    year VARCHAR(10) NOT NULL,
    isSuspended TINYINT(1) DEFAULT 0,
    subscriptionFee INT DEFAULT 150,
    FOREIGN KEY (year) REFERENCES years(year) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    studentId VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'excused') NOT NULL,
    notes TEXT,
    term ENUM('1', '2') NOT NULL,
    UNIQUE KEY unique_student_date (studentId, date),
    FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Payments Table (Monthly Subscriptions)
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    studentId VARCHAR(50) NOT NULL,
    month VARCHAR(50) NOT NULL,
    status ENUM('paid', 'unpaid') NOT NULL,
    amount INT NOT NULL,
    paymentDate DATETIME NULL,
    recordedBy VARCHAR(50) NULL,
    confirmed TINYINT(1) DEFAULT 0,
    term ENUM('1', '2') NOT NULL,
    UNIQUE KEY unique_student_month_term (studentId, month, term),
    FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (recordedBy) REFERENCES users(username) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Materials Table (Curriculum Booklets/Books)
CREATE TABLE IF NOT EXISTS materials (
    id VARCHAR(50) PRIMARY KEY, -- Custom ID generated from client (e.g. mat-123456)
    studentId VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    status ENUM('paid', 'unpaid') NOT NULL,
    price INT NOT NULL,
    paymentDate DATETIME NULL,
    recordedBy VARCHAR(50) NULL,
    confirmed TINYINT(1) DEFAULT 0,
    term ENUM('1', '2') NOT NULL,
    FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (recordedBy) REFERENCES users(username) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Exams Table (Exam Definitions)
CREATE TABLE IF NOT EXISTS exams (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    grade INT NOT NULL,
    maxScore INT NOT NULL,
    date DATE NOT NULL,
    year VARCHAR(10) NOT NULL,
    term ENUM('1', '2') NOT NULL,
    FOREIGN KEY (year) REFERENCES years(year) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Exam Scores Table (Student Marks)
CREATE TABLE IF NOT EXISTS exam_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    studentId VARCHAR(50) NOT NULL,
    examId VARCHAR(50) NOT NULL,
    score INT NOT NULL,
    UNIQUE KEY unique_student_exam (studentId, examId),
    FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (examId) REFERENCES exams(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Financial Logs Table (Transactions awaiting validation)
CREATE TABLE IF NOT EXISTS financial_logs (
    id VARCHAR(50) PRIMARY KEY,
    studentId VARCHAR(50) NULL,
    studentName VARCHAR(100) NOT NULL,
    type ENUM('subscription', 'material') NOT NULL,
    itemName VARCHAR(100) NOT NULL,
    amount INT NOT NULL,
    recordedBy VARCHAR(50) NOT NULL,
    recordedAt DATETIME NOT NULL,
    status ENUM('pending', 'received') NOT NULL,
    receivedAt DATETIME NULL,
    FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- Initial Data Seeding
-- ==========================================

-- Seed Initial Users (Plain text hashes for simplicity, as in mock setup)
INSERT INTO users (username, passwordHash, name, role) VALUES 
('mimi', 'mimi123', 'مستر ميمي', 'admin'),
('assistant', 'assistant123', 'أ. أحمد (المساعد)', 'assistant')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Seed Initial Years
INSERT INTO years (year) VALUES 
('2026'), 
('2027')
ON DUPLICATE KEY UPDATE year=VALUES(year);
