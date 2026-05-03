const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

async function up() {
    console.log('Running performance management migration...');
    
    const migrationSQL = `
-- =====================================================================
-- MIGRATION: Performance Management System
-- =====================================================================

-- 10a. PERFORMANCE CYCLES
CREATE TABLE IF NOT EXISTS performance_cycles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cycle_name VARCHAR(100) NOT NULL UNIQUE,
    cycle_code VARCHAR(20) NOT NULL UNIQUE,
    cycle_type ENUM('quarterly', 'annual') NOT NULL,
    fiscal_year YEAR NOT NULL,
    quarter TINYINT NULL CHECK (quarter IN (1, 2, 3, 4)),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    self_rating_start DATE NOT NULL,
    self_rating_end DATE NOT NULL,
    manager_rating_start DATE NOT NULL,
    manager_rating_end DATE NOT NULL,
    hr_review_start DATE NULL,
    hr_review_end DATE NULL,
    status ENUM('draft', 'active', 'self_rating_open', 'self_rating_closed', 'manager_rating_open', 'manager_rating_closed', 'hr_review', 'completed') DEFAULT 'draft',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_cycle_code (cycle_code),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date),
    CONSTRAINT chk_dates CHECK (start_date < end_date),
    CONSTRAINT chk_self_rating_dates CHECK (self_rating_start <= self_rating_end),
    CONSTRAINT chk_manager_rating_dates CHECK (manager_rating_start <= manager_rating_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10b. PERFORMANCE GOALS
CREATE TABLE IF NOT EXISTS performance_goals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cycle_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    manager_id BIGINT NOT NULL,
    goal_title VARCHAR(255) NOT NULL,
    goal_description TEXT,
    kpi_description TEXT,
    target_value VARCHAR(100),
    weightage DECIMAL(5,2) DEFAULT 0.00,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cycle_id) REFERENCES performance_cycles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_cycle_employee (cycle_id, employee_id),
    INDEX idx_manager (manager_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10c. PERFORMANCE SELF RATINGS
CREATE TABLE IF NOT EXISTS performance_self_ratings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    goal_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    cycle_id BIGINT NOT NULL,
    self_rating DECIMAL(3,2) CHECK (self_rating >= 1.00 AND self_rating <= 5.00),
    achievement_summary TEXT,
    what_achieved TEXT,
    what_missed TEXT,
    challenges_faced TEXT,
    supporting_evidence TEXT,
    status ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft',
    submitted_at DATETIME NULL,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES performance_goals(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (cycle_id) REFERENCES performance_cycles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE KEY uk_goal_employee (goal_id, employee_id),
    INDEX idx_cycle (cycle_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10d. PERFORMANCE MANAGER RATINGS
CREATE TABLE IF NOT EXISTS performance_manager_ratings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    goal_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    manager_id BIGINT NOT NULL,
    cycle_id BIGINT NOT NULL,
    manager_rating DECIMAL(3,2) CHECK (manager_rating >= 1.00 AND manager_rating <= 5.00),
    manager_comments TEXT,
    what_employee_did_well TEXT,
    areas_of_improvement TEXT,
    manager_feedback TEXT,
    final_rating DECIMAL(3,2) CHECK (final_rating >= 1.00 AND final_rating <= 5.00),
    status ENUM('pending', 'submitted', 'approved', 'rejected') DEFAULT 'pending',
    submitted_at DATETIME NULL,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES performance_goals(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (cycle_id) REFERENCES performance_cycles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE KEY uk_goal_manager (goal_id, manager_id),
    INDEX idx_cycle (cycle_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10e. PERFORMANCE OVERALL RATINGS (Quarterly)
CREATE TABLE IF NOT EXISTS performance_overall_ratings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cycle_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    manager_id BIGINT NOT NULL,
    average_self_rating DECIMAL(3,2),
    average_manager_rating DECIMAL(3,2),
    overall_rating DECIMAL(3,2),
    rating_category ENUM('exceptional', 'exceeds_expectations', 'meets_expectations', 'needs_improvement', 'unsatisfactory'),
    manager_summary TEXT,
    employee_comments TEXT,
    hr_comments TEXT,
    hr_approved_by BIGINT NULL,
    hr_approved_at DATETIME NULL,
    status ENUM('draft', 'manager_submitted', 'hr_review', 'hr_approved', 'completed') DEFAULT 'draft',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cycle_id) REFERENCES performance_cycles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (hr_approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE KEY uk_cycle_employee (cycle_id, employee_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10f. PERFORMANCE ANNUAL SUMMARY
CREATE TABLE IF NOT EXISTS performance_annual_summaries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    fiscal_year YEAR NOT NULL,
    employee_id BIGINT NOT NULL,
    q1_rating DECIMAL(3,2),
    q2_rating DECIMAL(3,2),
    q3_rating DECIMAL(3,2),
    q4_rating DECIMAL(3,2),
    annual_average_rating DECIMAL(3,2),
    final_rating_category ENUM('exceptional', 'exceeds_expectations', 'meets_expectations', 'needs_improvement', 'unsatisfactory'),
    manager_overall_comments TEXT,
    hr_overall_comments TEXT,
    hr_approved_by BIGINT NULL,
    hr_approved_at DATETIME NULL,
    status ENUM('draft', 'manager_submitted', 'hr_review', 'hr_approved', 'completed') DEFAULT 'draft',
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (hr_approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE KEY uk_year_employee (fiscal_year, employee_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10g. PERFORMANCE NOTIFICATIONS LOG
CREATE TABLE IF NOT EXISTS performance_notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cycle_id BIGINT NOT NULL,
    recipient_id BIGINT NOT NULL,
    sender_id BIGINT NULL,
    notification_type ENUM('self_rating_reminder', 'self_rating_deadline', 'manager_rating_reminder', 'manager_rating_deadline', 'hr_review_reminder', 'cycle_completion') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME NULL,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    scheduled_for DATETIME NOT NULL,
    sent_at DATETIME NULL,
    created_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cycle_id) REFERENCES performance_cycles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_recipient (recipient_id),
    INDEX idx_cycle (cycle_id),
    INDEX idx_type (notification_type),
    INDEX idx_status (status),
    INDEX idx_scheduled (scheduled_for)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default permissions for performance management
INSERT IGNORE INTO permissions (permission_name, description) VALUES 
('performance.write', 'Create performance cycles and goals'),
('performance.update', 'Update performance cycles and goals'),
('performance.delete', 'Delete performance goals'),
('performance.self_rating', 'Submit self-ratings'),
('performance.manager_rating', 'Submit manager ratings'),
('performance.hr_review', 'Review and approve performance ratings');

-- Assign permissions to admin role (assuming role ID 1 is admin)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions 
WHERE permission_name IN (
    'performance.write',
    'performance.update',
    'performance.delete',
    'performance.self_rating',
    'performance.manager_rating',
    'performance.hr_review'
) ON DUPLICATE KEY UPDATE role_id = role_id;
`;

    try {
        const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (const statement of statements) {
            if (statement.trim()) {
                await pool.query(statement);
                console.log(`Executed: ${statement.substring(0, 50).trim()}...`);
            }
        }
        
        console.log('Performance management migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error.message);
        throw error;
    }
}

async function down() {
    console.log('Rolling back performance management migration...');
    
    const rollbackSQL = `
        DROP TABLE IF EXISTS performance_notifications;
        DROP TABLE IF EXISTS performance_annual_summaries;
        DROP TABLE IF EXISTS performance_overall_ratings;
        DROP TABLE IF EXISTS performance_manager_ratings;
        DROP TABLE IF EXISTS performance_self_ratings;
        DROP TABLE IF EXISTS performance_goals;
        DROP TABLE IF EXISTS performance_cycles;
        
        DELETE FROM role_permissions WHERE permission_id IN (
            SELECT id FROM permissions WHERE permission_name LIKE 'performance.%'
        );
        DELETE FROM permissions WHERE permission_name LIKE 'performance.%';
    `;
    
    try {
        await pool.query(rollbackSQL);
        console.log('Performance management rollback completed successfully!');
    } catch (error) {
        console.error('Rollback failed:', error.message);
        throw error;
    }
}

module.exports = { up, down };

if (require.main === module) {
    const action = process.argv[2] || 'up';
    
    if (action === 'up') {
        up().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
    } else if (action === 'down') {
        down().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
    } else {
        console.log('Usage: node 006_performance_management.js [up|down]');
        process.exit(1);
    }
}
