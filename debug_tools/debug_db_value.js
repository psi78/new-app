const { query } = require("./database/config");

async function checkValue() {
    try {
        const targetId = "ugr/7570/16";
        const rows = await query("SELECT student_id, UPPER(student_id) as up FROM students WHERE student_id = ?", [targetId]);

        if (rows.length === 0) {
            console.log("Student not found.");
        } else {
            const raw = rows[0].student_id;
            const up = rows[0].up;
            console.log(`Raw: '${raw}'`);
            console.log(`Upper from DB: '${up}'`);

            // Log ASCII codes
            console.log("Raw Codes:", raw.split('').map(c => c.charCodeAt(0)));
            console.log("Upper Codes:", up.split('').map(c => c.charCodeAt(0)));

            const match = "UGR/7570/16";
            console.log(`Matching against: '${match}'`);
            console.log("Match Codes:", match.split('').map(c => c.charCodeAt(0)));

            console.log("JS Comparison (up === match):", up === match);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkValue();
