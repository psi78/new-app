const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { dbConfig } = require('./database/config');

async function restoreDatabase() {
    console.log('Starting safe database restoration...');

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'database', 'restored_full_dump.sql');
    if (!fs.existsSync(sqlFile)) {
        console.error('SQL file not found:', sqlFile);
        process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Manually split by semi-colon but handle simple cases
    // This is a rough split, but sufficient for standard dumps
    // Remove comments to verify splitting is cleaner
    const statements = sqlContent
        .replace(/--.*$/gm, '') // Remove single line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    const connection = await mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        multipleStatements: true
    });

    try {
        console.log(`Connected to MySQL server. Preparing to restore...`);

        // Ensure database exists and select it
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
        await connection.query(`USE \`${dbConfig.database}\``);

        // Disable FK checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        console.log(`Selected database: ${dbConfig.database} (FK Checks Disabled)`);

        console.log(`Found ${statements.length} statements to execute.`);

        // Execute statements
        for (let i = 0; i < statements.length; i++) {
            const sql = statements[i];
            try {
                // Skip empty statements
                if (!sql || sql.length === 0) continue;

                await connection.query(sql);
                // process.stdout.write('.');
            } catch (err) {
                console.warn(`\nWarning executing statement ${i + 1}: ${err.message.split('\n')[0]}`);
                // console.warn(`SQL snippet: ${sql.substring(0, 50)}...`);
            }
        }

        // Re-enable FK checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('\nRestoration complete.');
    } catch (err) {
        console.error('Fatal error during restoration:', err);
    } finally {
        await connection.end();
    }
}

restoreDatabase();
