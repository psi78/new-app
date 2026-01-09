const { query } = require('./database/config');

async function testFetch() {
    const ids = ['ugr/7570/16', 'UGR/7570/16'];
    for (const id of ids) {
        console.log(`Testing ID: ${id}`);
        const res = await query(
            "SELECT a.id, a.status FROM applications a LEFT JOIN students s ON a.student_id = s.student_id WHERE a.student_id = ? ORDER BY a.created_at DESC LIMIT 1",
            [id]
        );
        console.log(`Result for ${id}:`, res.length > 0 ? "Found" : "NOT Found");
    }
    process.exit(0);
}

testFetch();
