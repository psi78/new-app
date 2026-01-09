const { pool } = require("./database/config");

async function checkExecute() {
    try {
        const id = "ugr/7570/16";
        // Ensure student exists
        await pool.query("INSERT IGNORE INTO students (student_id, full_name, gender, department, academic_year) VALUES (?, 'Test', 'M', 'Dep', 1)", [id]);

        const list = ["UGR/7570/16", "OTHER"];

        console.log("Testing pool.execute with IN (?) and array...");
        // If execute works like query, this should return the student.
        // If duplicate execution fails or treats array as scalar, it won't find it.
        const [rows] = await pool.execute(
            "SELECT * FROM students WHERE UPPER(student_id) IN (?)",
            [list]
        );

        console.log("Rows found:", rows.length);
        if (rows.length > 0) {
            console.log("✅ pool.execute handled array expansion correctly.");
        } else {
            console.log("❌ pool.execute FAILED to expand array. It treated it as a single scalar or errored.");
        }

        process.exit(0);
    } catch (err) {
        console.error("Error during test:", err.message);
        process.exit(1);
    }
}

checkExecute();
