const { query, pool } = require('../database/config');

async function restoreTestUser() {
    console.log("🚑 checking/Restoring Student UGR/1111/16/2016...");

    try {
        const studentId = 'UGR/1111/16/2016';
        // Check if exists
        const existing = await query("SELECT * FROM students WHERE student_id = ?", [studentId]);
        if (existing.length > 0) {
            console.log(`ℹ️ Student ${studentId} already exists in 'students' table.`);
            return;
        }

        // Insert
        await query(
            "INSERT INTO students (student_id, full_name, gender, department, academic_year, residence_category) VALUES (?, ?, ?, ?, ?, ?)",
            [studentId, 'Test user 1', 'Male', 'Civil Engineering', 2, 'Rural']
        );

        console.log(`✅ Successfully inserted '${studentId}' to the students table.`);

    } catch (error) {
        console.error("❌ Error restoring student:", error);
    } finally {
        process.exit();
    }
}

restoreTestUser();
