const { query } = require('./database/config');

async function listApps() {
    try {
        const apps = await query("SELECT * FROM applications");
        console.log(JSON.stringify(apps, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listApps();
