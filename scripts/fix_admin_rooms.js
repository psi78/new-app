const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '../pages/admin/admin.js');
let c = fs.readFileSync(p, 'utf8');

// Section markers
const startMarker = 'function initRoomManagement() {';
const endMarker = 'function initAllocationPage() {';

const startIndex = c.indexOf(startMarker);
const endIndex = c.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find room management section');
    process.exit(1);
}

const cleanCode = `function initRoomManagement() {
    harmonizeModalButtons();

    document.getElementById('addRoomBtn')?.addEventListener('click', () => openModal('addRoomModal'));
    document.getElementById('addSaveBtn')?.addEventListener('click', createRoomFromModal);
    
    // Bind Edit Save button
    document.getElementById('editSaveBtn')?.addEventListener('click', saveEditedRoom);
    
    // Bind Export button
    document.getElementById('exportCsvBtn')?.addEventListener('click', exportToExcel);

    const editBtn = document.getElementById('editRoomBtn') || Array.from(document.querySelectorAll('.top-buttons button')).find(b => /edit\\s*room/i.test(b.innerText));
    if (editBtn) {
      editBtn.addEventListener('click', async () => {
        const selected = Array.from(document.querySelectorAll('.room-checkbox:checked')).map(cb => cb.dataset.id);
        if (selected.length === 0) return notify('Select Room', 'Please select one room to edit (double-click row or select and click Edit).');
        if (selected.length > 1) return notify('Select Single Room', 'Please select only one room to edit.');
        openEditRoomModal(selected[0]);
      });
    }

    const deleteBtn = document.getElementById('deleteRoomBtn') || Array.from(document.querySelectorAll('.top-buttons button')).find(b => /delete\\s*room/i.test(b.innerText));
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        const selected = Array.from(document.querySelectorAll('.room-checkbox:checked')).map(cb => cb.dataset.id);
        if (selected.length === 0) return notify('No Selection', 'Please select one or more rooms to delete.');
        if (!confirm(\`Are you sure you want to permanently delete \${selected.length} selected room(s)?\`)) return;
        
        try {
          let count = 0;
          for (const id of selected) {
            try {
              const r = await authFetch(\`\${API_BASE}/rooms/\${id}\`, { method: 'DELETE' });
              if (r.ok) count++;
            } catch (e) {
              console.error('Delete failed for id:', id, e);
            }
          }
          notify('Deleted', \`\${count} room(s) removed successfully\`);
          await renderRoomsTable();
        } catch (e) {
          console.error(e);
          notify('Error', 'Failed to delete some rooms');
        }
      });
    }

    const resetBtn = document.getElementById('resetFilters') || Array.from(document.querySelectorAll('.filters-search button')).find(b => /reset/i.test(b.innerText));
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const fields = ['filterDormBlock', 'filterStatus', 'filterGender', 'filterCategory', 'searchRoomInput', 'searchStudentInput', 'searchInput', 'categoryFilter', 'genderFilter', 'yearFilter'];
        fields.forEach(id => {
          const el = document.getElementById(id);
          if (el) { if (el.tagName.toLowerCase() === 'select') el.selectedIndex = 0; else el.value = ''; }
        });
        renderRoomsTable();
      });
    }

    const selectAll = document.getElementById('selectAllRooms');
    if (selectAll) {
      selectAll.addEventListener('change', () => {
        const checked = !!selectAll.checked;
        document.querySelectorAll('.room-checkbox').forEach(cb => cb.checked = checked);
      });
    }

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', renderRoomsTable);

    renderRoomsTable();
  }

  async function fetchRooms() {
    try {
      const r = await authFetch(\`\${API_BASE}/rooms\`);
      if (r.ok) return await r.json();
    } catch (e) { console.error('fetchRooms', e); }
    return [];
  }

  async function renderRoomsTable() {
    const tbody = document.getElementById('dormTableBody'); if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';
    try {
      const rooms = await fetchRooms();
      if (!rooms || rooms.length === 0) { 
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#666">No rooms found.</td></tr>'; 
        return; 
      }
      tbody.innerHTML = rooms.map(r => {
        const id = r.id;
        const roomNo = escapeHtml(r.room_number || '-');
        const block = escapeHtml(r.block_name || '-');
        const capacity = r.capacity || 0;
        const occupied = r.current_occupancy || 0;
        const remaining = Math.max(0, capacity - occupied);
        const status = escapeHtml(r.status || 'Active');
        return \`<tr data-id="\${escapeHtml(id)}">
          <td><input type="checkbox" class="room-checkbox" data-id="\${escapeHtml(id)}"></td>
          <td>\${roomNo}</td><td>\${block}</td><td>\${capacity}</td><td>\${occupied}</td><td>\${remaining}</td><td>\${status}</td>
        </tr>\`;
      }).join('');
      tbody.querySelectorAll('tr[data-id]').forEach(tr => tr.addEventListener('dblclick', () => openEditRoomModal(tr.dataset.id)));
    } catch (e) { 
      console.error('renderRoomsTable', e); 
      tbody.innerHTML = '<tr><td colspan="7">Failed to load</td></tr>'; 
    }
  }

  async function createRoomFromModal() {
    const blockName = document.getElementById('addDormBlock')?.value;
    const roomNumber = document.getElementById('addRoomNumber')?.value?.trim();
    const capacity = parseInt(document.getElementById('addCapacity')?.value) || 0;
    const status = document.getElementById('addStatus')?.value || 'Active';
    const gender = blockName === 'female' ? 'Female' : 'Male';

    if (!roomNumber || !blockName || !capacity) return notify('Error', 'Fill required fields');

    try {
      const r = await authFetch(\`\${API_BASE}/rooms\`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ blockName, roomNumber, capacity, status, gender }) 
      });
      const data = await r.json();
      if (r.ok) { 
        notify('Created', 'Room added'); 
        closeModal('addRoomModal'); 
        await renderRoomsTable(); 
      } else { 
        notify('Error', data.error || 'Failed'); 
      }
    } catch (e) { 
      console.error(e); 
      notify('Error', 'Connection failed');
    }
  }

  async function openEditRoomModal(id) {
    const rooms = await fetchRooms();
    const room = (rooms || []).find(r => String(r.id) === String(id));
    if (!room) return notify('Error', 'Room not found');
    
    document.getElementById('editDormBlock').value = room.block_name || '';
    document.getElementById('editRoomNumber').value = room.room_number || '';
    document.getElementById('editCapacity').value = room.capacity || '';
    document.getElementById('editStatus').value = room.status || 'Active';
    document.getElementById('editRoomModal').dataset.editId = room.id;
    
    const titleEl = document.querySelector('#editRoomModal .modal-content h3'); 
    if (titleEl) titleEl.innerText = \`Edit Dorm Room (Room \${room.room_number || room.id})\`;
    
    harmonizeModalButtons();
    openModal('editRoomModal');
  }

  async function saveEditedRoom() {
    const id = document.getElementById('editRoomModal')?.dataset.editId;
    if (!id) return notify('Error', 'No room selected');
    
    const blockName = document.getElementById('editDormBlock')?.value;
    const roomNumber = document.getElementById('editRoomNumber')?.value?.trim();
    const capacity = parseInt(document.getElementById('editCapacity')?.value) || 0;
    const status = document.getElementById('editStatus')?.value || 'Active';
    const gender = blockName === 'female' ? 'Female' : 'Male';

    if (!roomNumber || !blockName || !capacity) return notify('Error', 'Fill required fields');

    try {
      const r = await authFetch(\`\${API_BASE}/rooms/\${id}\`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ blockName, roomNumber, capacity, status, gender }) 
      });
      if (r.ok) { 
        notify('Saved', 'Room updated successfully'); 
        closeModal('editRoomModal'); 
        await renderRoomsTable(); 
      } else {
        const data = await r.json();
        notify('Error', data.error || 'Failed to update');
      }
    } catch (e) {
      console.error(e);
      notify('Error', 'Connection failed');
    }
  }

  async function exportToExcel() {
    try {
      const rooms = await fetchRooms();
      if (!rooms || rooms.length === 0) return notify('Info', 'No data to export');

      const data = rooms.map(r => ({
        'Room Number': r.room_number,
        'Block Name': r.block_name,
        'Capacity': r.capacity,
        'Occupancy': r.current_occupancy,
        'Gender': r.gender,
        'Status': r.status
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rooms");
      XLSX.writeFile(wb, "Dorm_Rooms_Report.xlsx");
      notify('Exported', 'Excel file downloaded');
    } catch (e) {
      console.error('Export Error:', e);
      notify('Error', 'Failed to export Excel');
    }
  }

  `;

const newContent = c.substring(0, startIndex) + cleanCode + c.substring(endIndex);
fs.writeFileSync(p, newContent);
console.log('Successfully updated room management in admin.js');
