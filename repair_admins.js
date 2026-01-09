const { query } = require('./database/config');

async function repairPermissions() {
    try {
        const admins = await query("SELECT id, perms FROM admin_registry");
        for (const admin of admins) {
            let perms = [];
            try {
                perms = typeof admin.perms === 'string' ? JSON.parse(admin.perms) : (admin.perms || []);
            } catch (e) { perms = []; }

            if (!perms.includes('HOME')) {
                perms.push('HOME');
                await query("UPDATE admin_registry SET perms = ? WHERE id = ?", [JSON.stringify(perms), admin.id]);
                console.log(`Added HOME to admin ID ${admin.id}`);
            }
        }
        console.log("Repair complete.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

repairPermissions();
