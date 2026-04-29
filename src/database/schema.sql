-- ================================================
-- HRM SYSTEM - ENHANCED SCHEMA WITH SCD TYPE 2
-- Employee-Centric Design with Full History Tracking
-- ================================================

-- Create database
CREATE DATABASE IF NOT EXISTS hrm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE hrm_db;

-- ================================================
-- DROP EXISTING TABLES (in reverse dependency order)
-- ================================================
DROP TABLE IF EXISTS employee_documents;
DROP TABLE IF EXISTS documents_master;
DROP TABLE IF EXISTS employee_experience;
DROP TABLE IF EXISTS employee_education;
DROP TABLE IF EXISTS employee_bank_details;
DROP TABLE IF EXISTS employee_job_details;
DROP TABLE IF EXISTS employee_addresses;
DROP TABLE IF EXISTS employee_emergency_contacts;
DROP TABLE IF EXISTS employee_contact_details;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS password_history;
DROP TABLE IF EXISTS login_attempts;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS designations_master;
DROP TABLE IF EXISTS locations_master;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS course_master;
DROP TABLE IF EXISTS education_master;
DROP TABLE IF EXISTS employees;

-- ================================================
-- 1. ROLES TABLE (Master Data)
-- ================================================
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    permissions JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 2. EMPLOYEES TABLE (Core Identity - NO Auth)
-- ================================================
CREATE TABLE employees (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(10),
    
    profile_photo VARCHAR(255) NULL,
    
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    
    INDEX idx_employee_code (employee_code),
    INDEX idx_first_name (first_name),
    INDEX idx_last_name (last_name),
    INDEX idx_dob (date_of_birth),
    INDEX idx_gender (gender),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 3. USERS TABLE (Authentication - Linked to Employees)
-- ================================================
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT UNIQUE,
    
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mobile VARCHAR(20) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    account_status VARCHAR(20) DEFAULT 'active',
    profile_photo VARCHAR(255) NULL,
    password_changed_at DATETIME NULL,
    last_login DATETIME NULL,
    
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_mobile (mobile),
    INDEX idx_employee_id (employee_id),
    INDEX idx_role_id (role_id),
    INDEX idx_account_status (account_status),
    INDEX idx_profile_photo (profile_photo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 4. LOGIN ATTEMPTS TABLE
-- ================================================
CREATE TABLE login_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    attempts INT DEFAULT 0,
    last_attempt_time DATETIME NULL,
    blocked_until DATETIME NULL,
    UNIQUE KEY unique_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_blocked_until (blocked_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 5. PASSWORD HISTORY TABLE
-- ================================================
CREATE TABLE password_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 6. PASSWORD RESET TOKENS TABLE
-- ================================================
CREATE TABLE password_reset_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NULL,
    otp VARCHAR(10) NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_otp (otp),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 7. REFRESH TOKENS TABLE
-- ================================================
CREATE TABLE refresh_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 8. DEPARTMENTS TABLE (Master Data)
-- ================================================
CREATE TABLE departments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    department_code VARCHAR(20) NOT NULL UNIQUE,
    parent_department_id BIGINT NULL,
    description TEXT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_department_id) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_department_name (department_name),
    INDEX idx_department_code (department_code),
    INDEX idx_parent_department_id (parent_department_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 9. DESIGNATIONS MASTER TABLE (Master Data)
-- ================================================
CREATE TABLE designations_master (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    designation_name VARCHAR(100) NOT NULL,
    designation_code VARCHAR(20) NOT NULL UNIQUE,
    department_id BIGINT NULL,
    grade_level INT NULL,
    description TEXT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_designation_name (designation_name),
    INDEX idx_designation_code (designation_code),
    INDEX idx_department_id (department_id),
    INDEX idx_grade_level (grade_level),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 10. LOCATIONS MASTER TABLE (Master Data)
-- ================================================
CREATE TABLE locations_master (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    location_name VARCHAR(100) NOT NULL,
    location_code VARCHAR(20) NOT NULL UNIQUE,
    parent_location_id BIGINT NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(20) NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(100) NULL,
    is_headquarters BOOLEAN DEFAULT FALSE,
    description TEXT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_location_id) REFERENCES locations_master(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_location_name (location_name),
    INDEX idx_location_code (location_code),
    INDEX idx_parent_location_id (parent_location_id),
    INDEX idx_city (city),
    INDEX idx_state (state),
    INDEX idx_status (status),
    INDEX idx_is_headquarters (is_headquarters)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 11. EDUCATION MASTER TABLE (Global Reference)
-- ================================================
CREATE TABLE education_master (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    education_name VARCHAR(100) NOT NULL UNIQUE,
    education_code VARCHAR(20) NOT NULL UNIQUE,
    level VARCHAR(20) NOT NULL,
    description TEXT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_education_name (education_name),
    INDEX idx_education_code (education_code),
    INDEX idx_level (level),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 12. COURSE MASTER TABLE (Global Reference)
-- ================================================
CREATE TABLE course_master (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_name VARCHAR(100) NOT NULL UNIQUE,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_course_name (course_name),
    INDEX idx_course_code (course_code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 13. EDUCATION-COURSE MAPPING TABLE
-- ================================================
CREATE TABLE education_course_map (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    education_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    created_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (education_id) REFERENCES education_master(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course_master(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE KEY uk_education_course (education_id, course_id),
    INDEX idx_education_id (education_id),
    INDEX idx_course_id (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 14. DOCUMENTS MASTER TABLE (Global Reference)
-- ================================================
CREATE TABLE documents_master (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    document_name VARCHAR(100) NOT NULL UNIQUE,
    document_code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT NULL,
    is_mandatory BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_document_name (document_name),
    INDEX idx_document_code (document_code),
    INDEX idx_is_mandatory (is_mandatory),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 15. AUDIT LOGS TABLE (CRITICAL - ISO/SOC2 Ready)
-- ================================================
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NULL,
    action VARCHAR(20) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_id BIGINT NULL,
    old_value JSON NULL,
    new_value JSON NULL,
    ip_address VARCHAR(50) NULL,
    user_agent TEXT NULL,
    request_id VARCHAR(36) NULL,
    description TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_name, entity_id),
    INDEX idx_created_at (created_at),
    INDEX idx_request_id (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 16. EMPLOYEE CONTACT DETAILS (1:1 with Employees)
-- ================================================
CREATE TABLE employee_contact_details (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    
    email VARCHAR(100) UNIQUE,
    mobile VARCHAR(20) UNIQUE,
    alternate_mobile VARCHAR(20),
    personal_email VARCHAR(100),
    linkedin_url VARCHAR(255),
    
    emergency_contact_name VARCHAR(100),
    emergency_contact_relation VARCHAR(50),
    emergency_contact_mobile VARCHAR(20),
    
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    UNIQUE KEY uk_employee_id (employee_id),
    INDEX idx_email (email),
    INDEX idx_mobile (mobile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 17. EMPLOYEE ADDRESSES (SCD TYPE 2 - History)
-- ================================================
CREATE TABLE employee_addresses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    
    type VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(10),
    is_current BOOLEAN DEFAULT TRUE,
    
    effective_start_date DATETIME NOT NULL,
    effective_end_date DATETIME NULL,
    
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    INDEX idx_employee_id (employee_id),
    INDEX idx_type (type),
    INDEX idx_is_current (is_current),
    INDEX idx_effective_start (effective_start_date),
    INDEX idx_effective_end (effective_end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 18. EMPLOYEE EMERGENCY CONTACTS (1:N)
-- ================================================
CREATE TABLE employee_emergency_contacts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    relation VARCHAR(50),
    mobile VARCHAR(20) NOT NULL,
    alternate_mobile VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    priority_order INT DEFAULT 1,
    
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    INDEX idx_employee_id (employee_id),
    INDEX idx_priority_order (priority_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 19. EMPLOYEE JOB DETAILS (SCD TYPE 2 - CORE TABLE)
-- ================================================
CREATE TABLE employee_job_details (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    
    department_id BIGINT,
    designation_id BIGINT,
    location_id BIGINT,
    role_id INT,
    reporting_manager_id BIGINT,
    
    employment_type VARCHAR(20) DEFAULT 'full_time',
    employment_status VARCHAR(20) DEFAULT 'active',
    
    date_of_joining DATE,
    confirmation_date DATE,
    termination_date DATE,
    
    is_current BOOLEAN DEFAULT TRUE,
    effective_start_date DATETIME NOT NULL,
    effective_end_date DATETIME NULL,
    
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (designation_id) REFERENCES designations_master(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations_master(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (reporting_manager_id) REFERENCES employees(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    INDEX idx_employee_id (employee_id),
    INDEX idx_department_id (department_id),
    INDEX idx_designation_id (designation_id),
    INDEX idx_location_id (location_id),
    INDEX idx_role_id (role_id),
    INDEX idx_reporting_manager_id (reporting_manager_id),
    INDEX idx_employment_status (employment_status),
    INDEX idx_is_current (is_current),
    INDEX idx_effective_start (effective_start_date),
    INDEX idx_effective_end (effective_end_date),
    INDEX idx_date_of_joining (date_of_joining)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 20. EMPLOYEE BANK DETAILS (SCD TYPE 2 - History)
-- ================================================
CREATE TABLE employee_bank_details (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    
    account_holder_name VARCHAR(100),
    account_number VARCHAR(50),
    ifsc_code VARCHAR(20),
    bank_name VARCHAR(100),
    branch VARCHAR(100),
    account_type VARCHAR(20) DEFAULT 'savings',
    
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by BIGINT NULL,
    verified_at DATETIME NULL,
    
    is_current BOOLEAN DEFAULT TRUE,
    effective_start_date DATETIME NOT NULL,
    effective_end_date DATETIME NULL,
    
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    INDEX idx_employee_id (employee_id),
    INDEX idx_is_primary (is_primary),
    INDEX idx_is_current (is_current),
    INDEX idx_effective_start (effective_start_date),
    INDEX idx_effective_end (effective_end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 21. EMPLOYEE EDUCATION (1:N - Always Append)
-- ================================================
CREATE TABLE employee_education (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    
    education_id BIGINT,
    course_id BIGINT,
    institution_name VARCHAR(255) NOT NULL,
    university_name VARCHAR(255),
    
    start_year YEAR,
    end_year YEAR,
    percentage DECIMAL(5,2),
    cgpa DECIMAL(4,2),
    grade VARCHAR(10),
    
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by BIGINT NULL,
    verified_at DATETIME NULL,
    
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (education_id) REFERENCES education_master(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course_master(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    INDEX idx_employee_id (employee_id),
    INDEX idx_education_id (education_id),
    INDEX idx_course_id (course_id),
    INDEX idx_institution_name (institution_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 22. EMPLOYEE EXPERIENCE (1:N - Always Append)
-- ================================================
CREATE TABLE employee_experience (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    
    company_name VARCHAR(255) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    
    reason_for_leaving TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by BIGINT NULL,
    verified_at DATETIME NULL,
    
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    INDEX idx_employee_id (employee_id),
    INDEX idx_company_name (company_name),
    INDEX idx_is_current (is_current),
    INDEX idx_start_date (start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 23. EMPLOYEE DOCUMENTS (1:N - Always Append)
-- ================================================
CREATE TABLE employee_documents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    document_id BIGINT NOT NULL,
    
    file_path VARCHAR(255) NOT NULL,
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    file_size BIGINT,
    
    verified_status VARCHAR(20) DEFAULT 'pending',
    rejection_reason TEXT,
    
    uploaded_by BIGINT NULL,
    verified_by BIGINT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified_at DATETIME NULL,
    expires_at DATETIME NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents_master(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    INDEX idx_employee_id (employee_id),
    INDEX idx_document_id (document_id),
    INDEX idx_verified_status (verified_status),
    INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- INSERT DEFAULT ROLES
-- ================================================
INSERT INTO roles (name, permissions) VALUES
('Super Admin', '["all"]'),
('Admin', '["users.read", "users.write", "users.update", "users.delete", "roles.read", "employees.read", "employees.write", "employees.update", "employees.delete"]'),
('Manager', '["users.read", "employees.read", "employees.write", "employees.update"]'),
('HR Manager', '["employees.read", "employees.write", "employees.update", "employees.delete", "reports.read"]'),
('Employee', '["employees.read"]');

-- ================================================
-- INSERT DEFAULT DEPARTMENTS
-- ================================================
INSERT INTO departments (department_name, department_code, description, status) VALUES
('Engineering', 'ENG', 'Software Engineering and Development', 'active'),
('QA / Testing', 'QA', 'Quality Assurance and Testing', 'active'),
('DevOps', 'DEVOPS', 'Development Operations and Infrastructure', 'active'),
('UI/UX Design', 'UIUX', 'User Interface and Experience Design', 'active'),
('Project Management', 'PM', 'Project Planning and Management', 'active'),
('Sales', 'SALES', 'Sales and Business Development', 'active'),
('Business Development', 'BD', 'Business Growth and Partnerships', 'active'),
('Customer Support', 'SUPPORT', 'Customer Service and Support', 'active'),
('HR', 'HR', 'Human Resources Management', 'active'),
('Finance', 'FIN', 'Finance and Accounting', 'active'),
('Marketing', 'MKT', 'Marketing and Communications', 'active'),
('IT Support', 'ITSUPP', 'Internal IT Support', 'active'),
('Administration', 'ADMIN', 'Administrative Services', 'active');

-- ================================================
-- INSERT DEFAULT LOCATIONS
-- ================================================
INSERT INTO locations_master (location_name, location_code, address, city, state, country, is_headquarters, status) VALUES
('Headquarters - Chennai', 'HO-CHEN', '123 Tech Park, IT Highway', 'Chennai', 'Tamil Nadu', 'India', TRUE, 'active'),
('Branch - Bangalore', 'BR-BANG', '456 Tech Hub, Electronic City', 'Bangalore', 'Karnataka', 'India', FALSE, 'active'),
('Branch - Mumbai', 'BR-MUMB', '789 Business Park, Andheri', 'Mumbai', 'Maharashtra', 'India', FALSE, 'active');

-- ================================================
-- INSERT DEFAULT DESIGNATIONS
-- ================================================
INSERT INTO designations_master (designation_name, designation_code, grade_level, status) VALUES
('Trainee', 'TRAIN', 1, 'active'),
('Junior Software Engineer', 'JSE', 2, 'active'),
('Software Engineer', 'SE', 3, 'active'),
('Senior Software Engineer', 'SSE', 4, 'active'),
('Team Lead', 'TL', 5, 'active'),
('Technical Lead', 'TECH-L', 6, 'active'),
('Technical Architect', 'ARCH', 7, 'active'),
('Project Manager', 'PM', 6, 'active'),
('Senior Project Manager', 'SPM', 7, 'active'),
('QA Engineer', 'QA-ENG', 3, 'active'),
('Senior QA Engineer', 'SQA-ENG', 4, 'active'),
('HR Executive', 'HR-EXEC', 3, 'active'),
('HR Manager', 'HR-MGR', 6, 'active'),
('Admin Manager', 'ADM-MGR', 6, 'active'),
('CEO', 'CEO', 10, 'active'),
('CTO', 'CTO', 10, 'active'),
('COO', 'COO', 10, 'active'),
('CFO', 'CFO', 10, 'active');

-- ================================================
-- INSERT DEFAULT EDUCATION
-- ================================================
INSERT INTO education_master (education_name, education_code, level, description) VALUES
('10th Standard', 'SSC', 'School', 'Secondary School Certificate'),
('12th Standard', 'HSC', 'School', 'Higher Secondary Certificate'),
('Bachelor of Arts', 'BA', 'UG', 'Undergraduate Arts Degree'),
('Bachelor of Science', 'BSc', 'UG', 'Undergraduate Science Degree'),
('Bachelor of Commerce', 'BCOM', 'UG', 'Undergraduate Commerce Degree'),
('Bachelor of Computer Applications', 'BCA', 'UG', 'Undergraduate Computer Applications'),
('Bachelor of Engineering', 'BE', 'UG', 'Undergraduate Engineering Degree'),
('Master of Arts', 'MA', 'PG', 'Postgraduate Arts Degree'),
('Master of Science', 'MSc', 'PG', 'Postgraduate Science Degree'),
('Master of Commerce', 'MCOM', 'PG', 'Postgraduate Commerce Degree'),
('Master of Computer Applications', 'MCA', 'PG', 'Postgraduate Computer Applications'),
('Master of Business Administration', 'MBA', 'PG', 'Postgraduate Business Administration'),
('Master of Technology', 'MTech', 'PG', 'Postgraduate Technology Degree'),
('Doctor of Philosophy', 'PhD', 'Doctorate', 'Doctoral Degree'),
('Post Doctorate', 'PostDoc', 'Doctorate', 'Post Doctoral Research'),
('Certification', 'CERT', 'Certification', 'Professional Certification');

-- ================================================
-- INSERT DEFAULT COURSES
-- ================================================
INSERT INTO course_master (course_name, course_code, description) VALUES
('Computer Science', 'CS', 'Computer Science Engineering'),
('Information Technology', 'IT', 'Information Technology Engineering'),
('Electronics and Communication', 'EC', 'Electronics and Communication Engineering'),
('Mechanical Engineering', 'ME', 'Mechanical Engineering'),
('Civil Engineering', 'CE', 'Civil Engineering'),
('Electrical Engineering', 'EE', 'Electrical Engineering'),
('Chemical Engineering', 'CHE', 'Chemical Engineering'),
('Biotechnology', 'BT', 'Biotechnology Engineering'),
('Mathematics', 'MATH', 'Mathematics Major'),
('Physics', 'PHY', 'Physics Major'),
('Chemistry', 'CHEM', 'Chemistry Major'),
('Commerce', 'COMM', 'Commerce Major'),
('Business Administration', 'BBA', 'Business Administration'),
('Hotel Management', 'HM', 'Hotel Management'),
('Mass Communication', 'MC', 'Mass Communication'),
('Fashion Design', 'FD', 'Fashion Design'),
('Interior Design', 'ID', 'Interior Design'),
('Animation and Multimedia', 'AM', 'Animation and Multimedia');

-- ================================================
-- INSERT DEFAULT DOCUMENTS MASTER
-- ================================================
INSERT INTO documents_master (document_name, document_code, description, is_mandatory) VALUES
('Aadhaar Card', 'ADHR', 'Government-issued identity proof', TRUE),
('Pan Card', 'PAN', 'Permanent Account Number card', TRUE),
('Driving License', 'DL', 'Valid driving license', FALSE),
('Passport', 'PASS', 'Valid passport', TRUE),
('Voter ID', 'VOTER', 'Electoral photo identity card', FALSE),
('Ration Card', 'RATION', 'Food grain ration card', FALSE),
('10th Certificate', 'SSC-CERT', '10th standard mark sheet/certificate', TRUE),
('12th Certificate', 'HSC-CERT', '12th standard mark sheet/certificate', TRUE),
('Graduation Certificate', 'GRAD-CERT', 'Graduation degree certificate', TRUE),
('Post Graduation Certificate', 'PG-CERT', 'Post graduation degree certificate', FALSE),
('Experience Letter', 'EXP-LETTER', 'Previous employment experience letter', FALSE),
('Salary Slips', 'SAL-SLIP', 'Recent salary slips', FALSE),
('Bank Passbook', 'BANK-PSBK', 'Bank passbook copy', TRUE),
('PF Account', 'PF-ACCT', 'Provident Fund account details', FALSE),
('ESIC Card', 'ESIC', 'Employee State Insurance Corporation card', FALSE),
('Blood Group Report', 'BLOOD-GRP', 'Blood group identification report', TRUE),
('Medical Fitness Certificate', 'MED-FIT', 'Medical fitness certificate', TRUE),
('Photo', 'PHOTO', 'Recent passport size photographs', TRUE),
('NOC from Previous Employer', 'NOC', 'No Objection Certificate', FALSE),
('Background Verification', 'BGV', 'Background verification report', TRUE);

-- ================================================
-- PROCEDURES FOR SCD TYPE 2 OPERATIONS
-- ================================================

-- Procedure: Update Employee Job Details (SCD Type 2)
DELIMITER //
CREATE PROCEDURE sp_update_employee_job_details(
    IN p_employee_id BIGINT,
    IN p_department_id BIGINT,
    IN p_designation_id BIGINT,
    IN p_location_id BIGINT,
    IN p_role_id INT,
    IN p_reporting_manager_id BIGINT,
    IN p_employment_type VARCHAR(20),
    IN p_effective_start_date DATETIME,
    IN p_created_by BIGINT
)
BEGIN
    DECLARE v_old_id BIGINT;
    
    START TRANSACTION;
    
    SELECT id INTO v_old_id FROM employee_job_details 
    WHERE employee_id = p_employee_id AND is_current = TRUE
    FOR UPDATE;
    
    IF v_old_id IS NOT NULL THEN
        UPDATE employee_job_details
        SET is_current = FALSE,
            effective_end_date = p_effective_start_date
        WHERE id = v_old_id;
    END IF;
    
    INSERT INTO employee_job_details (
        employee_id, department_id, designation_id, location_id, role_id,
        reporting_manager_id, employment_type, employment_status, is_current,
        effective_start_date, created_by, created_at
    ) VALUES (
        p_employee_id, p_department_id, p_designation_id, p_location_id, p_role_id,
        p_reporting_manager_id, COALESCE(p_employment_type, 'full_time'), 'active', TRUE,
        p_effective_start_date, p_created_by, NOW()
    );
    
    COMMIT;
    
    SELECT LAST_INSERT_ID() AS new_id;
END //
DELIMITER ;

-- Procedure: Update Employee Address (SCD Type 2)
DELIMITER //
CREATE PROCEDURE sp_update_employee_address(
    IN p_employee_id BIGINT,
    IN p_type VARCHAR(20),
    IN p_address_line1 VARCHAR(255),
    IN p_address_line2 VARCHAR(255),
    IN p_city VARCHAR(100),
    IN p_state VARCHAR(100),
    IN p_country VARCHAR(100),
    IN p_pincode VARCHAR(10),
    IN p_effective_start_date DATETIME,
    IN p_created_by BIGINT
)
BEGIN
    DECLARE v_old_id BIGINT;
    
    START TRANSACTION;
    
    SELECT id INTO v_old_id FROM employee_addresses 
    WHERE employee_id = p_employee_id AND type = p_type AND is_current = TRUE
    FOR UPDATE;
    
    IF v_old_id IS NOT NULL THEN
        UPDATE employee_addresses
        SET is_current = FALSE,
            effective_end_date = p_effective_start_date
        WHERE id = v_old_id;
    END IF;
    
    INSERT INTO employee_addresses (
        employee_id, type, address_line1, address_line2, city, state,
        country, pincode, is_current, effective_start_date, created_by, created_at
    ) VALUES (
        p_employee_id, p_type, p_address_line1, p_address_line2, p_city, p_state,
        COALESCE(p_country, 'India'), p_pincode, TRUE, p_effective_start_date, p_created_by, NOW()
    );
    
    COMMIT;
    
    SELECT LAST_INSERT_ID() AS new_id;
END //
DELIMITER ;

-- Procedure: Update Employee Bank Details (SCD Type 2)
DELIMITER //
CREATE PROCEDURE sp_update_employee_bank_details(
    IN p_employee_id BIGINT,
    IN p_account_holder_name VARCHAR(100),
    IN p_account_number VARCHAR(50),
    IN p_ifsc_code VARCHAR(20),
    IN p_bank_name VARCHAR(100),
    IN p_branch VARCHAR(100),
    IN p_account_type VARCHAR(20),
    IN p_is_primary BOOLEAN,
    IN p_effective_start_date DATETIME,
    IN p_created_by BIGINT
)
BEGIN
    DECLARE v_old_id BIGINT;
    
    START TRANSACTION;
    
    IF p_is_primary = TRUE THEN
        UPDATE employee_bank_details
        SET is_primary = FALSE, is_current = FALSE, effective_end_date = p_effective_start_date
        WHERE employee_id = p_employee_id AND is_primary = TRUE;
    END IF;
    
    SELECT id INTO v_old_id FROM employee_bank_details 
    WHERE employee_id = p_employee_id AND is_current = TRUE
    FOR UPDATE;
    
    IF v_old_id IS NOT NULL THEN
        UPDATE employee_bank_details
        SET is_current = FALSE,
            effective_end_date = p_effective_start_date
        WHERE id = v_old_id;
    END IF;
    
    INSERT INTO employee_bank_details (
        employee_id, account_holder_name, account_number, ifsc_code, bank_name, branch,
        account_type, is_primary, is_current, effective_start_date, created_by, created_at
    ) VALUES (
        p_employee_id, p_account_holder_name, p_account_number, p_ifsc_code, p_bank_name, p_branch,
        COALESCE(p_account_type, 'savings'), COALESCE(p_is_primary, FALSE), TRUE, p_effective_start_date, p_created_by, NOW()
    );
    
    COMMIT;
    
    SELECT LAST_INSERT_ID() AS new_id;
END //
DELIMITER ;

-- ================================================
-- VIEWS FOR COMMON QUERIES
-- ================================================

-- View: Current Employee with All Details
CREATE VIEW v_current_employees AS
SELECT 
    e.id,
    e.employee_code,
    e.first_name,
    e.last_name,
    e.date_of_birth,
    e.gender,
    e.profile_photo,
    e.created_at,
    CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) AS full_name,
    cd.email,
    cd.mobile,
    jd.department_id,
    d.department_name,
    jd.designation_id,
    dm.designation_name,
    jd.location_id,
    lm.location_name,
    jd.role_id,
    r.name AS role_name,
    jd.reporting_manager_id,
    CONCAT(me.first_name, ' ', COALESCE(me.last_name, '')) AS manager_name,
    jd.employment_type,
    jd.employment_status,
    jd.date_of_joining,
    u.username AS created_by_username,
    u.account_status AS user_status
FROM employees e
LEFT JOIN employee_contact_details cd ON e.id = cd.employee_id
LEFT JOIN employee_job_details jd ON e.id = jd.employee_id AND jd.is_current = TRUE
LEFT JOIN departments d ON jd.department_id = d.id
LEFT JOIN designations_master dm ON jd.designation_id = dm.id
LEFT JOIN locations_master lm ON jd.location_id = lm.id
LEFT JOIN roles r ON jd.role_id = r.id
LEFT JOIN employees me ON jd.reporting_manager_id = me.id
LEFT JOIN users u ON e.id = u.employee_id
WHERE e.deleted_at IS NULL;

-- View: Employee Job History
CREATE VIEW v_employee_job_history AS
SELECT 
    jd.id,
    jd.employee_id,
    e.employee_code,
    CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) AS employee_name,
    jd.department_id,
    d.department_name,
    jd.designation_id,
    dm.designation_name,
    jd.location_id,
    lm.location_name,
    jd.employment_type,
    jd.employment_status,
    jd.is_current,
    jd.effective_start_date,
    jd.effective_end_date,
    jd.date_of_joining
FROM employee_job_details jd
JOIN employees e ON jd.employee_id = e.id
LEFT JOIN departments d ON jd.department_id = d.id
LEFT JOIN designations_master dm ON jd.designation_id = dm.id
LEFT JOIN locations_master lm ON jd.location_id = lm.id
WHERE e.deleted_at IS NULL
ORDER BY jd.employee_id, jd.effective_start_date DESC;

-- View: Employee Document Status
CREATE VIEW v_employee_document_status AS
SELECT 
    ed.id,
    ed.employee_id,
    e.employee_code,
    CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) AS employee_name,
    dm.document_name,
    dm.document_code,
    dm.is_mandatory,
    ed.verified_status,
    ed.uploaded_at,
    ed.expires_at,
    CASE 
        WHEN ed.expires_at IS NOT NULL AND ed.expires_at < NOW() THEN 'Expired'
        WHEN ed.verified_status = 'verified' THEN 'Valid'
        WHEN ed.verified_status = 'pending' THEN 'Pending Verification'
        WHEN ed.verified_status = 'rejected' THEN 'Rejected'
        ELSE 'Not Uploaded'
    END AS document_status
FROM documents_master dm
LEFT JOIN employee_documents ed ON dm.id = ed.document_id
LEFT JOIN employees e ON ed.employee_id = e.id
WHERE e.deleted_at IS NULL OR e.deleted_at IS NULL
ORDER BY dm.is_mandatory DESC, ed.employee_id, dm.document_name;
