const { query } = require("./j/database/config");

async function checkData() {
    try {
        const rooms = await query("SELECT * FROM dorm_rooms");
        console.log("--- ROOMS ---");
        console.table(rooms);

        const apps = await query(`
            SELECT a.id, a.application_id, a.status, s.gender, a.dorm_allocation
            FROM applications a
            JOIN students s ON a.student_id = s.student_id
            WHERE a.status = 'Verified'
        `);
        console.log("\n--- VERIFIED APPS ---");
        console.table(apps);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
