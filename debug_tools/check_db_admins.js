const { query } = require('./database/config');
async function check() {
    const admins = await query("SELECT id, admin_id, name, role FROM admin_registry");
    console.log("ADMINS IN DB:");
    console.table(admins);
}
check();
