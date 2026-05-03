/**
 * Migration: Employment Type Master Table
 * Creates employment_type_master table and inserts seed data
 */

const { pool } = require('../src/config/database');
const logger = require('../src/utils/logger');

async function up() {
    console.log('Starting migration: Create employment_type_master table...');

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Create employment_type_master table
        console.log('1. Creating employment_type_master table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS employment_type_master (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                employment_type_name VARCHAR(100) NOT NULL UNIQUE,
                employment_type_code VARCHAR(20) NOT NULL UNIQUE,
                description TEXT,
                status VARCHAR(20) DEFAULT 'active',
                created_by BIGINT NULL,
                updated_by BIGINT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_employment_type_code (employment_type_code),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ employment_type_master table created');

        // 2. Insert seed data for employment types
        console.log('2. Inserting employment type seed data...');
        await connection.query(`
            INSERT INTO employment_type_master 
                (employment_type_name, employment_type_code, description, status, created_by) 
            VALUES
                ('Full-Time', 'FT', 'Regular full-time employment with standard benefits', 'active', 1),
                ('Part-Time', 'PT', 'Part-time employment with reduced hours', 'active', 1),
                ('Contract', 'CONT', 'Contract-based employment for fixed duration', 'active', 1),
                ('Temporary', 'TEMP', 'Temporary employment for specific projects/periods', 'active', 1),
                ('Intern', 'INT', 'Internship program for students or trainees', 'active', 1),
                ('Freelancer', 'FR', 'Freelance or independent contractor', 'active', 1),
                ('Consultant', 'CONS', 'External consultant or advisor', 'active', 1)
        `);
        console.log('   ✓ Employment type seed data inserted');

        await connection.commit();
        console.log('\n✓ Employment Type Master migration completed successfully!');

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
    console.log('Rolling back migration: Drop employment_type_master table...');

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query('DROP TABLE IF EXISTS employment_type_master').catch(() => {});
        console.log('   ✓ Dropped employment_type_master table');

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
    console.log('Usage: node migrations/007_employment_type_master.js [up|down]');
    process.exit(1);
}
