const { query } = require('./database/config');

async function checkTables() {
    try {
        const tables = await query("SHOW TABLES");
        console.log("Tables in DB:", JSON.stringify(tables, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTables();
