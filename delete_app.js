const { query } = require('./database/config');

async function deleteApp() {
    try {
        await query("DELETE FROM applications WHERE application_id = ?", ['APP-1767642541716']);
        console.log("Deleted APP-1767642541716");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

deleteApp();
