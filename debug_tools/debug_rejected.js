const { query } = require('./j/database/config');

async function checkRejected() {
    try {
        const apps = await query("SELECT id, student_id, status, doc_status, admin_remark FROM applications WHERE status='Rejected' OR doc_status='Rejected' ORDER BY updated_at DESC LIMIT 5");
        console.log("Rejected Apps Details:");
        apps.forEach(a => {
            console.log(`App ${a.id} (${a.student_id}):`);
            console.log(` - Status: ${a.status}`);
            console.log(` - Doc Status: ${a.doc_status}`);
            console.log(` - Admin Remark: "${a.admin_remark}"`);
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkRejected();
