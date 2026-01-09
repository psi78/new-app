const { query } = require('./database/config');

async function checkSysadmin() {
    try {
        const admins = await query("SELECT id, admin_id, password, role FROM admin_registry WHERE admin_id = 'sysadmin'");
        console.log("Sysadmin found:", JSON.stringify(admins, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSysadmin();
