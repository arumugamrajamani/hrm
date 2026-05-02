/**
 * Migration: Time & Attendance, Leave Management
 * Phase 3: Time & Attendance, Leave Management
 * 
 * Run: node migrations/004_time_attendance_leave.js
 */

const { pool } = require('../src/config/database');

async function up() {
    console.log('Starting migration: Time & Attendance, Leave Management...');

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Shift/Roster Table
        console.log('1. Creating shifts table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS shifts (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                shift_name VARCHAR(100) NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                break_duration INT DEFAULT 60 COMMENT 'Break in minutes',
                weekoff_days VARCHAR(50) DEFAULT '0,6' COMMENT '0=Sun, 6=Sat',
                is_flexible BOOLEAN DEFAULT FALSE,
                grace_period_minutes INT DEFAULT 15,
                status VARCHAR(20) DEFAULT 'active',
                created_by BIGINT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_shift_name (shift_name),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ shifts table created');

        // 2. Holiday Calendar
        console.log('2. Creating holiday_calendar table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS holiday_calendar (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                holiday_name VARCHAR(100) NOT NULL,
                holiday_date DATE NOT NULL,
                description TEXT,
                is_national BOOLEAN DEFAULT FALSE,
                location_id BIGINT NULL,
                status VARCHAR(20) DEFAULT 'active',
                created_by BIGINT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (location_id) REFERENCES locations_master(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_holiday_date (holiday_date),
                INDEX idx_location_id (location_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ holiday_calendar table created');

        // 3. Attendance Records
        console.log('3. Creating attendance_records table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS attendance_records (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                employee_id BIGINT NOT NULL,
                shift_id BIGINT NULL,
                attendance_date DATE NOT NULL,
                check_in DATETIME NULL,
                check_out DATETIME NULL,
                status VARCHAR(20) DEFAULT 'present' COMMENT 'present, absent, late, early, half_day',
                is_late BOOLEAN DEFAULT FALSE,
                is_early_departure BOOLEAN DEFAULT FALSE,
                late_minutes INT DEFAULT 0,
                early_departure_minutes INT DEFAULT 0,
                regularization_reason TEXT,
                regularized_by BIGINT NULL,
                regularized_at DATETIME NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
                FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL,
                FOREIGN KEY (regularized_by) REFERENCES users(id) ON DELETE SET NULL,
                UNIQUE KEY uk_employee_date (employee_id, attendance_date),
                INDEX idx_attendance_date (attendance_date),
                INDEX idx_employee_id (employee_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Add total_hours as a regular column with trigger or application logic
        await connection.query(`
            ALTER TABLE attendance_records 
            ADD COLUMN total_hours DECIMAL(5,2) GENERATED ALWAYS AS (
                CASE WHEN check_in IS NOT NULL AND check_out IS NOT NULL 
                THEN TIMESTAMPDIFF(check_out, check_in) / 3600 
                ELSE 0 END
            ) STORED
        `).catch(() => {}); // Ignore if already exists
        
        console.log('   ✓ attendance_records table created');

        // 4. Leave Types
        console.log('4. Creating leave_types table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS leave_types (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                leave_code VARCHAR(20) UNIQUE NOT NULL,
                leave_name VARCHAR(100) NOT NULL,
                description TEXT,
                max_days_per_year INT DEFAULT 0 COMMENT '0 = unlimited',
                carry_forward BOOLEAN DEFAULT FALSE,
                encashable BOOLEAN DEFAULT FALSE,
                requires_approval BOOLEAN DEFAULT TRUE,
                min_days_notice INT DEFAULT 0,
                status VARCHAR(20) DEFAULT 'active',
                created_by BIGINT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_leave_code (leave_code),
                INDEX idx_leave_name (leave_name),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ leave_types table created');

        // 5. Leave Balances
        console.log('5. Creating leave_balances table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS leave_balances (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                employee_id BIGINT NOT NULL,
                leave_type_id BIGINT NOT NULL,
                year INT NOT NULL,
                opening_balance DECIMAL(5,2) DEFAULT 0,
                accrued DECIMAL(5,2) DEFAULT 0,
                used DECIMAL(5,2) DEFAULT 0,
                encashed DECIMAL(5,2) DEFAULT 0,
                carried_forward DECIMAL(5,2) DEFAULT 0,
                closing_balance DECIMAL(5,2) GENERATED ALWAYS AS (
                    opening_balance + accrued - used - encashed + carried_forward
                ) STORED,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
                FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE,
                UNIQUE KEY uk_employee_type_year (employee_id, leave_type_id, year),
                INDEX idx_employee_id (employee_id),
                INDEX idx_leave_type_id (leave_type_id),
                INDEX idx_year (year)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ leave_balances table created');

        // 6. Leave Requests
        console.log('6. Creating leave_requests table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS leave_requests (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                employee_id BIGINT NOT NULL,
                leave_type_id BIGINT NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                total_days DECIMAL(5,2) NOT NULL,
                reason TEXT,
                status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, approved, rejected, cancelled',
                approved_by BIGINT NULL,
                approved_at DATETIME NULL,
                rejection_reason TEXT,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
                FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT,
                FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_employee_id (employee_id),
                INDEX idx_leave_type_id (leave_type_id),
                INDEX idx_status (status),
                INDEX idx_start_date (start_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ leave_requests table created');

        // 7. Timesheets
        console.log('7. Creating timesheets table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS timesheets (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                employee_id BIGINT NOT NULL,
                timesheet_date DATE NOT NULL,
                project_code VARCHAR(50),
                task_description TEXT,
                hours_worked DECIMAL(5,2) NOT NULL,
                is_billable BOOLEAN DEFAULT TRUE,
                status VARCHAR(20) DEFAULT 'draft' COMMENT 'draft, submitted, approved, rejected',
                approved_by BIGINT NULL,
                approved_at DATETIME NULL,
                rejection_reason TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
                FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_employee_id (employee_id),
                INDEX idx_timesheet_date (timesheet_date),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ timesheets table created');

        // 8. Insert default leave types
        console.log('8. Inserting default leave types...');
        await connection.query(`
            INSERT INTO leave_types 
            (leave_code, leave_name, max_days_per_year, carry_forward, encashable, requires_approval, min_days_notice) VALUES
            ('CL', 'Casual Leave', 12, FALSE, FALSE, TRUE, 0),
            ('SL', 'Sick Leave', 10, FALSE, FALSE, TRUE, 0),
            ('EL', 'Earned Leave', 21, TRUE, TRUE, TRUE, 7),
            ('ML', 'Maternity Leave', 180, FALSE, FALSE, TRUE, 30),
            ('PL', 'Paternity Leave', 15, FALSE, FALSE, TRUE, 15),
            ('LWP', 'Leave Without Pay', 0, FALSE, FALSE, TRUE, 0),
            ('WFH', 'Work From Home', 0, FALSE, FALSE, TRUE, 0)
        `);
        console.log('   ✓ Default leave types inserted');

        await connection.commit();
        console.log('\n✓ Phase 3 Migration completed successfully!');

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
    console.log('Rolling back migration: Remove Time & Attendance, Leave...');

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query('DROP TABLE IF EXISTS timesheets');
        console.log('   ✓ Dropped timesheets table');

        await connection.query('DROP TABLE IF EXISTS leave_requests');
        console.log('   ✓ Dropped leave_requests table');

        await connection.query('DROP TABLE IF EXISTS leave_balances');
        console.log('   ✓ Dropped leave_balances table');

        await connection.query('DROP TABLE IF EXISTS leave_types');
        console.log('   ✓ Dropped leave_types table');

        await connection.query('DROP TABLE IF EXISTS attendance_records');
        console.log('   ✓ Dropped attendance_records table');

        await connection.query('DROP TABLE IF EXISTS holiday_calendar');
        console.log('   ✓ Dropped holiday_calendar table');

        await connection.query('DROP TABLE IF EXISTS shifts');
        console.log('   ✓ Dropped shifts table');

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
    console.log('Usage: node migrations/004_time_attendance_leave.js [up|down]');
    process.exit(1);
}
