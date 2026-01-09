const { query } = require('./database/config');

async function showApps() {
    try {
        console.log("Fetching all Dorm Applications from 'applications' table...");
        console.log("---------------------------------------------------------");

        // Fetch applications with student names for better readability
        const apps = await query(`
      SELECT 
        a.id, 
        a.application_id, 
        a.student_id, 
        s.full_name,
        a.status, 
        a.residency_category,
        a.created_at
      FROM applications a
      LEFT JOIN students s ON a.student_id = s.student_id
      ORDER BY a.created_at DESC
    `);

        if (apps.length === 0) {
            console.log("No applications found in the database.");
        } else {
            console.table(apps.map(a => ({
                ID: a.id,
                "App ID": a.application_id,
                "Student ID": a.student_id,
                "Name": a.full_name,
                "Category": a.residency_category,
                "Status": a.status,
                "Submitted At": new Date(a.created_at).toLocaleString()
            })));
        }
        console.log("---------------------------------------------------------");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

showApps();
