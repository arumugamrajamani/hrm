-- ===============================================
-- HRM SYSTEM - ENHANCED SCHEMA WITH SCD TYPE 2
-- Employee-Centric Design with Full History Tracking
-- MERGED VERSION: Includes all migrations
-- ===============================================

-- Create database
CREATE DATABASE IF NOT EXISTS hrm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE hrm_db;

-- ===============================================
-- DROP EXISTING TABLES (in reverse dependency order)
-- ===============================================
DROP TABLE IF EXISTS employee_salary_components;
DROP TABLE IF EXISTS payslip_components;
DROP TABLE IF EXISTS payslips;
DROP TABLE IF EXISTS payroll_runs;
DROP TABLE IF EXISTS employee_salary_details;
DROP TABLE IF EXISTS salary_structure_components;
DROP TABLE IF EXISTS salary_structures;
DROP TABLE IF EXISTS salary_components;
DROP TABLE IF EXISTS bonus_records;
DROP TABLE IF EXISTS tax_configurations;
DROP TABLE IF EXISTS pf_configurations;
DROP TABLE IF EXISTS esi_configurations;
DROP TABLE IF EXISTS timesheets;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS leave_balances;
DROP TABLE IF EXISTS leave_types;
DROP TABLE IF EXISTS attendance_records;
DROP TABLE IF EXISTS holiday_calendar;
DROP TABLE IF EXISTS shifts;
DROP TABLE IF EXISTS employee_checklist_progress;
DROP TABLE IF EXISTS employee_onboarding;
DROP TABLE IF EXISTS checklist_items;
DROP TABLE IF EXISTS onboarding_checklist_templates;
DROP TABLE IF EXISTS probation_tracking;
DROP TABLE IF EXISTS employee_job_details;
DROP TABLE IF EXISTS employee_salary_history;
DROP TABLE IF EXISTS employee_transfers;
DROP TABLE IF EXISTS employee_promotions;
DROP TABLE IF EXISTS employee_documents;
DROP TABLE IF EXISTS documents_master;
DROP TABLE IF EXISTS employee_education;
DROP TABLE IF EXISTS employee_experience;
DROP TABLE IF EXISTS employee_bank_details;
DROP TABLE IF EXISTS employee_addresses;
DROP TABLE IF EXISTS employee_emergency_contacts;
DROP TABLE IF EXISTS employee_contact_details;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS password_history;
DROP TABLE IF EXISTS login_attempts;
DROP TABLE IF EXISTS user_totp_secrets;
DROP TABLE IF EXISTS api_keys;
DROP TABLE IF EXISTS webhook_deliveries;
DROP TABLE IF EXISTS webhooks;
DROP TABLE IF EXISTS webhook_endpoints;
DROP TABLE IF EXISTS feature_flags;
DROP TABLE IF EXISTS ip_blocklist;
DROP TABLE IF EXISTS tenants;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS designations_master;
DROP TABLE IF EXISTS locations_master;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS course_master;
DROP TABLE IF EXISTS education_master;
DROP TABLE IF EXISTS education_course_map;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS business_units;
DROP TABLE IF EXISTS grades_master;

-- ===============================================
-- 1. ROLES TABLE (Master Data)
-- ===============================================
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    permissions JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 2. EMPLOYEES TABLE (Core Identity - NO Auth)
-- ===============================================
CREATE TABLE employees (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_code VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50),
    gender ENUM('Male', 'Female', 'Other'),
    date_of_birth DATE,
    marital_status ENUM('Single', 'Married', 'Divorced', 'Widowed'),
    personal_email VARCHAR(100),
    mobile_number VARCHAR(15),
    emergency_contact_name VARCHAR(100),
    emergency_contact_number VARCHAR(15),
    blood_group VARCHAR(5),
    nationality VARCHAR(50) DEFAULT 'Indian',
    aadhaar_number VARCHAR(12),
    pan_number VARCHAR(10),
    passport_number VARCHAR(20),
    current_address TEXT,
    permanent_address TEXT,
    profile_photo VARCHAR(255),
    status ENUM('active', 'inactive', 'terminated', 'resigned') DEFAULT 'active',
    deleted_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_employee_code (employee_code),
    INDEX idx_status (status),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 3. USERS TABLE (Authentication only)
-- ===============================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    mobile VARCHAR(15),
    role_id INT NOT NULL,
    account_status VARCHAR(20) DEFAULT 'active',
    profile_photo VARCHAR(255) NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    password_changed_at DATETIME NULL,
    last_login DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_account_status (account_status),
    INDEX idx_profile_photo (profile_photo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 4. LOGIN ATTEMPTS TABLE
-- ===============================================
CREATE TABLE login_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    attempts INT DEFAULT 0,
    blocked_until DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_blocked_until (blocked_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 5. PASSWORD HISTORY TABLE
-- ===============================================
CREATE TABLE password_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 6. PASSWORD RESET TOKENS TABLE
-- ===============================================
CREATE TABLE password_reset_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_otp (otp),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 7. REFRESH TOKENS TABLE
-- ===============================================
CREATE TABLE refresh_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token(255)),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 8. AUDIT LOGS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NULL,
    old_value JSON NULL,
    new_value JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    request_id VARCHAR(36) NULL,
    description TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at),
    INDEX idx_request_id (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 9. MASTER DATA TABLES
-- ===============================================

-- 9a. LOCATIONS MASTER
CREATE TABLE locations_master (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    location_name VARCHAR(100) NOT NULL,
    location_code VARCHAR(20) NOT NULL UNIQUE,
    parent_location_id BIGINT NULL,
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'India',
    pincode VARCHAR(10),
    phone VARCHAR(15),
    email VARCHAR(100),
    is_headquarters BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_location_id) REFERENCES locations_master(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_location_code (location_code),
    INDEX idx_parent_location (parent_location_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9b. DEPARTMENTS
CREATE TABLE departments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(20) NOT NULL UNIQUE,
    parent_department_id BIGINT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    business_unit_id BIGINT NULL,
    FOREIGN KEY (parent_department_id) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_department_code (department_code),
    INDEX idx_parent_department (parent_department_id),
    INDEX idx_status (status),
    INDEX idx_dept_bu (business_unit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9c. DESIGNATIONS MASTER
CREATE TABLE designations_master (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    designation_name VARCHAR(100) NOT NULL,
    designation_code VARCHAR(20) NOT NULL UNIQUE,
    department_id BIGINT NULL,
    grade_level INT,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    business_unit_id BIGINT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_designation_code (designation_code),
    INDEX idx_department_id (department_id),
    INDEX idx_status (status),
    INDEX idx_desig_bu (business_unit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9d. COURSE MASTER
CREATE TABLE course_master (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_name VARCHAR(100) NOT NULL UNIQUE,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_course_code (course_code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9e. EDUCATION MASTER
CREATE TABLE education_master (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    education_name VARCHAR(100) NOT NULL UNIQUE,
    education_code VARCHAR(20) NOT NULL UNIQUE,
    level VARCHAR(20),
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_education_code (education_code),
    INDEX idx_level (level),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9f. EDUCATION-COURSE MAP
CREATE TABLE education_course_map (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    education_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (education_id) REFERENCES education_master(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course_master(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_edu_course (education_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 10. ENTERPRISE TABLES (Companies, Business Units, Grades)
-- ===============================================

-- 10a. COMPANIES
CREATE TABLE companies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(150) NOT NULL UNIQUE,
    company_code VARCHAR(20) NOT NULL UNIQUE,
    registration_number VARCHAR(50) NULL,
    tax_id VARCHAR(50) NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(20) NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(100) NULL,
    website VARCHAR(255) NULL,
    is_headquarters BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_company_name (company_name),
    INDEX idx_company_code (company_code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10b. BUSINESS UNITS
CREATE TABLE business_units (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    unit_name VARCHAR(100) NOT NULL,
    unit_code VARCHAR(20) NOT NULL UNIQUE,
    company_id BIGINT NOT NULL,
    parent_unit_id BIGINT NULL,
    description TEXT,
    head_of_unit BIGINT NULL,
    cost_center VARCHAR(50) NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (parent_unit_id) REFERENCES business_units(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (head_of_unit) REFERENCES employees(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_unit_name (unit_name),
    INDEX idx_unit_code (unit_code),
    INDEX idx_company_id (company_id),
    INDEX idx_parent_unit_id (parent_unit_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10c. GRADES MASTER
CREATE TABLE grades_master (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    grade_code VARCHAR(20) NOT NULL UNIQUE,
    grade_name VARCHAR(100) NOT NULL UNIQUE,
    level INT NOT NULL,
    min_salary DECIMAL(12,2) NULL,
    max_salary DECIMAL(12,2) NULL,
    band VARCHAR(20) NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_grade_code (grade_code),
    INDEX idx_level (level),
    INDEX idx_band (band),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 11. SHIFTS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS shifts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    shift_name VARCHAR(50) NOT NULL UNIQUE,
    shift_code VARCHAR(20) NOT NULL UNIQUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration INT DEFAULT 0 COMMENT 'Break duration in minutes',
    weekoff_days VARCHAR(20) DEFAULT 'Sunday' COMMENT 'Comma-separated days',
    is_flexible BOOLEAN DEFAULT FALSE,
    grace_period_minutes INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_shift_name (shift_name),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 12. HOLIDAY CALENDAR TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS holiday_calendar (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    holiday_name VARCHAR(100) NOT NULL,
    holiday_date DATE NOT NULL,
    description TEXT NULL,
    is_national BOOLEAN DEFAULT FALSE,
    location_id BIGINT NULL COMMENT 'NULL = applicable to all locations',
    status VARCHAR(20) DEFAULT 'active',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations_master(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_holiday_date (holiday_date),
    INDEX idx_location_id (location_id),
    INDEX idx_is_national (is_national),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 13. ATTENDANCE RECORDS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS attendance_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    attendance_date DATE NOT NULL,
    shift_id BIGINT NULL,
    check_in DATETIME NULL,
    check_out DATETIME NULL,
    status VARCHAR(20) DEFAULT 'present' COMMENT 'present, absent, half_day, leave, holiday, weekoff',
    is_late BOOLEAN DEFAULT FALSE,
    late_minutes INT DEFAULT 0,
    is_early_departure BOOLEAN DEFAULT FALSE,
    early_departure_minutes INT DEFAULT 0,
    regularization_reason TEXT NULL,
    regularized_by BIGINT NULL,
    regularized_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (regularized_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE KEY uk_employee_date (employee_id, attendance_date),
    INDEX idx_attendance_date (attendance_date),
    INDEX idx_status (status),
    INDEX idx_is_late (is_late)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 14. LEAVE TYPES TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS leave_types (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    leave_code VARCHAR(20) NOT NULL UNIQUE,
    leave_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    max_days_per_year INT DEFAULT 0,
    carry_forward BOOLEAN DEFAULT FALSE,
    encashable BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT TRUE,
    min_days_notice INT DEFAULT 1 COMMENT 'Minimum days advance notice required',
    status VARCHAR(20) DEFAULT 'active',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_leave_code (leave_code),
    INDEX idx_leave_name (leave_name),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 15. LEAVE BALANCES TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS leave_balances (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    leave_type_id BIGINT NOT NULL,
    year INT NOT NULL,
    opening_balance DECIMAL(6,2) DEFAULT 0,
    accrued DECIMAL(6,2) DEFAULT 0,
    used DECIMAL(6,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY uk_employee_leave_year (employee_id, leave_type_id, year),
    INDEX idx_employee_id (employee_id),
    INDEX idx_year (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 16. LEAVE REQUESTS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS leave_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    leave_type_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(6,2) NOT NULL,
    reason TEXT NULL,
    status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, approved, rejected, cancelled',
    applied_by BIGINT NULL,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_by BIGINT NULL,
    approved_at DATETIME NULL,
    rejection_reason TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (applied_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 17. TIMESHEETS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS timesheets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    timesheet_date DATE NOT NULL,
    project_code VARCHAR(50) NULL,
    task_description TEXT NULL,
    hours_worked DECIMAL(5,2) NOT NULL,
    is_billable BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'draft' COMMENT 'draft, submitted, approved, rejected',
    approved_by BIGINT NULL,
    approved_at DATETIME NULL,
    rejection_reason TEXT NULL,
    created_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_timesheet_date (timesheet_date),
    INDEX idx_status (status),
    INDEX idx_is_billable (is_billable)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 18. SALARY COMPONENTS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS salary_components (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    component_code VARCHAR(20) NOT NULL UNIQUE,
    component_name VARCHAR(100) NOT NULL,
    component_type VARCHAR(20) NOT NULL COMMENT 'earning, deduction',
    calculation_type VARCHAR(20) DEFAULT 'fixed' COMMENT 'fixed, percentage, formula',
    is_taxable BOOLEAN DEFAULT FALSE,
    is_statutory BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_component_code (component_code),
    INDEX idx_component_type (component_type),
    INDEX idx_is_taxable (is_taxable),
    INDEX idx_is_statutory (is_statutory),
    INDEX idx_is_active (is_active),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 19. SALARY STRUCTURES TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS salary_structures (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    structure_name VARCHAR(100) NOT NULL,
    grade_id BIGINT NULL,
    designation_id BIGINT NULL,
    company_id BIGINT NULL,
    business_unit_id BIGINT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (grade_id) REFERENCES grades_master(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (designation_id) REFERENCES designations_master(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_structure_name (structure_name),
    INDEX idx_grade_id (grade_id),
    INDEX idx_designation_id (designation_id),
    INDEX idx_company_id (company_id),
    INDEX idx_business_unit_id (business_unit_id),
    INDEX idx_effective_from (effective_from),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 20. SALARY STRUCTURE COMPONENTS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS salary_structure_components (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    structure_id BIGINT NOT NULL,
    component_id BIGINT NOT NULL,
    default_value DECIMAL(12,2) NULL,
    min_value DECIMAL(12,2) NULL,
    max_value DECIMAL(12,2) NULL,
    percentage_of VARCHAR(50) NULL COMMENT 'Component code this is percentage of',
    formula TEXT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (structure_id) REFERENCES salary_structures(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (component_id) REFERENCES salary_components(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY uk_structure_component (structure_id, component_id),
    INDEX idx_structure_id (structure_id),
    INDEX idx_component_id (component_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 21. EMPLOYEE SALARY DETAILS TABLE (SCD Type 2)
-- ===============================================
CREATE TABLE IF NOT EXISTS employee_salary_details (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    structure_id BIGINT NULL,
    basic_salary DECIMAL(12,2) NULL,
    total_earnings DECIMAL(12,2) NULL,
    total_deductions DECIMAL(12,2) NULL,
    net_salary DECIMAL(12,2) NULL,
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    is_current BOOLEAN DEFAULT TRUE,
    revision_reason TEXT NULL,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (structure_id) REFERENCES salary_structures(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_structure_id (structure_id),
    INDEX idx_is_current (is_current),
    INDEX idx_effective_from (effective_from),
    INDEX idx_effective_to (effective_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 22. EMPLOYEE SALARY COMPONENTS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS employee_salary_components (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    salary_detail_id BIGINT NOT NULL,
    component_id BIGINT NOT NULL,
    component_value DECIMAL(12,2) NOT NULL,
    calculation_details TEXT NULL,
    FOREIGN KEY (salary_detail_id) REFERENCES employee_salary_details(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (component_id) REFERENCES salary_components(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_salary_detail_id (salary_detail_id),
    INDEX idx_component_id (component_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 23. PAYROLL RUNS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS payroll_runs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    payroll_month VARCHAR(7) NOT NULL COMMENT 'YYYY-MM format',
    run_name VARCHAR(100) NOT NULL,
    run_type VARCHAR(20) DEFAULT 'regular' COMMENT 'regular, off_cycle, final_settlement',
    company_id BIGINT NULL,
    business_unit_id BIGINT NULL,
    status VARCHAR(20) DEFAULT 'draft' COMMENT 'draft, processing, completed, locked',
    total_employees INT DEFAULT 0,
    total_gross DECIMAL(14,2) DEFAULT 0,
    total_deductions DECIMAL(14,2) DEFAULT 0,
    total_net DECIMAL(14,2) DEFAULT 0,
    remarks TEXT NULL,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE KEY uk_payroll_month_company (payroll_month, company_id, business_unit_id),
    INDEX idx_payroll_month (payroll_month),
    INDEX idx_status (status),
    INDEX idx_company_id (company_id),
    INDEX idx_business_unit_id (business_unit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 24. PAYSLIPS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS payslips (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    payroll_run_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    employee_code VARCHAR(20) NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NULL,
    department VARCHAR(100) NULL,
    pan_number VARCHAR(20) NULL,
    bank_account VARCHAR(50) NULL,
    bank_name VARCHAR(100) NULL,
    payroll_month VARCHAR(7) NOT NULL COMMENT 'YYYY-MM format',
    working_days INT DEFAULT 0,
    present_days INT DEFAULT 0,
    lop_days INT DEFAULT 0,
    gross_earnings DECIMAL(12,2) DEFAULT 0,
    total_deductions DECIMAL(12,2) DEFAULT 0,
    net_pay DECIMAL(12,2) DEFAULT 0,
    arrears DECIMAL(12,2) DEFAULT 0,
    adjustments DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' COMMENT 'draft, generated, approved, paid',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_payroll_employee (payroll_run_id, employee_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_payroll_month (payroll_month),
    INDEX idx_status (status),
    INDEX idx_net_pay (net_pay)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 25. PAYSLIP COMPONENTS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS payslip_components (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    payslip_id BIGINT NOT NULL,
    component_id BIGINT NULL,
    component_name VARCHAR(100) NOT NULL,
    component_type VARCHAR(20) NOT NULL COMMENT 'earning, deduction',
    amount DECIMAL(12,2) NOT NULL,
    calculation_details TEXT NULL,
    FOREIGN KEY (payslip_id) REFERENCES payslips(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (component_id) REFERENCES salary_components(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_payslip_id (payslip_id),
    INDEX idx_component_type (component_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 26. TAX CONFIGURATIONS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS tax_configurations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tax_year INT NOT NULL COMMENT 'Financial year e.g. 2024',
    slab_min DECIMAL(12,2) NOT NULL,
    slab_max DECIMAL(12,2) NULL COMMENT 'NULL = no upper limit',
    tax_rate DECIMAL(5,2) NOT NULL COMMENT 'Tax rate percentage',
    cess_rate DECIMAL(5,2) DEFAULT 4.00 COMMENT 'Health and education cess percentage',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tax_year (tax_year),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 27. PF CONFIGURATIONS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS pf_configurations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    effective_from DATE NOT NULL,
    employee_percentage DECIMAL(5,2) DEFAULT 12.00,
    employer_percentage DECIMAL(5,2) DEFAULT 12.00,
    ceiling_amount DECIMAL(12,2) DEFAULT 15000.00 COMMENT 'Wage ceiling for PF',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_effective_from (effective_from),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 28. ESI CONFIGURATIONS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS esi_configurations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    effective_from DATE NOT NULL,
    employee_percentage DECIMAL(5,2) DEFAULT 0.75,
    employer_percentage DECIMAL(5,2) DEFAULT 3.25,
    wage_ceiling DECIMAL(12,2) DEFAULT 21000.00 COMMENT 'Wage ceiling for ESI',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_effective_from (effective_from),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 29. BONUS RECORDS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS bonus_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    bonus_type VARCHAR(50) NOT NULL COMMENT 'performance, festival, retention, signing, annual',
    bonus_month VARCHAR(7) NOT NULL COMMENT 'YYYY-MM format',
    bonus_amount DECIMAL(12,2) NOT NULL,
    taxable_amount DECIMAL(12,2) NULL,
    tax_deducted DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2) NULL,
    reason TEXT NULL,
    status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, approved, paid, cancelled',
    approved_by BIGINT NULL,
    paid_on DATE NULL,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_bonus_month (bonus_month),
    INDEX idx_bonus_type (bonus_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 30. ONBOARDING CHECKLIST TEMPLATES TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS onboarding_checklist_templates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    template_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    applicable_for VARCHAR(50) DEFAULT 'all' COMMENT 'all, department, designation, company',
    applicable_id BIGINT NULL COMMENT 'ID of department/designation/company if not all',
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_template_name (template_name),
    INDEX idx_applicable_for (applicable_for),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 31. CHECKLIST ITEMS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS checklist_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    template_id BIGINT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    category VARCHAR(50) NULL COMMENT 'document, setup, training, compliance',
    is_mandatory BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    estimated_days INT DEFAULT 1,
    created_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES onboarding_checklist_templates(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_template_id (template_id),
    INDEX idx_category (category),
    INDEX idx_is_mandatory (is_mandatory),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 32. EMPLOYEE ONBOARDING TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS employee_onboarding (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    template_id BIGINT NOT NULL,
    joining_date DATE NOT NULL,
    actual_joining_date DATE NULL,
    status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, in_progress, completed, cancelled',
    probation_end_date DATE NULL,
    confirmation_date DATE NULL,
    onboarding_completion_date DATE NULL,
    remarks TEXT NULL,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (template_id) REFERENCES onboarding_checklist_templates(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_joining_date (joining_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 33. EMPLOYEE CHECKLIST PROGRESS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS employee_checklist_progress (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    onboarding_id BIGINT NOT NULL,
    checklist_item_id BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, in_progress, completed, skipped',
    remarks TEXT NULL,
    attachment_path VARCHAR(255) NULL,
    completed_by BIGINT NULL,
    completed_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (onboarding_id) REFERENCES employee_onboarding(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE KEY uk_onboarding_item (onboarding_id, checklist_item_id),
    INDEX idx_onboarding_id (onboarding_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 34. PROBATION TRACKING TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS probation_tracking (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    probation_start_date DATE NOT NULL,
    probation_end_date DATE NULL,
    status VARCHAR(20) DEFAULT 'in_progress' COMMENT 'in_progress, confirmed, extended, terminated',
    performance_rating DECIMAL(3,2) NULL COMMENT 'Rating out of 5.00',
    manager_feedback TEXT NULL,
    hr_feedback TEXT NULL,
    self_assessment TEXT NULL,
    confirmation_date DATE NULL,
    confirmed_by BIGINT NULL,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_status (status),
    INDEX idx_probation_start_date (probation_start_date),
    INDEX idx_probation_end_date (probation_end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 35. EMPLOYEE JOB DETAILS TABLE (SCD Type 2)
-- ===============================================
CREATE TABLE employee_job_details (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    company_id BIGINT NULL,
    business_unit_id BIGINT NULL,
    department_id BIGINT NULL,
    designation_id BIGINT NULL,
    grade_id BIGINT NULL,
    shift_id BIGINT NULL,
    reporting_manager_id BIGINT NULL,
    employment_type VARCHAR(20) DEFAULT 'Full-Time',
    join_date DATE NOT NULL,
    confirmation_date DATE NULL,
    termination_date DATE NULL,
    termination_reason TEXT NULL,
    status VARCHAR(20) DEFAULT 'active',
    is_current BOOLEAN DEFAULT TRUE,
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (designation_id) REFERENCES designations_master(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (grade_id) REFERENCES grades_master(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (reporting_manager_id) REFERENCES employees(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_company_id (company_id),
    INDEX idx_department_id (department_id),
    INDEX idx_designation_id (designation_id),
    INDEX idx_is_current (is_current)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 36. EMPLOYEE SALARY HISTORY TABLE
-- ===============================================
CREATE TABLE employee_salary_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    previous_salary DECIMAL(12,2),
    new_salary DECIMAL(12,2) NOT NULL,
    revision_type VARCHAR(20),
    effective_date DATE NOT NULL,
    approved_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_effective_date (effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 37. EMPLOYEE TRANSFERS TABLE
-- ===============================================
CREATE TABLE employee_transfers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    transfer_type VARCHAR(20) NOT NULL COMMENT 'department, designation, location, reporting_manager',
    from_department_id BIGINT NULL,
    to_department_id BIGINT NULL,
    from_designation_id BIGINT NULL,
    to_designation_id BIGINT NULL,
    from_location_id BIGINT NULL,
    to_location_id BIGINT NULL,
    from_reporting_manager_id BIGINT NULL,
    to_reporting_manager_id BIGINT NULL,
    from_employment_type VARCHAR(20),
    to_employment_type VARCHAR(20),
    from_salary DECIMAL(12,2),
    to_salary DECIMAL(12,2),
    effective_date DATE NOT NULL,
    reason VARCHAR(255),
    remarks TEXT,
    approval_status VARCHAR(20) DEFAULT 'pending',
    approved_by BIGINT NULL,
    approved_at DATETIME NULL,
    created_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (from_department_id) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (to_department_id) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (from_designation_id) REFERENCES designations_master(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (to_designation_id) REFERENCES designations_master(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (from_location_id) REFERENCES locations_master(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (to_location_id) REFERENCES locations_master(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (from_reporting_manager_id) REFERENCES employees(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (to_reporting_manager_id) REFERENCES employees(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_transfer_type (transfer_type),
    INDEX idx_effective_date (effective_date),
    INDEX idx_approval_status (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 38. EMPLOYEE PROMOTIONS TABLE
-- ===============================================
CREATE TABLE employee_promotions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    from_designation_id BIGINT NULL,
    to_designation_id BIGINT NULL,
    from_grade_id BIGINT NULL,
    to_grade_id BIGINT NULL,
    from_salary DECIMAL(12,2),
    to_salary DECIMAL(12,2),
    promotion_date DATE NOT NULL,
    remarks TEXT,
    approved_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (from_designation_id) REFERENCES designations_master(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (to_designation_id) REFERENCES designations_master(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (from_grade_id) REFERENCES grades_master(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (to_grade_id) REFERENCES grades_master(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_promotion_date (promotion_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 39. EMPLOYEE ADDRESSES TABLE
-- ===============================================
CREATE TABLE employee_addresses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    address_type VARCHAR(20) DEFAULT 'current' COMMENT 'current, permanent',
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    country VARCHAR(50) DEFAULT 'India',
    pincode VARCHAR(10),
    is_primary BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_address_type (address_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 40. EMPLOYEE BANK DETAILS TABLE
-- ===============================================
CREATE TABLE employee_bank_details (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL UNIQUE,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    branch_name VARCHAR(100),
    account_type VARCHAR(20) DEFAULT 'Savings',
    is_primary BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_account_number (account_number),
    INDEX idx_ifsc_code (ifsc_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 41. EMPLOYEE EDUCATION TABLE
-- ===============================================
CREATE TABLE employee_education (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    education_id BIGINT NOT NULL,
    course_id BIGINT NULL,
    institution_name VARCHAR(100) NOT NULL,
    year_of_passing INT,
    percentage DECIMAL(5,2),
    grade VARCHAR(10),
    certificate_path VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (education_id) REFERENCES education_master(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course_master(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_education_id (education_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 42. EMPLOYEE EXPERIENCE TABLE
-- ===============================================
CREATE TABLE employee_experience (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    job_title VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_start_date (start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 43. DOCUMENTS MASTER TABLE
-- ===============================================
CREATE TABLE documents_master (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    document_name VARCHAR(100) NOT NULL UNIQUE,
    document_code VARCHAR(20) NOT NULL UNIQUE,
    document_type VARCHAR(50) COMMENT 'identity, address, education, professional, other',
    is_required BOOLEAN DEFAULT FALSE,
    applicable_for VARCHAR(50) DEFAULT 'all' COMMENT 'all, employee, contractor, intern',
    status VARCHAR(20) DEFAULT 'active',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_document_code (document_code),
    INDEX idx_document_type (document_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 44. EMPLOYEE DOCUMENTS TABLE
-- ===============================================
CREATE TABLE employee_documents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    document_id BIGINT NOT NULL,
    document_path VARCHAR(255) NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    verified_by BIGINT NULL,
    verified_at DATETIME NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents_master(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_document_id (document_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 45. WEBHOOK ENDPOINTS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS webhook_endpoints (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    description TEXT NULL,
    secret VARCHAR(255) NULL,
    events JSON NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    retry_count INT DEFAULT 3,
    timeout_seconds INT DEFAULT 30,
    headers JSON NULL,
    created_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_url (url(255)),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 46. WEBHOOKS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS webhooks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    endpoint_id INT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload_template JSON,
    headers JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (endpoint_id) REFERENCES webhook_endpoints(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_endpoint_id (endpoint_id),
    INDEX idx_event_type (event_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 47. WEBHOOK DELIVERIES TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    webhook_id INT NOT NULL,
    event_id VARCHAR(100) NOT NULL,
    status_code INT NULL,
    success BOOLEAN DEFAULT FALSE,
    response_body TEXT NULL,
    error_message TEXT NULL,
    attempt_number INT DEFAULT 1,
    delivered_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_event_id (event_id),
    INDEX idx_success (success),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 48. TENANTS TABLE (Multi-tenancy)
-- ===============================================
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    database_schema VARCHAR(100) NULL,
    domain VARCHAR(255) NULL,
    settings JSON NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_domain (domain),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 49. IP BLOCKLIST TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS ip_blocklist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    reason VARCHAR(255) NULL,
    blocked_by INT NULL,
    expires_at DATETIME NULL,
    is_permanent BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blocked_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_ip_address (ip_address),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_permanent (is_permanent)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 50. USER TOTP SECRETS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS user_totp_secrets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    secret VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    backup_codes JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 51. API KEYS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS api_keys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    key_name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    permissions JSON NULL,
    expires_at DATETIME NULL,
    last_used_at DATETIME NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_key_hash (key_hash),
    INDEX idx_key_prefix (key_prefix),
    INDEX idx_is_active (is_active),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 52. FEATURE FLAGS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS feature_flags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INT DEFAULT 0,
    conditions JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_is_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- SEED DATA
-- ===============================================

-- Default Roles
INSERT INTO roles (name, permissions) VALUES
('Super Admin', '{"all": true}'),
('Admin', '{"users": ["create", "read", "update"], "employees": ["create", "read", "update"], "master": ["read"]}'),
('Manager', '{"employees": ["read"], "attendance": ["read", "update"], "leave": ["approve"]}'),
('Employee', '{"profile": ["read", "update"], "attendance": ["read"], "leave": ["create"]}'),
('HR', '{"employees": ["create", "read", "update"], "attendance": ["read", "update"], "leave": ["approve"], "payroll": ["read"]}');

-- Default Admin User (password: Admin@123)
INSERT INTO users (username, email, password, mobile, role_id, account_status) VALUES
('admin', 'admin@hrm.com', '$2b$12$LQvRQx.tGRlqwrPw6JYOQeZQxNK5I6Uw.GQYMmL3uhQx9QxQxQx', '+1234567890', 1, 'active');

-- Default Shifts
INSERT INTO shifts (shift_name, start_time, end_time, break_duration, weekoff_days, grace_period_minutes, created_by) VALUES
('General', '09:00:00', '18:00:00', 60, 'Saturday,Sunday', 15, 1),
('Morning', '07:00:00', '16:00:00', 45, 'Sunday', 10, 1),
('Evening', '14:00:00', '23:00:00', 45, 'Sunday', 10, 1),
('Night', '22:00:00', '07:00:00', 30, 'Sunday', 0, 1),
('Flexible', '08:00:00', '17:00:00', 60, 'Saturday,Sunday', 30, 1);

-- Default Leave Types
INSERT INTO leave_types (leave_code, leave_name, description, max_days_per_year, carry_forward, encashable, requires_approval, min_days_notice, created_by) VALUES
('CL', 'Casual Leave', 'Short-term personal leave', 12, FALSE, FALSE, TRUE, 1, 1),
('SL', 'Sick Leave', 'Medical and health-related leave', 12, TRUE, FALSE, TRUE, 1, 1),
('EL', 'Earned Leave', 'Accumulated leave based on service', 15, TRUE, TRUE, TRUE, 5, 1),
('ML', 'Maternity Leave', 'Leave for female employees during childbirth', 180, FALSE, FALSE, TRUE, 30, 1),
('PL', 'Paternity Leave', 'Leave for male employees during childbirth', 15, FALSE, FALSE, TRUE, 7, 1),
('LOP', 'Loss of Pay', 'Unpaid leave', 0, FALSE, FALSE, TRUE, 1, 1),
('COMP', 'Compensatory Off', 'Leave for working on holidays/weekends', 0, FALSE, FALSE, TRUE, 1, 1);

-- Default Tax Configuration (FY 2024-25 - New Regime)
INSERT INTO tax_configurations (tax_year, slab_min, slab_max, tax_rate, cess_rate) VALUES
(2024, 0, 300000, 0.00, 4.00),
(2024, 300000, 700000, 5.00, 4.00),
(2024, 700000, 1000000, 10.00, 4.00),
(2024, 1000000, 1200000, 15.00, 4.00),
(2024, 1200000, 1500000, 20.00, 4.00),
(2024, 1500000, NULL, 30.00, 4.00);

-- Default PF Configuration
INSERT INTO pf_configurations (effective_from, employee_percentage, employer_percentage, ceiling_amount) VALUES
('2024-04-01', 12.00, 12.00, 15000.00);

-- Default ESI Configuration
INSERT INTO esi_configurations (effective_from, employee_percentage, employer_percentage, wage_ceiling) VALUES
('2024-04-01', 0.75, 3.25, 21000.00);

-- Default Salary Components
INSERT INTO salary_components (component_code, component_name, component_type, calculation_type, is_taxable, is_statutory, display_order, created_by) VALUES
('BASIC', 'Basic Salary', 'earning', 'fixed', TRUE, FALSE, 1, 1),
('HRA', 'House Rent Allowance', 'earning', 'percentage', TRUE, FALSE, 2, 1),
('DA', 'Dearness Allowance', 'earning', 'percentage', TRUE, FALSE, 3, 1),
('CONV', 'Conveyance Allowance', 'earning', 'fixed', TRUE, FALSE, 4, 1),
('MED', 'Medical Allowance', 'earning', 'fixed', TRUE, FALSE, 5, 1),
('LTA', 'Leave Travel Allowance', 'earning', 'fixed', TRUE, FALSE, 6, 1),
('BONUS', 'Performance Bonus', 'earning', 'fixed', TRUE, FALSE, 7, 1),
('PF_EMP', 'Provident Fund (Employee)', 'deduction', 'percentage', FALSE, TRUE, 1, 1),
('PF_EMR', 'Provident Fund (Employer)', 'deduction', 'percentage', FALSE, TRUE, 2, 1),
('ESI', 'Employee State Insurance', 'deduction', 'percentage', FALSE, TRUE, 3, 1),
('PT', 'Professional Tax', 'deduction', 'fixed', FALSE, TRUE, 4, 1);

-- Default Feature Flags
INSERT INTO feature_flags (name, description, is_enabled, rollout_percentage) VALUES
('two_factor_auth', 'Enable Two-Factor Authentication', FALSE, 0),
('audit_export', 'Enable Audit Log Export', TRUE, 100),
('bulk_operations', 'Enable Bulk Import/Export', TRUE, 100),
('webhooks', 'Enable Webhook System', FALSE, 0),
('multi_tenancy', 'Enable Multi-Tenancy', FALSE, 0);

-- Default Onboarding Checklist Template
INSERT INTO onboarding_checklist_templates (template_name, description, applicable_for, is_active, created_by) VALUES
('Standard Onboarding', 'Standard onboarding checklist for all new employees', 'all', TRUE, 1),
('Executive Onboarding', 'Onboarding checklist for senior executives', 'all', TRUE, 1),
('Contract Onboarding', 'Onboarding checklist for contract employees', 'all', TRUE, 1);

-- Default Checklist Items for Standard Onboarding
INSERT INTO checklist_items (template_id, item_name, description, category, is_mandatory, sort_order, estimated_days, created_by) VALUES
(1, 'Collect ID Proofs', 'Collect Aadhaar, PAN, Passport copies', 'document', TRUE, 1, 1, 1),
(1, 'Collect Educational Certificates', 'Collect degree certificates and mark sheets', 'document', TRUE, 2, 1, 1),
(1, 'Collect Bank Details', 'Collect cancelled cheque or bank passbook', 'document', TRUE, 3, 1, 1),
(1, 'Create Email Account', 'Setup official email account', 'setup', TRUE, 4, 1, 1),
(1, 'Assign System/Equipment', 'Assign laptop, access cards, and other equipment', 'setup', TRUE, 5, 1, 1),
(1, 'Setup Workstation', 'Configure workstation and software access', 'setup', TRUE, 6, 1, 1),
(1, 'HR Orientation', 'HR policies, benefits, and procedures overview', 'training', TRUE, 7, 1, 1),
(1, 'IT Security Training', 'Information security awareness training', 'training', TRUE, 8, 1, 1),
(1, 'Department Introduction', 'Introduction to team and department processes', 'training', TRUE, 9, 1, 1),
(1, 'Background Verification', 'Initiate background verification process', 'compliance', TRUE, 10, 5, 1);

-- ===============================================
-- VIEWS
-- ===============================================

-- VIEW: Employee Leave Balance Summary
CREATE OR REPLACE VIEW v_employee_leave_balance AS
SELECT 
    e.id AS employee_id,
    e.employee_code,
    CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) AS employee_name,
    lb.year,
    lt.leave_code,
    lt.leave_name,
    lb.opening_balance,
    lb.accrued,
    lb.used,
    (lb.opening_balance + lb.accrued - lb.used) AS available_balance
FROM employees e
JOIN leave_balances lb ON e.id = lb.employee_id
JOIN leave_types lt ON lb.leave_type_id = lt.id
WHERE e.deleted_at IS NULL
ORDER BY e.employee_code, lb.year DESC, lt.leave_name;

-- VIEW: Current Employee Salary Summary
CREATE OR REPLACE VIEW v_current_employee_salary AS
SELECT 
    e.id AS employee_id,
    e.employee_code,
    CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) AS employee_name,
    esd.id AS salary_detail_id,
    esd.basic_salary,
    esd.total_earnings,
    esd.total_deductions,
    esd.net_salary,
    esd.effective_from,
    esd.revision_reason,
    ss.structure_name
FROM employees e
JOIN employee_salary_details esd ON e.id = esd.employee_id AND esd.is_current = TRUE
LEFT JOIN salary_structures ss ON esd.structure_id = ss.id
WHERE e.deleted_at IS NULL
ORDER BY e.employee_code;

-- VIEW: Onboarding Progress Summary
CREATE OR REPLACE VIEW v_onboarding_progress AS
SELECT 
    eo.id AS onboarding_id,
    e.employee_code,
    CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) AS employee_name,
    eo.joining_date,
    eo.actual_joining_date,
    eo.status,
    oct.template_name,
    COUNT(ci.id) AS total_items,
    SUM(CASE WHEN ecp.status = 'completed' THEN 1 ELSE 0 END) AS completed_items,
    ROUND(SUM(CASE WHEN ecp.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(ci.id), 2) AS progress_percentage
FROM employee_onboarding eo
JOIN employees e ON eo.employee_id = e.id
JOIN onboarding_checklist_templates oct ON eo.template_id = oct.id
JOIN checklist_items ci ON oct.id = ci.template_id
LEFT JOIN employee_checklist_progress ecp ON eo.id = ecp.onboarding_id AND ci.id = ecp.checklist_item_id
WHERE e.deleted_at IS NULL
GROUP BY eo.id, e.employee_code, e.first_name, e.last_name, eo.joining_date, eo.actual_joining_date, eo.status, oct.template_name
ORDER BY eo.joining_date DESC;

-- ===============================================
-- COMPLETE SCHEMA CREATION FINISHED
-- ===============================================
