const { query } = require("./database/config");

async function verifySafety() {
    try {
        const targetId = "ugr/7570/16";

        console.log("--- SAFETY CHECK ---");

        // 1. Confirm student is currently in DB
        const students = await query("SELECT student_id FROM students WHERE student_id = ?", [targetId]);
        if (students.length === 0) {
            console.log("⚠️ WARNING: Student is NOT in DB. Nothing to protect!");
            process.exit(0);
        }
        console.log(`✅ Student found in DB: ${students[0].student_id}`);

        // 2. Simulate the list from CSV
        const csvIds = ["UGR/7570/16", "UGR/1111/16", "UGR/2222/16", "ugr/9999/99"];
        const sanitizedParams = csvIds.map(id => String(id).toUpperCase().trim()).filter(id => id.length > 0);

        console.log("ℹ️ Import List (Sanitized):", sanitizedParams);

        // 3. Run a SELECT query mimicking the DELETE condition to see who WOULD stay
        const wouldBeDeleted = await query(
            "SELECT student_id FROM students WHERE UPPER(student_id) NOT IN (?) AND student_id = ?",
            [sanitizedParams, targetId]
        );

        if (wouldBeDeleted.length > 0) {
            console.log("❌ DANGER: The student WOULD be deleted!");
        } else {
            console.log("✅ SAFE: The student would NOT be deleted because their ID matches.");
        }

        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verifySafety();
