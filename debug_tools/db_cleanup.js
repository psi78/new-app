const { query } = require('./database/config');

async function cleanSlate() {
    try {
        console.log("=== STARTING CLEAN SLATE (Deleting Students & Applications) ===");

        // 1. Delete all applications
        const resApps = await query("DELETE FROM applications");
        console.log(`- Deleted ${resApps.affectedRows} applications.`);

        // 2. Delete all student accounts
        const resAccounts = await query("DELETE FROM student_accounts");
        console.log(`- Deleted ${resAccounts.affectedRows} student credentials.`);

        // 3. Delete all students
        const resStudents = await query("DELETE FROM students");
        console.log(`- Deleted ${resStudents.affectedRows} student profiles.`);

        // 4. Reset dorm occupancy
        const resRooms = await query("UPDATE dorm_rooms SET current_occupancy = 0");
        console.log(`- Reset occupancy for ${resRooms.affectedRows} dorm rooms.`);

        console.log("\nSUCCESS: You have a clean slate for student registrations and applications.");
        console.log("NOTE: Admin accounts and Dorm room structures have been preserved.");

        process.exit(0);
    } catch (e) {
        console.error("CRITICAL ERROR DURING CLEAN SLATE:", e.message);
        process.exit(1);
    }
}

cleanSlate();
