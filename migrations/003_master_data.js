/**
 * Migration: Master Data - Company, Business Units, Grades/Bands
 * Phase 2: Master Data Platform
 * 
 * Run: node migrations/003_master_data.js
 */

const { pool } = require('../src/config/database');
const logger = require('../src/utils/logger');

async function up() {
    console.log('Starting migration: Master Data (Company, Business Units, Grades/Bands)...');

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Companies Table
        console.log('1. Creating companies table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS companies (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                company_name VARCHAR(200) NOT NULL,
                company_code VARCHAR(20) UNIQUE NOT NULL,
                registration_number VARCHAR(100),
                tax_id VARCHAR(50),
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                country VARCHAR(100) DEFAULT 'India',
                pincode VARCHAR(20),
                phone VARCHAR(20),
                email VARCHAR(100),
                website VARCHAR(255),
                is_headquarters BOOLEAN DEFAULT FALSE,
                status VARCHAR(20) DEFAULT 'active',
                created_by BIGINT NULL,
                updated_by BIGINT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_company_code (company_code),
                INDEX idx_company_name (company_name),
                INDEX idx_status (status),
                INDEX idx_is_headquarters (is_headquarters)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ companies table created');

        // 2. Business Units Table
        console.log('2. Creating business_units table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS business_units (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                unit_name VARCHAR(100) NOT NULL,
                unit_code VARCHAR(20) UNIQUE NOT NULL,
                company_id BIGINT NOT NULL,
                parent_unit_id BIGINT NULL,
                description TEXT,
                head_of_unit BIGINT NULL COMMENT 'Employee ID of unit head',
                cost_center VARCHAR(50),
                status VARCHAR(20) DEFAULT 'active',
                created_by BIGINT NULL,
                updated_by BIGINT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_unit_id) REFERENCES business_units(id) ON DELETE SET NULL,
                FOREIGN KEY (head_of_unit) REFERENCES employees(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_unit_code (unit_code),
                INDEX idx_unit_name (unit_name),
                INDEX idx_company_id (company_id),
                INDEX idx_parent_unit_id (parent_unit_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ business_units table created');

        // 3. Grades/Bands Table
        console.log('3. Creating grades_master table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS grades_master (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                grade_code VARCHAR(20) UNIQUE NOT NULL,
                grade_name VARCHAR(100) NOT NULL,
                level INT NOT NULL,
                min_salary DECIMAL(12,2),
                max_salary DECIMAL(12,2),
                band VARCHAR(10) COMMENT 'A, B, C, etc.',
                description TEXT,
                status VARCHAR(20) DEFAULT 'active',
                created_by BIGINT NULL,
                updated_by BIGINT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_grade_code (grade_code),
                INDEX idx_grade_name (grade_name),
                INDEX idx_level (level),
                INDEX idx_band (band),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ grades_master table created');

        // 4. Update departments table to link to business_unit
        console.log('4. Adding business_unit_id to departments table...');
        await connection.query(`
            ALTER TABLE departments 
            ADD COLUMN business_unit_id BIGINT NULL AFTER department_code,
            ADD COLUMN company_id BIGINT NULL AFTER business_unit_id,
            ADD INDEX idx_business_unit_id (business_unit_id),
            ADD INDEX idx_company_id (company_id),
            ADD FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE SET NULL,
            ADD FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
        `);
        console.log('   ✓ departments table updated with business_unit_id and company_id');

        // 5. Update designations_master to link to grade
        console.log('5. Adding grade_id to designations_master table...');
        await connection.query(`
            ALTER TABLE designations_master 
            ADD COLUMN grade_id BIGINT NULL AFTER grade_level,
            ADD INDEX idx_grade_id (grade_id),
            ADD FOREIGN KEY (grade_id) REFERENCES grades_master(id) ON DELETE SET NULL
        `);
        console.log('   ✓ designations_master table updated with grade_id');

        // 6. Insert default company
        console.log('6. Inserting default company...');
        const [companyResult] = await connection.query(`
            INSERT INTO companies (company_name, company_code, is_headquarters, status) VALUES
            ('Acme Corporation', 'ACME', TRUE, 'active')
        `);
        console.log(`   ✓ Default company created with ID: ${companyResult.insertId}`);

        // 7. Insert default business units
        console.log('7. Inserting default business units...');
        await connection.query(`
            INSERT INTO business_units (unit_name, unit_code, company_id, description, status) VALUES
            ('Technology', 'TECH', ${companyResult.insertId}, 'Technology and Engineering Division', 'active'),
            ('Sales & Marketing', 'SALES', ${companyResult.insertId}, 'Sales and Business Development', 'active'),
            ('Human Resources', 'HR', ${companyResult.insertId}, 'HR and People Operations', 'active'),
            ('Finance', 'FIN', ${companyResult.insertId}, 'Finance and Accounting', 'active'),
            ('Operations', 'OPS', ${companyResult.insertId}, 'Operations and Administration', 'active')
        `);
        console.log('   ✓ Default business units inserted');

        // 8. Insert default grades/bands
        console.log('8. Inserting default grades/bands...');
        await connection.query(`
            INSERT INTO grades_master (grade_code, grade_name, level, band, min_salary, max_salary, status) VALUES
            ('TR-01', 'Trainee', 1, 'A', 25000, 35000, 'active'),
            ('ENG-02', 'Junior Engineer', 2, 'A', 35000, 50000, 'active'),
            ('ENG-03', 'Engineer', 3, 'B', 50000, 75000, 'active'),
            ('ENG-04', 'Senior Engineer', 4, 'B', 75000, 100000, 'active'),
            ('ENG-05', 'Lead Engineer', 5, 'C', 100000, 150000, 'active'),
            ('ENG-06', 'Technical Lead', 6, 'C', 150000, 200000, 'active'),
            ('MGT-07', 'Manager', 7, 'D', 200000, 300000, 'active'),
            ('MGT-08', 'Senior Manager', 8, 'D', 300000, 450000, 'active'),
            ('MGT-09', 'Director', 9, 'E', 450000, 600000, 'active'),
            ('EXEC-10', 'VP/SVP', 10, 'E', 600000, 1000000, 'active')
        `);
        console.log('   ✓ Default grades/bands inserted');

        // 9. Update existing departments with business_unit_id
        console.log('9. Linking departments to business units...');
        const [units] = await connection.query('SELECT id, unit_code FROM business_units');
        const unitMap = {};
        units.forEach(u => { unitMap[u.unit_code] = u.id; });

        if (unitMap['TECH']) await connection.query('UPDATE departments SET business_unit_id = ? WHERE department_code IN ("ENG", "QA", "DEVOPS", "UIUX", "PM")', [unitMap['TECH']]);
        if (unitMap['HR']) await connection.query('UPDATE departments SET business_unit_id = ? WHERE department_code IN ("HR")', [unitMap['HR']]);
        if (unitMap['FIN']) await connection.query('UPDATE departments SET business_unit_id = ? WHERE department_code IN ("FIN")', [unitMap['FIN']]);
        if (unitMap['SALES']) await connection.query('UPDATE departments SET business_unit_id = ? WHERE department_code IN ("SALES", "BD", "MKT")', [unitMap['SALES']]);
        if (unitMap['OPS']) await connection.query('UPDATE departments SET business_unit_id = ? WHERE department_code IN ("SUPPORT", "ADMIN", "ITSUPP")', [unitMap['OPS']]);
        console.log('   ✓ Departments linked to business units');

        // 10. Update existing designations with grade_id
        console.log('10. Linking designations to grades...');
        const [grades] = await connection.query('SELECT id, grade_code FROM grades_master');
        const gradeMap = {};
        grades.forEach(g => { gradeMap[g.grade_code] = g.id; });

        await connection.query('UPDATE designations_master SET grade_id = ? WHERE designation_code = "TRAIN"', [gradeMap['TR-01']]);
        await connection.query('UPDATE designations_master SET grade_id = ? WHERE designation_code IN ("JSE", "QA-ENG")', [gradeMap['ENG-02']]);
        await connection.query('UPDATE designations_master SET grade_id = ? WHERE designation_code IN ("SE", "SQA-ENG")', [gradeMap['ENG-03']]);
        await connection.query('UPDATE designations_master SET grade_id = ? WHERE designation_code IN ("SSE")', [gradeMap['ENG-04']]);
        await connection.query('UPDATE designations_master SET grade_id = ? WHERE designation_code IN ("TL")', [gradeMap['ENG-05']]);
        await connection.query('UPDATE designations_master SET grade_id = ? WHERE designation_code IN ("TECH-L", "PM")', [gradeMap['ENG-06']]);
        await connection.query('UPDATE designations_master SET grade_id = ? WHERE designation_code IN ("SPM")', [gradeMap['MGT-07']]);
        await connection.query('UPDATE designations_master SET grade_id = ? WHERE designation_code IN ("HR-EXEC", "HR-MGR", "ADM-MGR")', [gradeMap['MGT-07']]);
        await connection.query('UPDATE designations_master SET grade_id = ? WHERE designation_code IN ("CEO", "CTO", "COO", "CFO")', [gradeMap['EXEC-10']]);
        console.log('   ✓ Designations linked to grades');

        await connection.commit();
        console.log('\n✓ Master Data Migration completed successfully!');

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
    console.log('Rolling back migration: Remove Master Data...');

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Remove foreign key columns from designations_master
        await connection.query(`
            ALTER TABLE designations_master 
            DROP FOREIGN KEY designations_master_ibfk_3,
            DROP COLUMN grade_id
        `).catch(() => {});
        console.log('   ✓ Removed grade_id from designations_master');

        // Remove foreign key columns from departments
        await connection.query(`
            ALTER TABLE departments 
            DROP FOREIGN KEY departments_ibfk_3,
            DROP FOREIGN KEY departments_ibfk_4,
            DROP COLUMN business_unit_id,
            DROP COLUMN company_id
        `).catch(() => {});
        console.log('   ✓ Removed business_unit_id and company_id from departments');

        // Drop tables in reverse order
        await connection.query('DROP TABLE IF EXISTS grades_master').catch(() => {});
        console.log('   ✓ Dropped grades_master table');

        await connection.query('DROP TABLE IF EXISTS business_units').catch(() => {});
        console.log('   ✓ Dropped business_units table');

        await connection.query('DROP TABLE IF EXISTS companies').catch(() => {});
        console.log('   ✓ Dropped companies table');

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
    console.log('Usage: node migrations/003_master_data.js [up|down]');
    process.exit(1);
}
