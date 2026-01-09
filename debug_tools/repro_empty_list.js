const { query } = require("./database/config");

async function checkEmptyList() {
    try {
        const id = "ugr/7570/16";

        // 1. Ensure student exists
        const countBefore = (await query("SELECT count(*) as c FROM students WHERE student_id = ?", [id]))[0].c;
        console.log("Before: Student Count =", countBefore);

        if (countBefore === 0) {
            console.log("Restoring student...");
            await query("INSERT INTO students (student_id, full_name, gender, department, academic_year) VALUES (?, 'Israel S', 'Male', 'Software E.', 2)", [id]);
        }

        // 2. Simulate Empty List or empty strings
        const list = [];
        // Note: mysql2 query replacement behavior with empty array needs check
        console.log("Testing with empty array []...");
        try {
            await query("DELETE FROM students WHERE UPPER(student_id) NOT IN (?)", [list]);
            console.log("Query executed.");
        } catch (e) {
            console.log("Query FAILED with empty list (Expected):", e.message);
        }

        const countAfter = (await query("SELECT count(*) as c FROM students WHERE student_id = ?", [id]))[0].c;
        console.log("After: Student Count =", countAfter);

        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkEmptyList();
