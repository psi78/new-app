const { query, pool } = require('../database/config');

async function checkApps() {
    console.log("🔍 Checking Applications...");

    try {
        const apps = await query("SELECT * FROM applications");
        console.log(`Found ${apps.length} applications total.`);

        if (apps.length > 0) {
            console.log("--- First 5 Applications ---");
            apps.slice(0, 5).forEach(a => {
                console.log(`ID: ${a.student_id}, Status: ${a.status}, DocStatus: ${a.doc_status}`);
            });
        }

        const pending = await query("SELECT * FROM applications WHERE status = 'Pending' OR doc_status = 'Pending'");
        console.log(`\nFound ${pending.length} PENDING applications.`);

    } catch (error) {
        console.error("❌ Error checking apps:", error);
    } finally {
        process.exit();
    }
}

checkApps();
