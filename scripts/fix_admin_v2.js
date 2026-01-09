const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '../pages/admin/admin.js');
let c = fs.readFileSync(p, 'utf8');
const search = 'closeDocumentModal();';
const replace = "const modal = document.getElementById('docModal'); if (modal) modal.style.display = 'none';";

if (c.includes(search)) {
    c = c.replace(new RegExp(search, 'g'), replace);
    fs.writeFileSync(p, c);
    console.log('Fixed closeDocumentModal in admin.js');
} else {
    console.log('Could not find closeDocumentModal');
}
