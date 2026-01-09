const { query } = require("./database/config");

async function checkAppAdmin() {
    try {
        const admins = await query("SELECT * FROM admin_registry WHERE admin_id = 'app_admin'");
        console.log("app_admin record:");
        if (admins.length > 0) {
            console.table(admins);
        } else {
            console.log("❌ app_admin NOT FOUND in database");
        }
        process.exit(0);
    } catch (err) {
        console.error("DB Error:", err);
        process.exit(1);
    }
}

checkAppAdmin();
