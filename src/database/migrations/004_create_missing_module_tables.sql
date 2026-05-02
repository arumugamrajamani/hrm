-- ================================================
-- HRM SYSTEM - MIGRATION 004
-- Create missing module tables: Attendance, Payroll, Onboarding, Master Data
-- ================================================

USE hrm_db;

-- ================================================
-- MASTER DATA TABLES (must be created first - referenced by other modules)
-- ================================================

-- 1. Companies Table
CREATE TABLE IF NOT EXISTS companies (
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

-- 2. Business Units Table
CREATE TABLE IF NOT EXISTS business_units (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    unit_name VARCHAR(100) NOT NULL,
    unit_code VARCHAR(20) NOT NULL UNIQUE,
    company_id BIGINT NOT NULL,
    parent_unit_id BIGINT NULL,
    description TEXT NULL,
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

-- 3. Grades Master Table
CREATE TABLE IF NOT EXISTS grades_master (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    grade_code VARCHAR(20) NOT NULL UNIQUE,
    grade_name VARCHAR(100) NOT NULL UNIQUE,
    level INT NOT NULL,
    min_salary DECIMAL(12,2) NULL,
    max_salary DECIMAL(12,2) NULL,
    band VARCHAR(20) NULL,
    description TEXT NULL,
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

-- ================================================
-- ATTENDANCE MODULE TABLES
-- ================================================

-- 4. Shifts Table
CREATE TABLE IF NOT EXISTS shifts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    shift_name VARCHAR(50) NOT NULL UNIQUE,
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

-- 5. Holiday Calendar Table
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

-- 6. Attendance Records Table
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

-- 7. Leave Types Table
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

-- 8. Leave Balances Table
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

-- 9. Leave Requests Table
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

-- 10. Timesheets Table
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

-- ================================================
-- PAYROLL MODULE TABLES
-- ================================================

-- 11. Salary Components Table
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

-- 12. Salary Structures Table
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

-- 13. Salary Structure Components Table
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

-- 14. Employee Salary Details Table (SCD Type 2)
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

-- 15. Employee Salary Components Table
CREATE TABLE IF NOT EXISTS employee_salary_components (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    salary_detail_id BIGINT NOT NULL,
    component_id BIGINT NOT NULL,
    component_value DECIMAL(12,2) NOT NULL,
    calculation_value DECIMAL(8,2) NULL,
    remark TEXT NULL,
    FOREIGN KEY (salary_detail_id) REFERENCES employee_salary_details(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (component_id) REFERENCES salary_components(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_salary_detail_id (salary_detail_id),
    INDEX idx_component_id (component_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Payroll Runs Table
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

-- 17. Payslips Table
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

-- 18. Payslip Components Table
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

-- 19. Tax Configurations Table
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
    INDEX idx_slab_min (slab_min),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. PF Configurations Table
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

-- 21. ESI Configurations Table
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

-- 22. Bonus Records Table
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

-- ================================================
-- ONBOARDING MODULE TABLES
-- ================================================

-- 23. Onboarding Checklist Templates Table
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

-- 24. Checklist Items Table
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

-- 25. Employee Onboarding Table
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

-- 26. Employee Checklist Progress Table
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

-- 27. Probation Tracking Table
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

-- ================================================
-- SEED DATA FOR NEW MODULES
-- ================================================

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
('SPL', 'Special Allowance', 'earning', 'fixed', TRUE, FALSE, 6, 1),
('LTA', 'Leave Travel Allowance', 'earning', 'fixed', TRUE, FALSE, 7, 1),
('BONUS', 'Performance Bonus', 'earning', 'fixed', TRUE, FALSE, 8, 1),
('PF_EMP', 'Provident Fund (Employee)', 'deduction', 'percentage', FALSE, TRUE, 1, 1),
('PF_EMR', 'Provident Fund (Employer)', 'deduction', 'percentage', FALSE, TRUE, 2, 1),
('ESI', 'Employee State Insurance', 'deduction', 'percentage', FALSE, TRUE, 3, 1),
('PT', 'Professional Tax', 'deduction', 'fixed', FALSE, TRUE, 4, 1),
('TDS', 'Tax Deducted at Source', 'deduction', 'percentage', FALSE, TRUE, 5, 1);

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

-- ================================================
-- VIEW: Employee Leave Balance Summary
-- ================================================
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

-- ================================================
-- VIEW: Current Employee Salary Summary
-- ================================================
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

-- ================================================
-- VIEW: Onboarding Progress Summary
-- ================================================
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

-- ================================================
-- FIX: Add missing business_unit_id columns to existing tables
-- (Referenced in payrollModel.js joins)
-- ================================================

ALTER TABLE departments
    ADD COLUMN business_unit_id BIGINT NULL AFTER parent_department_id,
    ADD INDEX idx_dept_bu (business_unit_id);

ALTER TABLE departments
    ADD CONSTRAINT fk_dept_bu FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE designations_master
    ADD COLUMN business_unit_id BIGINT NULL AFTER department_id,
    ADD INDEX idx_desig_bu (business_unit_id);

ALTER TABLE designations_master
    ADD CONSTRAINT fk_desig_bu FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE SET NULL ON UPDATE CASCADE;
