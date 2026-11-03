/**
 * Migration: Fix audit_logs entity type and action column sizing
 * Brings existing audit_logs tables that were created before the schema
 * correction in line with the application contract.
 */

const mysql = require('../node_modules/mysql2/promise');

async function up() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hrm_db',
        port: parseInt(process.env.DB_PORT) || 3306
    });

    try {
        const [columns] = await connection.query(
            `SELECT COLUMN_NAME, CHARACTER_MAXIMUM_LENGTH
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'audit_logs'`
        );

        const columnNames = new Set(columns.map((column) => column.COLUMN_NAME));

        if (!columnNames.has('entity_type') && columnNames.has('entity_name')) {
            await connection.query(
                `ALTER TABLE audit_logs CHANGE COLUMN entity_name entity_type VARCHAR(50) NOT NULL`
            );
            console.log('   ✓ Renamed audit_logs.entity_name to entity_type');
        } else if (!columnNames.has('entity_type')) {
            await connection.query(
                `ALTER TABLE audit_logs ADD COLUMN entity_type VARCHAR(50) NOT NULL AFTER action`
            );
            console.log('   ✓ Added missing audit_logs.entity_type column');
        }

        const actionColumn = columns.find((column) => column.COLUMN_NAME === 'action');
        if (actionColumn && actionColumn.CHARACTER_MAXIMUM_LENGTH < 50) {
            await connection.query(`ALTER TABLE audit_logs MODIFY COLUMN action VARCHAR(50) NOT NULL`);
            console.log('   ✓ Widened audit_logs.action column');
        }

        await connection.commit();
        console.log('✓ Audit logs migration completed successfully!');
    } finally {
        await connection.end();
    }
}

async function down() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hrm_db',
        port: parseInt(process.env.DB_PORT) || 3306
    });

    try {
        const [columns] = await connection.query(
            `SELECT COLUMN_NAME, CHARACTER_MAXIMUM_LENGTH
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'audit_logs'`
        );

        const actionColumn = columns.find((column) => column.COLUMN_NAME === 'action');
        if (actionColumn && actionColumn.CHARACTER_MAXIMUM_LENGTH > 20) {
            await connection.query(`ALTER TABLE audit_logs MODIFY COLUMN action VARCHAR(20) NOT NULL`);
        }

        const [currentColumns] = await connection.query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'audit_logs'`
        );
        const columnNames = new Set(currentColumns.map((column) => column.COLUMN_NAME));

        if (columnNames.has('entity_type') && !columnNames.has('entity_name')) {
            await connection.query(`ALTER TABLE audit_logs CHANGE COLUMN entity_type entity_name VARCHAR(50) NOT NULL`);
        }

        await connection.commit();
    } finally {
        await connection.end();
    }
}

module.exports = { up, down };
module.exports.default = module.exports;

const command = process.argv[2] || 'up';

if (command === 'up') {
    up()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Migration failed:', err);
            process.exit(1);
        });
} else if (command === 'down') {
    down()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Rollback failed:', err);
            process.exit(1);
        });
}
