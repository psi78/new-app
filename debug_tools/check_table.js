const { query } = require('./database/config');

async function checkTable() {
    try {
        const cols = await query("DESCRIBE admin_registry");
        console.log("Table columns:", JSON.stringify(cols, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTable();
