const { query } = require('./database/config');

async function deleteApp5() {
    try {
        // Delete by specific application_id from the logs
        await query("DELETE FROM applications WHERE application_id = ?", ['APP-1767643894900']);
        console.log("Deleted APP-1767643894900");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

deleteApp5();
