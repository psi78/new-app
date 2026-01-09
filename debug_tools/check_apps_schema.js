const { query } = require("./j/database/config");

async function checkSchema() {
    try {
        const columns = await query("SHOW COLUMNS FROM applications");
        console.log("Columns in applications:");
        console.table(columns);
        process.exit(0);
    } catch (err) {
        console.error("DB Error:", err);
        process.exit(1);
    }
}

checkSchema();
