const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '../pages/admin/admin.js');
let c = fs.readFileSync(p, 'utf8');

// The corrupted area starts around updateApplicationDocStatus
// I will attempt to replace the entire corrupted block with a clean version.

const corruptedStart = 'async function updateApplicationDocStatus(appId, docStatus, reason = null) {';
const corruptedEnd = 'function initRoomManagement() {';

const startIndex = c.indexOf(corruptedStart);
const endIndex = c.indexOf(corruptedEnd);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find corruption markers');
    process.exit(1);
}

const cleanBlock = `async function updateApplicationDocStatus(appId, docStatus, reason = null) {
    try {
      const body = { action: docStatus === 'Verified' ? 'verify' : 'reject' };
      if (reason) body.reason = reason;

      const r = await authFetch(\`\${API_BASE}/applications/\${appId}/verify\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!r.ok) { 
        notify('Error', 'Update failed'); 
      } else {
        notify('Updated', \`Application \${docStatus}\`);
        const modal = document.getElementById('docModal');
        if (modal) modal.style.display = 'none';

        if (document.getElementById('verificationBody')) {
          const res = await authFetch(\`\${API_BASE}/applications/pending\`);
          if (res.ok) {
            const apps = await res.json();
            renderVerificationTableRows(apps);
          }
        }
      }
    } catch (e) { 
      console.error(e); 
      notify('Error', 'Network error: ' + e.message); 
    }
  }

  function renderVerificationTableRows(apps) {
    const tbody = document.getElementById('verificationBody');
    if (!tbody) return;
    if (!Array.isArray(apps) || apps.length === 0) { 
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#666">No applications found.</td></tr>'; 
      return; 
    }
    tbody.innerHTML = apps.map(a => {
      const sid = escapeHtml(a.studentId || '-');
      const name = escapeHtml(a.full_name || a.data?.fullName || '-');
      const gender = escapeHtml(a.gender || a.data?.gender || '-');
      const dept = escapeHtml(a.department || a.data?.department || '-');
      const year = escapeHtml(a.academic_year || a.data?.year || '-');
      const category = escapeHtml(a.residencyCategory || '-');
      const status = escapeHtml(a.docStatus || a.status || '-');

      return \`<tr data-id="\${escapeHtml(a.id)}">
          <td>\${sid}</td><td>\${name}</td><td>\${gender}</td><td>\${dept}</td><td>\${year}</td><td>\${category}</td>
          <td>\${status}</td>
           <td><a href="#" class="view-docs-btn" style="color:blue; text-decoration:underline;" data-id="\${escapeHtml(a.applicationId || a.id)}">View Doc't</a></td>
          </tr>\`;
    }).join('');

    tbody.querySelectorAll('.view-docs-btn').forEach(b => b.addEventListener('click', (e) => {
      e.preventDefault();
      openApplicationDocuments(b.dataset.id);
    }));
  }

  `;

const newC = c.substring(0, startIndex) + cleanBlock + c.substring(endIndex);
fs.writeFileSync(p, newC);
console.log('Successfully repaired admin.js');
