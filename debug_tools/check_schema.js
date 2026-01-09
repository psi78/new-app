const { query } = require("./database/config");

async function checkSchema() {
    try {
        const columns = await query("SHOW COLUMNS FROM admin_registry");
        console.log("Columns in admin_registry:");
        console.table(columns);
        process.exit(0);
    } catch (err) {
        console.error("DB Error:", err);
        process.exit(1);
    }
}

checkSchema();
