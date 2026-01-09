const { query } = require("./j/database/config");

async function listAll() {
    try {
        const students = await query("SELECT id, student_id, full_name, created_at FROM students ORDER BY created_at DESC");
        console.log("--- ALL STUDENTS ---");
        console.table(students);

        const apps = await query("SELECT id, student_id, status, dorm_allocation, updated_at FROM applications ORDER BY updated_at DESC");
        console.log("\n--- ALL APPLICATIONS ---");
        console.table(apps);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listAll();
