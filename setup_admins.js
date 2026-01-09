const { query } = require("./database/config");
const bcrypt = require("bcryptjs");

async function setupAdmins() {
    try {
        const password = "admin123";
        const salt = await bcrypt.genSalt(10);
        const passHash = await bcrypt.hash(password, salt);

        const accountsToFix = [
            { id: 'sysadmin', name: 'System Admin', role: 'SYSTEM', perms: '["SYSTEM", "HOME"]' },
            { id: 'app_admin', name: 'App Manager', role: 'DORM_MANAGEMENT', perms: '["HOME", "OVERVIEW"]' },
            { id: 'overview_admin', name: 'Overview Admin', role: 'DORM_MANAGEMENT', perms: '["HOME", "OVERVIEW"]' },
            { id: 'verify_admin', name: 'Verification Admin', role: 'VERIFICATION', perms: '["HOME", "VERIFY"]' },
            { id: 'room_admin', name: 'Room Admin', role: 'DORM_MANAGEMENT', perms: '["HOME", "ROOMS"]' },
            { id: 'alloc_admin', name: 'Allocation Admin', role: 'ALLOCATION', perms: '["HOME", "ALLOCATION"]' },
            { id: 'admin', name: 'Admin', role: 'SYSTEM', perms: '["SYSTEM", "HOME"]' }
        ];

        console.log("Forcing update of all admin credentials...");
        for (const admin of accountsToFix) {
            const existing = await query("SELECT id FROM admin_registry WHERE admin_id = ?", [admin.id]);
            if (existing.length > 0) {
                await query(
                    "UPDATE admin_registry SET password = ?, name = ?, role = ?, perms = ? WHERE admin_id = ?",
                    [passHash, admin.name, admin.role, admin.perms, admin.id]
                );
                console.log(`Updated admin: ${admin.id}`);
            } else {
                await query(
                    "INSERT INTO admin_registry (admin_id, password, name, role, perms) VALUES (?, ?, ?, ?, ?)",
                    [admin.id, passHash, admin.name, admin.role, admin.perms]
                );
                console.log(`Created admin: ${admin.id}`);
            }
        }

        console.log("✅ Admin setup complete. All passwords reset to 'admin123'.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Setup failed:", err);
        process.exit(1);
    }
}

setupAdmins();
