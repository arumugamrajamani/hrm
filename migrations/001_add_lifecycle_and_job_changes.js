/**
 * Migration: Add Employee Lifecycle States and Job Changes
 * Phase 1: Core HR Employee Master
 * 
 * Run: node migrations/001_add_lifecycle_and_job_changes.js
 */

const { pool } = require('../src/config/database');
const logger = require('../src/utils/logger');

async function up() {
    console.log('Starting migration: Add Lifecycle States and Job Changes...');

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Add lifecycle_state column to employees table
        console.log('1. Adding lifecycle_state column to employees table...');
        await connection.query(`
            ALTER TABLE employees 
            ADD COLUMN lifecycle_state VARCHAR(20) DEFAULT 'draft' AFTER gender,
            ADD INDEX idx_lifecycle_state (lifecycle_state)
        `);
        console.log('   ✓ lifecycle_state column added');

        // 2. Create employee_lifecycle_states table
        console.log('2. Creating employee_lifecycle_states table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS employee_lifecycle_states (
                id INT PRIMARY KEY AUTO_INCREMENT,
                state_code VARCHAR(20) UNIQUE NOT NULL,
                state_name VARCHAR(50) NOT NULL,
                description TEXT,
                is_active_state BOOLEAN DEFAULT TRUE,
                allowed_transitions JSON,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_state_code (state_code),
                INDEX idx_is_active_state (is_active_state)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ employee_lifecycle_states table created');

        // 3. Insert default lifecycle states
        console.log('3. Inserting default lifecycle states...');
        await connection.query(`
            INSERT INTO employee_lifecycle_states (state_code, state_name, description, is_active_state, allowed_transitions) VALUES
            ('draft', 'Draft', 'Employee record created but not yet active', FALSE, '["active", "cancelled"]'),
            ('active', 'Active', 'Employee is actively working', TRUE, '["probation", "on_leave", "suspended", "resigned", "terminated", "retired"]'),
            ('probation', 'Probation', 'Employee under probation period', TRUE, '["confirmed", "terminated", "resigned"]'),
            ('confirmed', 'Confirmed', 'Employee passed probation and confirmed', TRUE, '["on_leave", "suspended", "resigned", "terminated", "retired", "transferred"]'),
            ('on_leave', 'On Leave', 'Employee on extended leave', TRUE, '["active", "resigned", "terminated"]'),
            ('suspended', 'Suspended', 'Employee temporarily suspended', FALSE, '["active", "terminated", "resigned"]'),
            ('resigned', 'Resigned', 'Employee has resigned', FALSE, '["terminated"]'),
            ('terminated', 'Terminated', 'Employee terminated from service', FALSE, '[]'),
            ('retired', 'Retired', 'Employee retired', FALSE, '[]'),
            ('transferred', 'Transferred', 'Employee transferred to another location/department', TRUE, '["active", "resigned", "terminated", "retired"]'),
            ('cancelled', 'Cancelled', 'Employee record cancelled before activation', FALSE, '[]')
        `);
        console.log('   ✓ Default lifecycle states inserted');

        // 4. Create employee_lifecycle_history table
        console.log('4. Creating employee_lifecycle_history table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS employee_lifecycle_history (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                employee_id BIGINT NOT NULL,
                from_state VARCHAR(20),
                to_state VARCHAR(20) NOT NULL,
                changed_by BIGINT NULL,
                changed_at DATETIME NOT NULL,
                reason VARCHAR(255),
                remarks TEXT,
                effective_date DATE NOT NULL,
                approval_status VARCHAR(20) DEFAULT 'approved',
                approved_by BIGINT NULL,
                approved_at DATETIME NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
                FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
                INDEX idx_employee_id (employee_id),
                INDEX idx_to_state (to_state),
                INDEX idx_effective_date (effective_date),
                INDEX idx_approval_status (approval_status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ employee_lifecycle_history table created');

        // 5. Create employee_job_changes table
        console.log('5. Creating employee_job_changes table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS employee_job_changes (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                employee_id BIGINT NOT NULL,
                change_type VARCHAR(20) NOT NULL COMMENT 'transfer, promotion, demotion, confirmation',
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
                INDEX idx_change_type (change_type),
                INDEX idx_effective_date (effective_date),
                INDEX idx_approval_status (approval_status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ employee_job_changes table created');

        // 6. Update existing employees to have 'active' lifecycle state if they have job details
        console.log('6. Updating existing employees lifecycle state...');
        const [updateResult] = await connection.query(`
            UPDATE employees e
            INNER JOIN employee_job_details jd ON e.id = jd.employee_id AND jd.is_current = TRUE
            SET e.lifecycle_state = 'active'
            WHERE e.lifecycle_state = 'draft' OR e.lifecycle_state IS NULL
        `);
        console.log(`   ✓ Updated ${updateResult.affectedRows} existing employees to 'active' state`);

        await connection.commit();
        console.log('\n✓ Migration completed successfully!');

    } catch (error) {
        await connection.rollback();
        console.error('\n✗ Migration failed:', error.message);
        throw error;
    } finally {
        connection.release();
        pool.end();
    }
}

async function down() {
    console.log('Rolling back migration: Remove Lifecycle States and Job Changes...');

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Drop tables in reverse order
        await connection.query('DROP TABLE IF EXISTS employee_job_changes');
        console.log('   ✓ Dropped employee_job_changes table');

        await connection.query('DROP TABLE IF EXISTS employee_lifecycle_history');
        console.log('   ✓ Dropped employee_lifecycle_history table');

        await connection.query('DROP TABLE IF EXISTS employee_lifecycle_states');
        console.log('   ✓ Dropped employee_lifecycle_states table');

        // Remove lifecycle_state column
        await connection.query('ALTER TABLE employees DROP COLUMN lifecycle_state');
        console.log('   ✓ Removed lifecycle_state column from employees table');

        await connection.commit();
        console.log('\n✓ Rollback completed successfully!');

    } catch (error) {
        await connection.rollback();
        console.error('\n✗ Rollback failed:', error.message);
        throw error;
    } finally {
        connection.release();
        pool.end();
    }
}

// Run migration
const command = process.argv[2] || 'up';

if (command === 'up') {
    up().catch(err => {
        console.error('Migration failed:', err);
        process.exit(1);
    });
} else if (command === 'down') {
    down().catch(err => {
        console.error('Rollback failed:', err);
        process.exit(1);
    });
} else {
    console.log('Usage: node migrations/001_add_lifecycle_and_job_changes.js [up|down]');
    process.exit(1);
}
