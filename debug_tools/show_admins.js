const { query } = require('./database/config');

async function showAdmins() {
    try {
        const admins = await query("SELECT id, admin_id, name, role, perms FROM admin_registry");

        // Format the perms for better readability in the console
        const formattedAdmins = admins.map(a => {
            let permsDisplay = a.perms;
            try {
                if (typeof a.perms === 'string') {
                    const parsed = JSON.parse(a.perms);
                    permsDisplay = Array.isArray(parsed) ? parsed.join(', ') : a.perms;
                } else if (Array.isArray(a.perms)) {
                    permsDisplay = a.perms.join(', ');
                }
            } catch (e) { }

            return {
                ID: a.id,
                "Admin ID": a.admin_id,
                Name: a.name,
                Role: a.role,
                Permissions: permsDisplay
            };
        });

        console.log("\n--- Admin Registry Table Contents ---\n");
        console.table(formattedAdmins);
        console.log("\nTotal Admins:", admins.length);
        process.exit(0);
    } catch (err) {
        console.error("Error querying database:", err);
        process.exit(1);
    }
}

showAdmins();
