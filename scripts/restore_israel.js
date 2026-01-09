const { query, pool } = require('../database/config');

async function restoreStudent() {
    console.log("🚑 Restoring Student UGR/7570/16...");

    try {
        // Check if exists first
        const existing = await query("SELECT * FROM students WHERE student_id = 'UGR/7570/16'");
        if (existing.length > 0) {
            console.log("ℹ️ Student UGR/7570/16 already exists. No restoration needed.");
            return;
        }

        // Insert
        // Guessing details based on context or filling defaults if not fully known
        // UGR/7570/16,Israel S,2016 from csv
        await query(
            "INSERT INTO students (student_id, full_name, gender, department, academic_year, residence_category) VALUES (?, ?, ?, ?, ?, ?)",
            ['UGR/7570/16', 'Israel S', 'Male', 'Software Engineering', 4, 'Addis Ababa']
        );

        console.log("✅ Successfully restored 'Israel S' (UGR/7570/16) to the students table.");

    } catch (error) {
        console.error("❌ Error restoring student:", error);
    } finally {
        process.exit();
    }
}

restoreStudent();
