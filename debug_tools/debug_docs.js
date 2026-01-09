const { query } = require('./j/database/config');
const fs = require('fs');
const path = require('path');

async function checkDocs() {
    try {
        const apps = await query("SELECT id, student_id, kebele_id_doc, support_letter_doc, medical_doc FROM applications WHERE status='Pending' OR doc_status='Pending'");
        console.log("Pending Apps Docs:");
        apps.forEach(a => {
            console.log(`App ${a.id} (${a.student_id}):`);
            console.log(` - Kebele: ${a.kebele_id_doc}`);
            console.log(` - Support: ${a.support_letter_doc}`);
            console.log(` - Medical: ${a.medical_doc}`);
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkDocs();
