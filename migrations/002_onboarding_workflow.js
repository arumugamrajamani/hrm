/**
 * Migration: Employee Onboarding Workflow
 * Phase 2: Onboarding Workflow
 * 
 * Run: node migrations/002_onboarding_workflow.js
 */

const { pool } = require('../src/config/database');
const logger = require('../src/utils/logger');

async function up() {
    console.log('Starting migration: Employee Onboarding Workflow...');

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Onboarding Checklist Templates
        console.log('1. Creating onboarding_checklist_templates table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS onboarding_checklist_templates (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                template_name VARCHAR(100) NOT NULL,
                description TEXT,
                applicable_for VARCHAR(50) COMMENT 'role, department, location, designation',
                applicable_id BIGINT NULL COMMENT 'ID of role/dept/loc/desig',
                is_active BOOLEAN DEFAULT TRUE,
                created_by BIGINT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_template_name (template_name),
                INDEX idx_applicable_for (applicable_for),
                INDEX idx_is_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ onboarding_checklist_templates table created');

        // 2. Checklist Items
        console.log('2. Creating checklist_items table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS checklist_items (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                template_id BIGINT NOT NULL,
                item_name VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(50) COMMENT 'document, it_asset, id_card, induction, training, other',
                is_mandatory BOOLEAN DEFAULT TRUE,
                sort_order INT DEFAULT 0,
                estimated_days INT DEFAULT 1 COMMENT 'Days to complete from joining',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (template_id) REFERENCES onboarding_checklist_templates(id) ON DELETE CASCADE,
                INDEX idx_template_id (template_id),
                INDEX idx_category (category),
                INDEX idx_sort_order (sort_order)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ checklist_items table created');

        // 3. Employee Onboarding Records
        console.log('3. Creating employee_onboarding table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS employee_onboarding (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                employee_id BIGINT NOT NULL,
                template_id BIGINT NULL,
                status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, in_progress, completed, delayed',
                joining_date DATE NOT NULL,
                actual_joining_date DATE NULL,
                probation_end_date DATE NULL,
                confirmation_date DATE NULL,
                onboarding_completion_date DATE NULL,
                remarks TEXT,
                created_by BIGINT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
                FOREIGN KEY (template_id) REFERENCES onboarding_checklist_templates(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_employee_id (employee_id),
                INDEX idx_status (status),
                INDEX idx_joining_date (joining_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ employee_onboarding table created');

        // 4. Employee Checklist Progress
        console.log('4. Creating employee_checklist_progress table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS employee_checklist_progress (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                onboarding_id BIGINT NOT NULL,
                checklist_item_id BIGINT NOT NULL,
                status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, in_progress, completed, skipped',
                completed_by BIGINT NULL,
                completed_at DATETIME NULL,
                remarks TEXT,
                attachment_path VARCHAR(255) NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (onboarding_id) REFERENCES employee_onboarding(id) ON DELETE CASCADE,
                FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id) ON DELETE CASCADE,
                FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_onboarding_id (onboarding_id),
                INDEX idx_checklist_item_id (checklist_item_id),
                INDEX idx_status (status),
                UNIQUE KEY uk_onboarding_item (onboarding_id, checklist_item_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ employee_checklist_progress table created');

        // 5. Probation Tracking
        console.log('5. Creating probation_tracking table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS probation_tracking (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                employee_id BIGINT NOT NULL,
                probation_start_date DATE NOT NULL,
                probation_end_date DATE NOT NULL,
                status VARCHAR(20) DEFAULT 'in_progress' COMMENT 'in_progress, confirmed, extended, terminated',
                extension_days INT DEFAULT 0,
                confirmation_date DATE NULL,
                confirmed_by BIGINT NULL,
                manager_feedback TEXT,
                hr_feedback TEXT,
                self_assessment TEXT,
                performance_rating VARCHAR(10) COMMENT 'excellent, good, average, poor',
                created_by BIGINT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
                FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_employee_id (employee_id),
                INDEX idx_status (status),
                INDEX idx_probation_end_date (probation_end_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ probation_tracking table created');

        // 6. Insert default checklist templates
        console.log('6. Inserting default checklist templates...');
        const [templateResult] = await connection.query(`
            INSERT INTO onboarding_checklist_templates (template_name, description, applicable_for, is_active, created_by) VALUES
            ('Standard Employee Onboarding', 'Default checklist for all employees', NULL, TRUE, 1),
            ('IT Department Onboarding', 'Special checklist for IT employees', 'department', TRUE, 1),
            ('Manager Onboarding', 'Enhanced checklist for managerial roles', 'role', TRUE, 1)
        `);
        console.log(`   ✓ Inserted ${templateResult.affectedRows} default templates`);

        // 7. Insert default checklist items for Standard template
        console.log('7. Inserting default checklist items...');
        const [itemsResult] = await connection.query(`
            INSERT INTO checklist_items (template_id, item_name, description, category, is_mandatory, sort_order, estimated_days) VALUES
            (1, 'Offer Letter Acceptance', 'Accept offer letter and upload signed copy', 'document', TRUE, 1, 0),
            (1, 'ID Card Creation', 'Create employee ID card', 'id_card', TRUE, 2, 1),
            (1, 'Email Account Setup', 'Create corporate email account', 'it_asset', TRUE, 3, 1),
            (1, 'Laptop/System Allocation', 'Allocate laptop and system access', 'it_asset', TRUE, 4, 2),
            (1, 'Document Collection', 'Collect all mandatory documents', 'document', TRUE, 5, 3),
            (1, 'HR Induction Session', 'Complete HR induction and policy briefing', 'induction', TRUE, 6, 3),
            (1, 'Security Badge Issue', 'Issue security access badge', 'id_card', TRUE, 7, 2),
            (1, 'Department Induction', 'Complete department-specific induction', 'induction', FALSE, 8, 5),
            (1, 'Payroll Enrollment', 'Enroll in payroll system', 'training', TRUE, 9, 3),
            (1, 'Buddy Assignment', 'Assign onboarding buddy', 'other', FALSE, 10, 1)
        `);
        console.log(`   ✓ Inserted ${itemsResult.affectedRows} default checklist items`);

        await connection.commit();
        console.log('\n✓ Phase 2 Migration completed successfully!');

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
    console.log('Rolling back migration: Remove Onboarding Workflow...');

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query('DROP TABLE IF EXISTS probation_tracking');
        console.log('   ✓ Dropped probation_tracking table');

        await connection.query('DROP TABLE IF EXISTS employee_checklist_progress');
        console.log('   ✓ Dropped employee_checklist_progress table');

        await connection.query('DROP TABLE IF EXISTS employee_onboarding');
        console.log('   ✓ Dropped employee_onboarding table');

        await connection.query('DROP TABLE IF EXISTS checklist_items');
        console.log('   ✓ Dropped checklist_items table');

        await connection.query('DROP TABLE IF EXISTS onboarding_checklist_templates');
        console.log('   ✓ Dropped onboarding_checklist_templates table');

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
    console.log('Usage: node migrations/002_onboarding_workflow.js [up|down]');
    process.exit(1);
}
