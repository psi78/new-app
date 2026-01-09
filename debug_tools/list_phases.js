const { query } = require('./database/config');

async function listPhases() {
    try {
        const phases = await query("SELECT * FROM phases WHERE status = 'Active'");
        console.log("Active Phases:", JSON.stringify(phases, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listPhases();
