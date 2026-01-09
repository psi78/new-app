const { query } = require("./j/database/config");

async function listTables() {
    try {
        const tables = await query("SHOW TABLES");
        console.log("Tables in database:");
        console.table(tables);
        process.exit(0);
    } catch (err) {
        console.error("DB Error:", err);
        process.exit(1);
    }
}

listTables();
