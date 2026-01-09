const { query, pool } = require("./database/config");

async function verifyRestore() {
    try {
        console.log("Verifying Student Restoration...");
        const students = await query("SELECT student_id, full_name, gender, department FROM students LIMIT 5");
        console.table(students);

        console.log("Verifying Admin Restoration...");
        const admins = await query("SELECT admin_id, role FROM admin_registry LIMIT 5");
        console.table(admins);

        console.log("Verifying Application Restoration...");
        const apps = await query("SELECT application_id, status FROM applications LIMIT 5");
        console.table(apps);

        process.exit(0);
    } catch (err) {
        console.error("Verification Error:", err);
        process.exit(1);
    }
}

verifyRestore();
