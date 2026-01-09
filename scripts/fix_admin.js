const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '../pages/admin/admin.js');
let c = fs.readFileSync(p, 'utf8');

// The new function code
const newFn = `  async function openApplicationDocuments(appId) {
    try {
      // Self-healing: Ensure correct modal exists
      if (!document.getElementById('docTableBody')) {
          console.warn('Doc modal corrupt or missing. Re-injecting...');
          const badModal = document.getElementById('docModal');
          if (badModal) badModal.remove();
          
          const docModalHtml = \`
            <div id="docModal" class="modal" style="display:none; position:fixed; z-index:9999; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.6); align-items:center; justify-content:center;">
              <div class="modal-content" style="background:white; margin:5% auto; padding:20px; width:600px; border-radius:8px; position:relative;">
                  <h3 style="margin-top:0;">Student Documents</h3>
                  <div class="doc-list-container" style="padding: 10px 0;">
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                      <thead>
                        <tr style="border-bottom: 1px solid #ddd; text-align: left;">
                          <th style="padding: 10px;">Document Type</th>
                          <th style="padding: 10px;">File Preview</th>
                        </tr>
                      </thead>
                      <tbody id="docTableBody"></tbody>
                    </table>
                    <div id="rejectReasonContainer" style="margin-bottom: 15px; display: none;">
                      <label>Reason for Rejection:</label>
                      <select id="rejectReason" style="width: 100%; padding: 8px; margin-top:5px;">
                        <option value="" disabled selected>Select Reason</option>
                        <option value="Blurry Document">Blurry Document</option>
                        <option value="Invalid Document">Invalid Document</option>
                        <option value="Wrong Document Type">Wrong Document Type</option>
                        <option value="Expired Document">Expired Document</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div class="modal-actions" style="display: flex; justify-content: space-between; gap: 10px; margin-top:20px;">
                    <button class="cancel-btn" id="closeModal" style="background-color:#d9534f; color: white;">CLOSE</button>
                    <div style="display: flex; gap: 10px;">
                        <button class="verify-btn" id="finalVerify">Verify</button>
                        <button class="reject-btn" id="finalReject">Reject</button>
                    </div>
                  </div>
              </div>
            </div>\`;
          document.body.insertAdjacentHTML('beforeend', docModalHtml);
      }

      const r = await authFetch(\`\${API_BASE}/applications/\${appId}\`);
      if (!r.ok) return notify('Error', 'Application not found');
      const app = await r.json();

      const modal = document.getElementById('docModal');
      modal.dataset.appId = appId;
      
      const tbody = document.getElementById('docTableBody');
      tbody.innerHTML = '';

      const docTypes = [
          { key: 'kebeleId', label: 'Kebele ID' },
          { key: 'medicalDoc', label: "Medical Doc't" },
          { key: 'supportLetter', label: 'Letter' }
      ];

      docTypes.forEach(type => {
        if (app.documents && app.documents[type.key]) {
             let fullUrl = app.documents[type.key];
             if (fullUrl.startsWith('/')) {
                fullUrl = \`\${window.location.origin}\${fullUrl}\`; 
             }
             if (typeof API_URL !== 'undefined' && app.documents[type.key].startsWith('/uploads')) {
                fullUrl = \`\${API_URL}\${app.documents[type.key]}\`;
             }

            const tr = document.createElement('tr');
            tr.innerHTML = \`
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight:500;">\${type.label}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <a href="\${fullUrl}" target="_blank" style="color: #2196F3; text-decoration: none;">View file</a>
                </td>
            \`;
            tbody.appendChild(tr);
        }
      });

      if (tbody.children.length === 0) {
          tbody.innerHTML = '<tr><td colspan="2" style="padding:10px; text-align:center;">No documents found</td></tr>';
      }

      // Explicitly show modal
      document.getElementById('docModal').style.display = 'flex';

      // Setup Actions
      const reasonContainer = document.getElementById('rejectReasonContainer');
      const reasonSelect = document.getElementById('rejectReason');
      reasonContainer.style.display = 'none';

      const verifyBtn = document.getElementById('finalVerify');
      const rejectBtn = document.getElementById('finalReject');
      
      const newVerify = verifyBtn.cloneNode(true);
      verifyBtn.parentNode.replaceChild(newVerify, verifyBtn);

      const newReject = rejectBtn.cloneNode(true);
      rejectBtn.parentNode.replaceChild(newReject, rejectBtn);

      newVerify.addEventListener('click', () => updateApplicationDocStatus(appId, 'Verified'));

      newReject.addEventListener('click', () => {
        if (reasonContainer.style.display === 'none') {
          reasonContainer.style.display = 'block';
        } else {
          const reason = reasonSelect.value;
          if (!reason) return notify('Error', 'Please select a rejection reason');
          updateApplicationDocStatus(appId, 'Rejected', reason);
        }
      });
      
      const closeBtn = document.getElementById('closeModal');
      const newClose = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newClose, closeBtn);
      newClose.addEventListener('click', () => {
          document.getElementById('docModal').style.display = 'none';
      });

    } catch (e) { 
      console.error(e); 
      notify('Error', 'Failed to load: ' + e.message); 
    }
  }`;

// Extract parts
const startMarker = 'async function openApplicationDocuments(appId) {';
// Look for showPreview which comes later
const endMarker = 'function showPreview(url) {';

const startIdx = c.indexOf(startMarker);
const endIdx = c.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find function boundaries');
} else {
    // We replace everything between
    const finalContent = c.substring(0, startIdx) + newFn + '\n\n  ' + c.substring(endIdx);
    fs.writeFileSync(p, finalContent);
    console.log('Fixed admin.js successfully');
}
