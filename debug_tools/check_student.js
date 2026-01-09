const { query } = require("./database/config");

async function checkStudent() {
    try {
        const studentId = "ugr/7570/16"; // ID provided by user
        // Try uppercase too just in case
        const students = await query("SELECT * FROM students WHERE student_id = ? OR student_id = ?", [studentId, studentId.toUpperCase()]);
        console.log(`Checking for ${studentId}...`);
        if (students.length > 0) {
            console.log("FOUND:", JSON.stringify(students[0], null, 2));
        } else {
            console.log("NOT FOUND");
            // If not found, let's insert it so the test works
            console.log("Inserting student for test...");
            await query("INSERT INTO students (student_id, full_name, gender, department, academic_year, residence_category) VALUES (?, ?, ?, ?, ?, ?)",
                [studentId, "Israel S", "Male", "Software E.", 2, "Addis Ababa"]);
            console.log("Inserted.");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkStudent();
