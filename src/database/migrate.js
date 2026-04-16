require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hrm',
    port: parseInt(process.env.DB_PORT) || 3306,
    multipleStatements: true
};

async function runMigration() {
    console.log('🚀 Starting Enterprise Migration...\n');
    
    let connection;
    
    try {
        console.log('📡 Connecting to database...');
        connection = await mysql.createConnection(config);
        console.log('✅ Connected to database\n');

        const migrationFile = path.join(__dirname, '002_create_enterprise_tables.sql');
        
        if (!fs.existsSync(migrationFile)) {
            throw new Error(`Migration file not found: ${migrationFile}`);
        }

        const sql = fs.readFileSync(migrationFile, 'utf8');
        
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`📝 Executing ${statements.length} SQL statements...\n`);
        
        let successCount = 0;
        let errorCount = 0;

        for (const statement of statements) {
            try {
                if (statement.trim()) {
                    await connection.execute(statement);
                    successCount++;
                    const firstWord = statement.split(/\s+/).slice(0, 3).join(' ');
                    console.log(`  ✅ ${firstWord}...`);
                }
            } catch (error) {
                errorCount++;
                if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log(`  ⚠️  Table already exists (skipped)`);
                } else {
                    console.log(`  ❌ Error: ${error.message}`);
                }
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ⚠️  Skipped/Errors: ${errorCount}`);
        
        const [tables] = await connection.execute("SHOW TABLES");
        console.log('\n📋 Current Tables:');
        tables.forEach(t => console.log(`   - ${Object.values(t)[0]}`));

        console.log('\n✨ Enterprise migration completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();
