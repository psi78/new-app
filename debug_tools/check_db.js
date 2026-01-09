const { query } = require("./database/config");

async function checkAdmins() {
    try {
        const admins = await query("SELECT * FROM admin_registry");
        console.log("Admin Registry Content:");
        admins.forEach(a => {
            console.log(`ID: ${a.id}, AdminID: ${a.admin_id}, Pass: ${a.password}, Role: ${a.role}, Perms: ${a.perms}`);
            try {
                if (a.perms) JSON.parse(a.perms);
            } catch (e) {
                console.log(`  Invalid JSON in perms for ${a.admin_id}: ${a.perms}`);
            }
        });
        process.exit(0);
    } catch (err) {
        console.error("DB Error:", err);
        process.exit(1);
    }
}

checkAdmins();
