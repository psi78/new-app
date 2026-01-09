const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '../pages/admin/admin.js');
let c = fs.readFileSync(p, 'utf8');

// Section markers
const startMarker = 'function initAllocationPage() {';
const endMarker = 'function setupUniversalUI() {';

const startIndex = c.indexOf(startMarker);
const endIndex = c.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find allocation section');
    process.exit(1);
}

const cleanCode = `function initAllocationPage() {
    // Run button
    document.getElementById('runAllocationBtn')?.addEventListener('click', async () => {
      if (!confirm("This will prioritize Rural and Medical students and randomly assign rooms. Continue?")) return;
      try {
        const r = await authFetch(\`\${API_BASE}/allocation/run\`, { method: 'POST' });
        const data = await r.json();
        if (r.ok) {
          notify('Success', data.message);
          await loadAllocationResults();
        } else {
          notify('Error', data.error || 'Allocation failed');
        }
      } catch (e) {
        console.error(e);
        notify('Error', 'Failed to run allocation');
      }
    });

    // Excel Export
    document.getElementById('generateReportBtn')?.addEventListener('click', exportAllocationsToExcel);

    // Refresh/Reset
    document.getElementById('resetFilters')?.addEventListener('click', () => {
      document.getElementById('filterGender').selectedIndex = 0;
      document.getElementById('filterCategory').selectedIndex = 0;
      document.getElementById('filterStatus').selectedIndex = 0;
      document.getElementById('searchStudentInput').value = '';
      loadAllocationResults();
    });

    // Refresh table on load
    loadAllocationResults();
  }

  async function loadAllocationResults() {
    const tbody = document.getElementById('allocationTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8">Loading allocations...</td></tr>';

    try {
      const r = await authFetch(\`\${API_BASE}/allocation/results\`);
      if (r.ok) {
        const data = await r.json();
        renderAllocationTable(data);
      }
    } catch (e) {
      console.error(e);
      tbody.innerHTML = '<tr><td colspan="8">Failed to load results</td></tr>';
    }
  }

  function renderAllocationTable(data) {
    const tbody = document.getElementById('allocationTableBody');
    if (!tbody) return;

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#666">No allocations found.</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(item => {
      const alloc = item.dorm_allocation ? (typeof item.dorm_allocation === 'string' ? JSON.parse(item.dorm_allocation) : item.dorm_allocation) : null;
      const roomInfo = alloc ? \`\${alloc.dormName} - \${alloc.roomNumber} (Bed \${alloc.bedNumber})\` : 'Not Allocated';
      
      return \`<tr>
        <td><input type="checkbox" class="student-checkbox" data-id="\${item.id}"></td>
        <td>\${escapeHtml(item.studentId)}</td>
        <td>\${escapeHtml(item.full_name)}</td>
        <td>\${escapeHtml(item.gender)}</td>
        <td>\${escapeHtml(item.department)}</td>
        <td>\${escapeHtml(item.category)}</td>
        <td>\${roomInfo}</td>
        <td>\${escapeHtml(item.status)}</td>
      </tr>\`;
    }).join('');
  }

  async function exportAllocationsToExcel() {
    try {
      const r = await authFetch(\`\${API_BASE}/allocation/results\`);
      if (!r.ok) return notify('Error', 'Failed to fetch data for export');
      const data = await r.json();

      if (!data || data.length === 0) return notify('Info', 'No data to export');

      const excelData = data.map(item => {
        const alloc = item.dorm_allocation ? (typeof item.dorm_allocation === 'string' ? JSON.parse(item.dorm_allocation) : item.dorm_allocation) : null;
        return {
          'Student ID': item.studentId,
          'Full Name': item.full_name,
          'Gender': item.gender,
          'Department': item.department,
          'Residency Category': item.category,
          'Block': alloc ? alloc.dormName : 'N/A',
          'Room': alloc ? alloc.roomNumber : 'N/A',
          'Bed': alloc ? alloc.bedNumber : 'N/A',
          'Status': item.status
        };
      });

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Allocations");
      XLSX.writeFile(wb, "Dorm_Allocations_Final.xlsx");
      notify('Exported', 'Allocation report downloaded');
    } catch (e) {
      console.error(e);
      notify('Error', 'Export failed');
    }
  }

  `;

const newContent = c.substring(0, startIndex) + cleanCode + c.substring(endIndex);
fs.writeFileSync(p, newContent);
console.log('Successfully updated allocation page in admin.js');
