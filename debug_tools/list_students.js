const { query } = require('./database/config');

async function listStudents() {
    try {
        const s = await query("SELECT student_id, full_name FROM students WHERE student_id LIKE '%7570%'");
        console.log("Students:", JSON.stringify(s, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listStudents();
