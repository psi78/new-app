const { query } = require("./database/config");

async function checkMatch() {
    try {
        // 1. Setup: Insert lowercase student
        const id = "ugr/repro/001";
        await query("DELETE FROM students WHERE student_id = ?", [id]);
        await query("INSERT INTO students (student_id, full_name, gender, department, academic_year) VALUES (?, 'Repro User', 'Male', 'Test Dept', 1)", [id]);

        // 2. The input list (uppercase)
        const list = ["UGR/REPRO/001", "OTHER/123"];

        console.log("Before Delete, count:", (await query("SELECT count(*) as c FROM students WHERE student_id = ?", [id]))[0].c);

        // 3. Run the query as strictly as the server does
        // server.js logic: DELETE FROM students WHERE student_id NOT IN (?)
        await query("DELETE FROM students WHERE student_id NOT IN (?)", [list]);

        // 4. Check result
        const count = (await query("SELECT count(*) as c FROM students WHERE student_id = ?", [id]))[0].c;
        console.log("After Delete, count:", count);

        if (count === 0) {
            console.log("CONCLUSION: Case sensitivity caused DELETION.");
        } else {
            console.log("CONCLUSION: Case sensitivity handled correctly (NOT deleted).");
        }

        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkMatch();
