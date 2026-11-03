require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..', '..');
const SQL_DIR = path.join(__dirname, 'migrations');
const JS_DIR = path.join(ROOT_DIR, 'migrations');

const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hrm',
    port: parseInt(process.env.DB_PORT) || 3306
};

const args = process.argv.slice(2);
const FORCE = args.includes('--force') || args.includes('-f');
const SQL_ONLY = args.includes('--sql-only');
const JS_ONLY = args.includes('--js-only');

/**
 * MySQL errors that mean "this migration was already applied" rather than a
 * genuine failure. They are downgraded to warnings so the runner can be used
 * against databases that were migrated before tracking existed.
 */
const IGNORABLE_ERRNOS = new Set([
    1022, // ER_DUP_KEY
    1050, // ER_TABLE_EXISTS_ERROR
    1060, // ER_DUP_FIELDNAME
    1061, // ER_DUP_KEYNAME
    1062, // ER_DUP_ENTRY
    1091, // ER_CANT_DROP_FIELD_OR_KEY
    1826, // ER_FK_DUP_NAME
    3822  // ER_CHECK_CONSTRAINT_DUP_NAME
]);

const IGNORABLE_JS_OUTPUT = [
    'Duplicate column name',
    'Duplicate entry',
    'Duplicate key name',
    'already exists',
    "Can't DROP",
    'ER_DUP_FIELDNAME',
    'ER_DUP_ENTRY',
    'ER_TABLE_EXISTS_ERROR',
    'ER_CANT_DROP_FIELD_OR_KEY',
    'ER_FK_DUP_NAME'
];

function log(message = '') {
    console.log(message);
}

function warn(message) {
    console.log(`   ⚠️  ${message}`);
}

function loadFiles(dir, extension) {
    if (!fs.existsSync(dir)) {
        return [];
    }

    return fs
        .readdirSync(dir)
        .filter((file) => file.toLowerCase().endsWith(extension))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map((file) => ({
            filename: file,
            path: path.join(dir, file)
        }));
}

/**
 * Split a SQL script into individual statements while respecting quotes and
 * `--`, `#` and block comments. `USE ...` statements are dropped so the
 * migrations always run against the configured database.
 */
function splitSqlStatements(sql) {
    const statements = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;
    let inBacktick = false;
    let inLineComment = false;
    let inBlockComment = false;

    const push = () => {
        const statement = current.trim();
        if (statement && !/^USE\s+/i.test(statement)) {
            statements.push(statement);
        }
        current = '';
    };

    for (let i = 0; i < sql.length; i += 1) {
        const char = sql[i];
        const next = sql[i + 1];

        if (inLineComment) {
            if (char === '\n') {
                inLineComment = false;
                current += char;
            }
            continue;
        }

        if (inBlockComment) {
            if (char === '*' && next === '/') {
                inBlockComment = false;
                i += 1;
            }
            continue;
        }

        if (inSingle) {
            if (char === "'") {
                if (next === "'") {
                    current += "''";
                    i += 1;
                    continue;
                }
                inSingle = false;
            }
            current += char;
            continue;
        }

        if (inDouble) {
            if (char === '"') {
                if (next === '"') {
                    current += '""';
                    i += 1;
                    continue;
                }
                inDouble = false;
            }
            current += char;
            continue;
        }

        if (inBacktick) {
            if (char === '`') {
                inBacktick = false;
            }
            current += char;
            continue;
        }

        if (char === '-' && next === '-') {
            inLineComment = true;
            i += 1;
            continue;
        }

        if (char === '#') {
            inLineComment = true;
            continue;
        }

        if (char === '/' && next === '*') {
            inBlockComment = true;
            i += 1;
            continue;
        }

        if (char === "'") {
            inSingle = true;
            current += char;
            continue;
        }

        if (char === '"') {
            inDouble = true;
            current += char;
            continue;
        }

        if (char === '`') {
            inBacktick = true;
            current += char;
            continue;
        }

        if (char === ';') {
            push();
            continue;
        }

        current += char;
    }

    push();
    return statements;
}

async function ensureTrackingTable(connection) {
    await connection.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id INT PRIMARY KEY AUTO_INCREMENT,
            filename VARCHAR(255) NOT NULL UNIQUE,
            type ENUM('sql', 'js') NOT NULL,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

async function getAppliedMigrations(connection) {
    const [rows] = await connection.query('SELECT filename FROM schema_migrations');
    return new Set(rows.map((row) => row.filename));
}

async function markApplied(connection, filename, type) {
    await connection.query(
        'INSERT IGNORE INTO schema_migrations (filename, type) VALUES (?, ?)',
        [filename, type]
    );
}

async function tableExists(connection, tableName) {
    const [rows] = await connection.query('SHOW TABLES LIKE ?', [tableName]);
    return rows.length > 0;
}

async function runSqlMigration(connection, migration) {
    const sql = fs.readFileSync(migration.path, 'utf8');
    const statements = splitSqlStatements(sql);

    let executed = 0;
    let skipped = 0;

    for (const statement of statements) {
        try {
            await connection.query(statement);
            executed += 1;
        } catch (error) {
            if (IGNORABLE_ERRNOS.has(error.errno)) {
                skipped += 1;
                continue;
            }
            throw new Error(`${migration.filename}: ${error.message}`);
        }
    }

    return { executed, skipped };
}

function runJsMigration(migration) {
    const result = spawnSync(process.execPath, [migration.path, 'up'], {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        env: process.env,
        timeout: 5 * 60 * 1000
    });

    if (result.stdout) {
        process.stdout.write(result.stdout);
    }
    if (result.stderr) {
        process.stderr.write(result.stderr);
    }

    if (result.error) {
        throw new Error(`${migration.filename}: ${result.error.message}`);
    }

    if (result.status === 0) {
        return { skipped: false };
    }

    const output = `${result.stdout || ''}\n${result.stderr || ''}`;
    if (IGNORABLE_JS_OUTPUT.some((needle) => output.includes(needle))) {
        return { skipped: true };
    }

    throw new Error(
        `${migration.filename}: exited with code ${result.status}. ` +
        'See the migration output above for details.'
    );
}

async function bootstrapExistingDatabase(connection, migrations) {
    // Before this tracker existed, databases were migrated by running the
    // files manually. `employee_lifecycle_states` is only created by the JS
    // migrations (never by schema.sql), so its presence is a reliable signal
    // that the database has already been migrated.
    const alreadyMigrated =
        (await tableExists(connection, 'employee_lifecycle_states')) ||
        (await tableExists(connection, 'employee_job_changes'));

    if (!alreadyMigrated) {
        return false;
    }

    for (const migration of migrations) {
        await markApplied(connection, migration.filename, migration.type);
    }

    log('ℹ️  Existing database detected (pre-tracking migrations found).');
    log(`   Recorded ${migrations.length} migration(s) as already applied.`);
    log('   Use --force to run them again.\n');

    return true;
}

async function run() {
    log('🚀 HRM Database Migration Runner\n');

    const sqlMigrations = loadFiles(SQL_DIR, '.sql').map((migration) => ({
        ...migration,
        type: 'sql'
    }));
    const jsMigrations = loadFiles(JS_DIR, '.js').map((migration) => ({
        ...migration,
        type: 'js'
    }));

    const selected = [];
    if (!JS_ONLY) {
        selected.push(...sqlMigrations);
    }
    if (!SQL_ONLY) {
        selected.push(...jsMigrations);
    }

    if (selected.length === 0) {
        log('No migration files found.');
        return;
    }

    let connection;

    try {
        log('📡 Connecting to database...');
        connection = await mysql.createConnection(config);
        log(`✅ Connected to "${config.database}"\n`);

        await ensureTrackingTable(connection);

        let applied = await getAppliedMigrations(connection);

        if (!FORCE && applied.size === 0) {
            const bootstrapped = await bootstrapExistingDatabase(connection, selected);
            if (bootstrapped) {
                applied = await getAppliedMigrations(connection);
            }
        }

        log(`📋 Found ${selected.length} migration file(s) ` +
            `(${sqlMigrations.length} SQL, ${jsMigrations.length} JS)\n`);

        const summary = {
            sql: { applied: 0, skipped: 0, warnings: 0 },
            js: { applied: 0, skipped: 0, warnings: 0 }
        };

        for (const migration of selected) {
            if (!FORCE && applied.has(migration.filename)) {
                log(`⏭️  ${migration.filename} (already applied)`);
                summary[migration.type].skipped += 1;
                continue;
            }

            log(`▶️  ${migration.filename}`);

            if (migration.type === 'sql') {
                const { executed, skipped } = await runSqlMigration(connection, migration);
                log(`   ✅ ${executed} statement(s) executed, ${skipped} already applied`);
                summary.sql.applied += 1;
                summary.sql.warnings += skipped;
            } else {
                const { skipped } = runJsMigration(migration);
                if (skipped) {
                    warn('already applied (duplicate objects detected)');
                    summary.js.warnings += 1;
                } else {
                    log('   ✅ completed');
                }
                summary.js.applied += 1;
            }

            await markApplied(connection, migration.filename, migration.type);
            applied.add(migration.filename);
        }

        log('\n📊 Migration Summary');
        log('──────────────────────────────');
        log(`   SQL: ${summary.sql.applied} applied, ` +
            `${summary.sql.skipped} skipped, ${summary.sql.warnings} warning(s)`);
        log(`   JS : ${summary.js.applied} applied, ` +
            `${summary.js.skipped} skipped, ${summary.js.warnings} warning(s)`);

        log('\n✨ Migration run completed successfully.');
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exitCode = 1;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

run();
