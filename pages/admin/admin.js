/**
 * 5K DMS - Admin frontend (vanilla JS)
 *
 * Single-file admin-side logic implementing:
 *  - Strict role-based access (SYSTEM only: home+system-admin; DORM: only pages they are granted + HOME)
 *  - Login/session handling (sessionStorage.adminResourceId / adminKey)
 *  - System Admin UI: Add Admin, Manage Roles (lookup or select), Delete Admin (confirm), Announcements
 *  - Phase management: add, list, activate/deactivate, delete
 *  - Application Overview & Document Verification (view docs, verify/reject)
 *  - Dorm Room Management: add, edit (modal), delete (selection), reset filters, select-all, double-click edit
 *  - Dorm Allocation: simple UI hooks + rules persistence (localStorage)
 *
 * Backend (dev) endpoints expected:
 *  - GET/POST/PATCH/DELETE /adminRegistry
 *  - GET/POST/PATCH/DELETE /phases
 *  - GET/POST /publicAnnouncements
 *  - GET/PATCH /applications
 *  - GET/POST/PATCH/DELETE /rooms  (optional - localStorage fallback used if not available)
 *
 * Put this file at pages/admin/admin.js and make sure your HTML contains the IDs/classes used by the script.
 */

const API_URL = "";
const API_BASE = "/api"; // v1.0.2 - relative path for tunnel support
console.log("[DMS DEBUG] API_BASE is:", API_BASE);

// --- REFRESH / ERROR TRAPS ---
// --- REFRESH / ERROR TRAPS ---
// window.onbeforeunload removed to prevent "changes may not be saved" popup
window.onerror = function (msg, url, line, col, error) {
  // Suppress generic "Script error." (often CORS/extension related)
  if (typeof msg === 'string' && msg.indexOf('Script error') > -1 && line === 0) {
    return true; // Stop propagation
  }
  alert(`JS ERROR: ${msg} [at ${line}:${col}]`);
  return false;
};
// -----------------------------

// Auth Fetch Wrapper
async function authFetch(url, options = {}) {
  const token = sessionStorage.getItem('adminToken');
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 || res.status === 403) {
    // Token expired or invalid
    sessionStorage.clear();
    window.location.href = 'admin-login.html';
  }
  return res;
}

(function () {
  document.addEventListener('DOMContentLoaded', async () => {
    // Ensure admin modals exist (inserts them if not)
    injectAdminModals();

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Public pages
    if (currentPage === 'index.html') {
      document.body.style.visibility = 'visible';
      renderHomeAnnouncements().catch(() => { });
      return;
    }
    if (currentPage.includes('admin-login')) {
      document.body.style.visibility = 'visible';
      initLoginLogic();
      return;
    }

    // Protected pages
    const token = sessionStorage.getItem('adminToken');
    const user = {
      role: sessionStorage.getItem('adminRole'),
      perms: JSON.parse(sessionStorage.getItem('adminPerms') || '[]'),
      name: sessionStorage.getItem('adminName')
    };

    if (!token || !hasPermission(user, window.location.pathname)) {
      renderProfessionalLockout();
      return;
    }

    // Allowed: initialize UI and enforce permissions
    document.body.style.visibility = 'visible';
    setupUniversalUI();
    setAdminHeader(user);
    applyUiPermissions(user);
    interceptSidebarLinks(user);

    // Page-specific initializers
    if (currentPage === 'system-admin.html') initSystemAdmin();
    if (currentPage === 'application-overview.html') initApplicationOverview();
    if (currentPage === 'document-verification.html') initDocumentVerification();
    if (currentPage === 'dorm-rooms.html') initRoomManagement();
    if (currentPage === 'dorm-allocation.html') initAllocationPage();
  });

  function initSystemAdmin() {
    injectAdminModals();
    harmonizeModalButtons();
    initSystemAdminUI();

    // Admin Management Buttons
    document.getElementById('addAdminBtn')?.addEventListener('click', () => openModal('addAdminModal'));
    document.getElementById('manageRolesBtn')?.addEventListener('click', () => openModal('manageRolesModal'));
    document.getElementById('deleteAdminBtn')?.addEventListener('click', () => openModal('deleteAdminModal'));

    // Manage Roles Logic
    document.getElementById('manageLookupBtn')?.addEventListener('click', async () => {
      const adminId = document.getElementById('manageAdminIdInput')?.value?.trim();
      const infoDiv = document.getElementById('manageAdminInfo');
      if (!adminId) return notify('Error', 'Enter an Admin ID');

      try {
        infoDiv.innerText = 'Searching...';
        const r = await authFetch(`${API_BASE}/adminRegistry/${encodeURIComponent(adminId)}`);
        if (!r.ok) {
          infoDiv.innerText = 'Admin not found.';
          return;
        }
        const admin = await r.json();
        infoDiv.innerText = `Found: ${admin.name} (${admin.role})`;

        // Populate checkboxes
        const perms = admin.perms || [];
        document.querySelectorAll('#manageRolesModal input[type="checkbox"]').forEach(cb => {
          cb.checked = perms.includes(cb.value);
        });

        // Store technical ID for save
        document.getElementById('manageLookupBtn').dataset.foundId = admin.id;
      } catch (e) {
        console.error(e);
        infoDiv.innerText = 'Error fetching admin.';
      }
    });

    window.updateRoles = async () => {
      const btn = document.getElementById('manageLookupBtn');
      const dbId = btn.dataset.foundId;
      if (!dbId) return notify('Error', 'Please lookup an admin first');

      const checked = Array.from(document.querySelectorAll('#manageRolesModal input[type="checkbox"]:checked')).map(c => c.value);

      try {
        const r = await authFetch(`${API_BASE}/adminRegistry/${dbId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ perms: checked })
        });
        if (r.ok) {
          notify('Success', 'Permissions updated');
          closeModal('manageRolesModal');
        } else {
          notify('Error', 'Update failed');
        }
      } catch (e) {
        console.error(e);
        notify('Error', 'Update error');
      }
    };

    // Add Admin Logic
    window.saveNewAdmin = async () => {
      const name = document.getElementById('newName')?.value?.trim();
      const adminId = document.getElementById('newId')?.value?.trim();
      const phone = document.getElementById('newPhone')?.value?.trim();
      const pass = document.getElementById('newPass')?.value?.trim();
      const respSelect = document.getElementById('newResponsibility');
      const responsibility = respSelect?.value || '';

      if (!adminId || !pass || !name) return notify('Error', 'Name, Admin ID and Password are required');
      if (!responsibility) return notify('Error', 'Please select an Admin Position');

      let perms = ['HOME'];
      if (responsibility === 'ALLOCATION') perms.push('ALLOCATION', 'DORM_ALLOCATION');
      if (responsibility === 'ROOMS') perms.push('ROOMS', 'DORM_ROOMS');
      if (responsibility === 'VERIFY') perms.push('VERIFY', 'DOCUMENT_VERIFICATION');
      if (responsibility === 'OVERVIEW') perms.push('OVERVIEW', 'APPLICATION_OVERVIEW');

      try {
        const payload = { adminId, name, phone, password: pass, role: 'DORM', perms };
        const r = await authFetch(`${API_BASE}/adminRegistry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (r.ok) {
          notify('Created', `New ${responsibility} Admin created successfully`);
          closeModal('addAdminModal');
          // Clear inputs
          document.getElementById('newName').value = '';
          document.getElementById('newId').value = '';
          document.getElementById('newPhone').value = '';
          document.getElementById('newPass').value = '';
          respSelect.value = '';
          await refreshAdminList();
        } else {
          const err = await r.json();
          notify('Error', err.error || 'Failed to create');
        }
      } catch (e) {
        console.error(e);
        notify('Error', 'Network error');
      }
    };

    // Delete Logic
    window.confirmDeleteAdmin = async () => {
      const adminIdInput = document.getElementById('delAdminIdInput');
      const adminId = adminIdInput?.value?.trim();
      if (!adminId) return notify('Error', 'Enter valid Admin ID');
      if (!confirm(`Are you sure you want to permanently delete admin ${adminId}?`)) return;

      try {
        const r = await authFetch(`${API_BASE}/adminRegistry/${encodeURIComponent(adminId)}`, { method: 'DELETE' });
        if (r.ok) {
          notify('Success', 'Admin deleted');
          closeModal('deleteAdminModal');
          if (adminIdInput) adminIdInput.value = '';
          await refreshAdminList();
        } else {
          const err = await r.json();
          notify('Error', err.error || 'Delete failed');
        }
      } catch (e) {
        notify('Error', 'Delete error');
      }
    };

    // Stub for refreshAdminList if missing
    if (!window.refreshAdminList) {
      window.refreshAdminList = () => {
        const inp = document.getElementById('manageAdminIdInput');
        if (inp) inp.value = '';
        const info = document.getElementById('manageAdminInfo');
        if (info) info.innerText = '';
        document.querySelectorAll('#manageRolesModal input[type="checkbox"]').forEach(cb => cb.checked = false);
      };
    }

    // Announcement Logic
    const sendBtn = document.getElementById('sendAnnouncementBtn');
    if (sendBtn) {
      sendBtn.addEventListener('click', async () => {
        const msg = document.getElementById('announcementMessage')?.value?.trim();
        if (!msg) return notify('Error', 'Please enter a message');

        try {
          const r = await authFetch(`${API_BASE}/announcement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
          });
          if (r.ok) {
            notify('Sent', 'Urgent announcement sent to students');
            document.getElementById('announcementMessage').value = '';
          } else {
            notify('Error', 'Failed to send announcement');
          }
        } catch (e) {
          console.error(e);
          notify('Error', 'Connection failed');
        }
      });
    }
  }

  // -------------------------
  // Permission logic
  // -------------------------
  function hasPermission(user, pagePath) {
    if (!user) return false;

    const normalized = String(pagePath || '').toLowerCase();

    // ---------------- SYSTEM ADMIN ----------------
    if (String(user.role).toUpperCase() === 'SYSTEM') {
      return (
        normalized.includes('system-admin') ||
        normalized.includes('admin-home') ||
        normalized.includes('home') ||
        normalized.includes('index')
      );
    }

    // ---------------- DORM ADMIN ----------------
    const perms = Array.isArray(user.perms)
      ? user.perms.map(p => String(p).toUpperCase())
      : [];

    // Home always allowed if present
    if (normalized.includes('home') && perms.includes('HOME')) return true;

    // 🔑 Page ↔ Permission mapping (FIX)
    const pagePermissionMap = {
      'application-overview': ['OVERVIEW', 'APPLICATION_OVERVIEW'],
      'document-verification': ['VERIFY', 'DOCUMENT_VERIFICATION'],
      'dorm-rooms': ['ROOMS', 'DORM_ROOMS'],
      'dorm-allocation': ['ALLOCATION', 'DORM_ALLOCATION']
    };

    for (const pageKey in pagePermissionMap) {
      if (normalized.includes(pageKey)) {
        return pagePermissionMap[pageKey].some(p => perms.includes(p));
      }
    }

    return false;
  }


  // -------------------------
  // Admin fetch & normalization
  // -------------------------
  async function fetchUser(identifier) {
    if (!identifier) return null;
    try {
      // Try direct GET by resource id first (json-server style)
      let r = await authFetch(`${API_BASE}/adminRegistry/${encodeURIComponent(identifier)}`);
      if (r.ok) {
        const a = await r.json();
        return normalizeAdmin(a);
      }
      // Fallback: list and match by adminId or id
      r = await authFetch(`${API_BASE}/adminRegistry`);
      if (!r.ok) return null;
      const list = await r.json();
      const found = (Array.isArray(list) ? list : []).find(x => x && (String(x.id) === String(identifier) || String(x.adminId) === String(identifier)));
      return normalizeAdmin(found || null);
    } catch (e) {
      console.warn('fetchUser error', e);
      return null;
    }
  }

  function normalizeAdmin(a) {
    if (!a) return null;
    return {
      id: a.id ?? a._id ?? null,
      adminId: a.adminId ?? a.id ?? a._id ?? null,
      name: a.name ?? a.fullName ?? null,
      phone: a.phone ?? null,
      pass: a.pass ?? null,
      passHash: a.passHash ?? null,
      role: a.role ?? 'DORM',
      perms: (() => {
        if (Array.isArray(a.perms)) return a.perms;
        if (typeof a.perms === 'string') {
          try { return JSON.parse(a.perms); } catch (e) { return a.perms.split(',').map(s => s.trim()).filter(Boolean); }
        }
        return [];
      })()
    };
  }

  // -------------------------
  // Login
  // -------------------------
  function initLoginLogic() {
    const form = document.getElementById('adminLoginForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const idInput = document.getElementById('adminId')?.value?.trim();
      const passInput = document.getElementById('password')?.value?.trim();
      if (!idInput || !passInput) return showLoginError('Provide Admin ID and Password.');

      try {
        const res = await fetch(`${API_BASE}/adminLogin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ admin_id: idInput, password: passInput })
        });

        const data = await res.json();
        if (!data.success) {
          return showLoginError(data.message || 'Invalid credentials');
        }

        const admin = data.adminData;
        sessionStorage.setItem('adminToken', data.token);
        sessionStorage.setItem('adminId', admin.adminId); // For display
        sessionStorage.setItem('adminRole', admin.role);
        sessionStorage.setItem('adminPerms', JSON.stringify(admin.perms));
        sessionStorage.setItem('adminName', admin.name);

        window.location.href = (admin.role === 'SYSTEM') ? 'system-admin.html' : 'admin-home.html';
      } catch (err) {
        console.error('login error', err);
        showLoginError('Network error');
      }
    });
  }

  function showLoginError(msg) {
    const box = document.getElementById('loginError') || document.getElementById('lockWarning');
    if (box) { box.innerText = msg; box.style.display = 'block'; }
    else alert(msg);
  }

  // -------------------------
  // UI Permissions: hide/disable sidebar items user cannot access
  // -------------------------
  function applyUiPermissions(user) {
    const menuLinks = document.querySelectorAll('.sidebar .menu a');
    menuLinks.forEach(a => {
      const href = a.getAttribute('href') || '';
      const page = href.split('/').pop() || href;
      if (!hasPermission(user, page)) {
        a.classList.add('disabled-by-perm');
        a.setAttribute('aria-disabled', 'true');
        a.style.pointerEvents = 'none';
        a.style.opacity = '0.45';
        a.title = 'You do not have permission to access this page';
      } else {
        a.classList.remove('disabled-by-perm');
        a.removeAttribute('aria-disabled');
        a.style.pointerEvents = '';
        a.style.opacity = '';
        a.title = '';
      }
    });
  }

  // Intercept sidebar navigation to prevent bypassing restrictions
  function interceptSidebarLinks(user) {
    const menuLinks = document.querySelectorAll('.sidebar .menu a');
    menuLinks.forEach(a => {
      a.removeEventListener('click', sidebarClickHandler);
      a.addEventListener('click', sidebarClickHandler);
    });
    function sidebarClickHandler(e) {
      const href = e.currentTarget.getAttribute('href') || '';
      const page = href.split('/').pop() || href;
      if (!hasPermission(user, page)) {
        e.preventDefault();
        notify('Access Denied', 'You do not have permission to open that page.');
      }
    }
  }

  // -------------------------
  // System Admin UI
  // -------------------------
  function initSystemAdminUI() {
    refreshPhaseTable();
    refreshAdminList();

    document.querySelectorAll('.admin-actions button').forEach(btn => {
      const txt = (btn.innerText || '').trim().toLowerCase();

      // Phase Management MUST come first
      if (txt.includes('phase')) {
        btn.addEventListener('click', () =>
          document.querySelector('.phase-form')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        );
        return;
      }

      // Manage Roles
      if (txt.includes('manage')) {
        btn.addEventListener('click', () => openModal('manageRolesModal'));
        return;
      }

      // Add Admin
      if (txt.includes('add')) {
        btn.addEventListener('click', () => openModal('addAdminModal'));
        return;
      }

      // Delete Admin
      if (txt.includes('delete')) {
        btn.addEventListener('click', () => openModal('deleteAdminModal'));
        return;
      }
    });


    // Harmonize modal button colors
    harmonizeModalButtons();

    // Phase add button
    const addPhaseBtn = document.querySelector('#addPhaseBtn') || document.querySelector('.phase-form button.primary-btn');
    const phaseForm = document.querySelector('.phase-form');
    if (addPhaseBtn && phaseForm) addPhaseBtn.addEventListener('click', async (e) => { e.preventDefault(); await handleAddPhase(phaseForm); });

    // Announcement send
    const announceBtn = document.querySelector('#sendAnnouncementBtn') || document.querySelector('.announcement-actions .primary-btn');
    if (announceBtn) {
      announceBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const ta = document.querySelector('.announcement-textarea');
        const text = ta?.value?.trim();
        if (!text) return notify('Error', 'Announcement empty');
        try {
          const r = await authFetch(`${API_BASE}/publicAnnouncements`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, date: new Date().toLocaleDateString(), type: 'Update' }) });
          if (!r.ok) { console.error('announce failed', await r.text()); return notify('Error', 'Failed to post'); }
          notify('Success', 'Announcement posted'); if (ta) ta.value = '';
        } catch (err) { console.error(err); notify('Error', 'Network error'); }
      });
    }

    // Manage Roles: lookup button wiring (if present)
    const lookupBtn = document.getElementById('manageLookupBtn');
    if (lookupBtn) {
      lookupBtn.addEventListener('click', async () => {
        const typed = document.getElementById('manageAdminIdInput')?.value?.trim();
        if (!typed) return notify('Error', 'Enter Admin ID to lookup');
        const admin = await findAdminByIdentifier(typed);
        if (!admin) return notify('Error', 'Admin not found');
        const infoEl = document.getElementById('manageAdminInfo');
        if (infoEl) infoEl.innerText = `${admin.name ?? ''} (${admin.adminId ?? admin.id}) — ${admin.role ?? ''}`;
        document.querySelectorAll('#manageRolesModal input[type="checkbox"]').forEach(cb => cb.checked = false);
        (admin.perms || []).forEach(p => {
          const cb = Array.from(document.querySelectorAll('#manageRolesModal input[type="checkbox"]')).find(c => c.value === p);
          if (cb) cb.checked = true;
        });
        document.getElementById('manageRolesModal').dataset.resourceId = admin.id;
      });
    }
  }

  // Ensure close buttons use same color as save buttons
  function harmonizeModalButtons() {
    document.querySelectorAll('.sys-modal .modal-content .cancel-btn').forEach(btn => {
      btn.classList.add('verify-btn'); // reuse save color
      // keep the cancel-btn class if needed for behavior; only style change
    });
  }

  // -------------------------
  // Admin CRUD & Roles
  // -------------------------
  async function refreshAdminList() {
    const sel = document.getElementById('adminSel');
    if (!sel) return;
    try {
      const r = await authFetch(`${API_BASE}/adminRegistry`);
      if (!r.ok) return;
      const list = await r.json();
      sel.innerHTML = '<option value="">-- Select Admin --</option>';
      (Array.isArray(list) ? list : []).forEach(a => {
        if (a.role === 'SYSTEM') return;
        const value = a.adminId || a.id;
        const label = `${a.name} (${a.adminId})`;
        sel.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(value)}">${escapeHtml(String(label))}</option>`);
      });
    } catch (e) { console.error('refreshAdminList', e); }
  }

  async function findAdminByIdentifier(identifier) {
    if (!identifier) return null;
    try {
      let r = await authFetch(`${API_BASE}/adminRegistry/${encodeURIComponent(identifier)}`);
      if (r.ok) return await r.json();
      r = await authFetch(`${API_BASE}/adminRegistry`);
      if (!r.ok) return null;
      const list = await r.json();
      return (Array.isArray(list) ? list.find(a => String(a.id) === String(identifier) || String(a.adminId) === String(identifier)) : null) || null;
    } catch (e) { console.error('findAdminByIdentifier', e); return null; }
  }

  async function getAdminByResourceId(resourceId) {
    if (!resourceId) return null;
    try {
      const r = await authFetch(`${API_BASE}/adminRegistry/${encodeURIComponent(resourceId)}`);
      if (r.ok) return await r.json();
      const lr = await authFetch(`${API_BASE}/adminRegistry`);
      if (!lr.ok) return null;
      const list = await lr.json();
      return (Array.isArray(list) ? list.find(a => String(a.id) === String(resourceId) || String(a.adminId) === String(resourceId)) : null) || null;
    } catch (e) { console.error('getAdminByResourceId', e); return null; }
  }


  // -------------------------
  // Phases: add/list/toggle/delete
  // -------------------------
  async function handleAddPhase(form) {
    const typeEl = form.querySelector('#phaseType') || form.querySelector('select');
    const startEl = form.querySelector('#phaseStart') || form.querySelectorAll('input[type="date"]')[0];
    const endEl = form.querySelector('#phaseEnd') || form.querySelectorAll('input[type="date"]')[1];
    const type = typeEl?.value?.trim() || '';
    const start = startEl?.value || '';
    const end = endEl?.value || '';
    if (!type) return notify('Error', 'Select phase type');
    if (!start) return notify('Error', 'Pick a start date');
    if (!end) return notify('Error', 'Pick an end date');
    try {
      const payload = { type, start, end, status: 'Active', createdAt: new Date().toISOString() };
      const r = await authFetch(`${API_BASE}/phases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!r.ok) { console.error('add phase', await r.text()); return notify('Error', 'Failed to add phase'); }
      notify('Added', 'Phase created');
      await refreshPhaseTable();
      if (typeEl) typeEl.value = ''; if (startEl) startEl.value = ''; if (endEl) endEl.value = '';
    } catch (e) { console.error(e); notify('Error', 'Network error'); }
  }

  async function refreshPhaseTable() {
    const tbody = document.querySelector('.system-admin .data-table tbody') || document.querySelector('.data-table tbody');
    if (!tbody) return;
    try {
      const r = await authFetch(`${API_BASE}/phases`);
      if (!r.ok) return;
      const data = await r.json();
      tbody.innerHTML = (Array.isArray(data) ? data.slice().reverse() : []).map(p => {
        const id = p.id ?? p._id ?? '';
        const status = p.status ?? 'Active';
        return `<tr data-id="${escapeHtml(id)}">
          <td>${escapeHtml(p.type ?? '')}</td>
          <td>${escapeHtml(p.start ?? '')}</td>
          <td>${escapeHtml(p.end ?? '')}</td>
          <td>${escapeHtml(status)}</td>
          <td>
            <button class="toggle-phase" data-id="${escapeHtml(id)}" data-status="${escapeHtml(status)}">${status === 'Active' ? 'Deactivate' : 'Activate'}</button>
            <button class="delete-phase" data-id="${escapeHtml(id)}">Delete</button>
          </td>
        </tr>`;
      }).join('');

      tbody.querySelectorAll('button.toggle-phase').forEach(b => b.addEventListener('click', async () => {
        const id = b.dataset.id; const current = b.dataset.status;
        const next = current === 'Active' ? 'Closed' : 'Active';
        if (!confirm(`Set phase to ${next}?`)) return;
        try {
          const r = await authFetch(`${API_BASE}/phases/${id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
          if (!r.ok) { console.error('toggle failed', await r.text()); return notify('Error', 'Failed to change status'); }
          notify('Updated', `Phase ${next}`);
          await refreshPhaseTable();
        } catch (e) { console.error(e); notify('Error', 'Network error'); }
      }));
      tbody.querySelectorAll('button.delete-phase').forEach(b => b.addEventListener('click', async () => {
        const id = b.dataset.id;
        if (!confirm('Delete this phase?')) return;
        try {
          const r = await authFetch(`${API_BASE}/phases/${id}`, { method: 'DELETE' });
          if (!r.ok) { console.error(await r.text()); return notify('Error', 'Failed to delete'); }
          notify('Deleted', 'Phase removed'); await refreshPhaseTable();
        } catch (e) { console.error(e); notify('Error', 'Network error'); }
      }));
    } catch (e) { console.error('refreshPhaseTable', e); }
  }



  // -------------------------
  // Applications & Verification
  // -------------------------
  // State
  let registrarIds = JSON.parse(sessionStorage.getItem('lastRegistrarIds') || '[]');

  async function initApplicationOverview() {
    console.log('Initializing Application Overview...');
    const refreshBtn = document.getElementById('refreshBtn');
    const importBtn = document.getElementById('importBtn');
    const matchBtn = document.getElementById('matchBtn');
    const fileInput = document.getElementById('registrarFileInput');

    if (refreshBtn) refreshBtn.addEventListener('click', loadApplications);

    if (fileInput) {
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            const idPattern = /[A-Za-z0-9\/]{4,}/;
            const allCells = jsonRows.flat();
            registrarIds = [...new Set(
              allCells.filter(c => c && idPattern.test(String(c)))
                .map(id => String(id).toUpperCase().trim())
            )];

            if (importBtn) importBtn.innerText = `List Loaded (${registrarIds.length} IDs)`;
            sessionStorage.setItem('lastRegistrarIds', JSON.stringify(registrarIds));
            notify('Success', `Imported ${registrarIds.length} unique IDs.`);
          } catch (err) {
            console.error('Excel Parse Error:', err);
            notify('Error', 'Invalid Excel/CSV file.');
          }
        };
        reader.readAsArrayBuffer(file);
      };
    }

    if (matchBtn) {
      // Only show Import button if really needed? The user said "prepare 10 demo students", so maybe they don't need to import anymore.
      // But I'll leave the import button visually but change the match button to not depend on it.

      matchBtn.addEventListener('click', async (e) => {
        if (e) e.preventDefault();

        if (!window.confirm(`Match against the Registrar Database (10 Demo Students)?\nThis will remove any students not in the official list.`)) return;

        try {
          matchBtn.disabled = true;
          matchBtn.innerText = 'Matching...';

          // Send imported IDs to sync with DB
          const r = await authFetch(`${API_BASE}/registrar/match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ registrarIds })
          });

          let res;
          try {
            res = await r.json();
          } catch (e) {
            const txt = await r.text();
            alert('Server Error: ' + txt.substring(0, 50));
            return;
          }

          if (r.ok) {
            alert(`Match Complete!\nDeleted Students: ${res.deletedStudents}\nDeleted Applications: ${res.deletedApps}`);
            await loadApplications();
          } else {
            alert('Match failed: ' + (res.error || 'Unknown error'));
          }
        } catch (err) {
          alert('Network Failure: ' + err.message);
        } finally {
          matchBtn.disabled = false;
          matchBtn.innerText = 'Match Record';
        }
      });
    }

    const resetFilters = document.getElementById('resetFilters');
    if (resetFilters) resetFilters.addEventListener('click', () => {
      ['searchInput', 'categoryFilter', 'genderFilter', 'yearFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      filterAndRenderApps();
    });

    // State for filtering
    let allApplications = [];

    // Add event listeners for filters
    const ids = ['categoryFilter', 'genderFilter', 'yearFilter', 'searchInput'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', filterAndRenderApps);
    });

    await loadApplications();
  }

  async function loadApplications() {
    const tbody = document.getElementById('applicationsBody'); if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8">Loading...</td></tr>';
    try {
      let apps = [];
      let r = await authFetch(`${API_BASE}/applications`);
      if (r.ok) apps = await r.json();
      else { r = await fetch(`${API_URL}/_debug/db`); if (r.ok) { const db = await r.json(); apps = db.applications || []; } }

      if (!Array.isArray(apps)) apps = [];
      allApplications = apps; // Store for filtering

      filterAndRenderApps(); // Initial render

    } catch (e) { console.error('loadApplications', e); tbody.innerHTML = '<tr><td colspan="8">Failed to load</td></tr>'; }
  }

  function filterAndRenderApps() {
    const tbody = document.getElementById('applicationsBody');
    if (!tbody) return;

    const cat = document.getElementById('categoryFilter')?.value || '';
    const gen = document.getElementById('genderFilter')?.value || '';
    const yr = document.getElementById('yearFilter')?.value || '';
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();

    const filtered = allApplications.filter(a => {
      // Data normalization
      const d = a.data || {};
      const sId = (a.studentId || d.studentId || '').toLowerCase();
      const sName = (d.fullName || a.studentName || '').toLowerCase();
      const sCat = (a.residencyCategory || d.category || '').toLowerCase();
      const sGen = (d.gender || '').toLowerCase();
      const sYr = String(d.year || '');

      // Checks
      if (cat && sCat !== cat.toLowerCase()) return false;
      if (gen && sGen !== gen.toLowerCase()) return false;
      if (yr && sYr !== yr) return false;
      if (search && !sId.includes(search) && !sName.includes(search)) return false;

      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#666">No applications found.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(a => {
      const studentId = escapeHtml(a.studentId || a.data?.studentId || '-');
      const name = escapeHtml(a.data?.fullName || a.studentName || '-');
      const gender = escapeHtml(a.data?.gender || '-');
      const dept = escapeHtml(a.data?.department || '-');
      const year = escapeHtml(a.data?.year || '-');
      const category = escapeHtml(a.data?.category || '-');
      const status = escapeHtml(a.docStatus || a.status || '-');
      const remark = escapeHtml(a.adminRemark || '');
      return `<tr data-id="${escapeHtml(a.id)}"><td>${studentId}</td><td>${name}</td><td>${gender}</td><td>${dept}</td><td>${year}</td><td>${category}</td>
          <td title="${remark}" style="color:${status === 'Verified' ? 'green' : status === 'Rejected' ? 'red' : '#333'}; cursor:help;">${status} ${status === 'Rejected' ? 'ⓘ' : ''}</td></tr>`;
    }).join('');

    tbody.querySelectorAll('.view-docs-link').forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); openApplicationDocuments(link.dataset.id); }));
  }



  // Verification State
  let allVerificationApps = [];

  async function initDocumentVerification() {
    console.log("Initializing Document Verification...");
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadVerificationTable);

    // Filter Event Listeners
    ['categoryFilter', 'genderFilter', 'yearFilter', 'searchInput'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', filterAndRenderVerification);
    });

    // Reset Button
    const resetFilters = document.getElementById('resetFilters');
    if (resetFilters) resetFilters.addEventListener('click', () => {
      ['searchInput', 'categoryFilter', 'genderFilter', 'yearFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      filterAndRenderVerification();
    });

    await loadVerificationTable();
  }

  async function loadVerificationTable() {
    const tbody = document.getElementById('verificationBody'); if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8">Loading...</td></tr>';
    try {
      const r = await authFetch(`${API_BASE}/applications/pending`);
      if (r.ok) {
        const apps = await r.json();
        allVerificationApps = Array.isArray(apps) ? apps : [];
        filterAndRenderVerification();
      } else {
        tbody.innerHTML = '<tr><td colspan="8">Failed to load applications</td></tr>';
      }
    } catch (e) {
      console.error('loadVerificationTable', e);
      tbody.innerHTML = '<tr><td colspan="8">Failed to load</td></tr>';
    }
  }

  function filterAndRenderVerification() {
    const tbody = document.getElementById('verificationBody');
    if (!tbody) return;

    const cat = document.getElementById('categoryFilter')?.value || '';
    const gen = document.getElementById('genderFilter')?.value || '';
    const yr = document.getElementById('yearFilter')?.value || '';
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();

    const filtered = allVerificationApps.filter(a => {
      // Data normalization - check root and nested data props
      const d = a.data || {};
      const sId = (a.studentId || d.studentId || a.student_id || '').toLowerCase();
      const sName = (a.fullName || d.fullName || a.studentName || a.full_name || '').toLowerCase();
      const sCat = (a.residencyCategory || d.category || a.residence_category || '').toLowerCase();
      const sGen = (a.gender || d.gender || '').toLowerCase();
      const sYr = String(a.year || d.year || a.academic_year || '');

      // Checks
      if (cat && sCat !== cat.toLowerCase()) return false;
      if (gen && sGen !== gen.toLowerCase()) return false;
      if (yr && sYr !== yr) return false;
      if (search && !sId.includes(search) && !sName.includes(search)) return false;

      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#666">No pending applications found.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(a => {
      const d = a.data || {};
      const id = a.id;
      const sId = escapeHtml(a.studentId || d.studentId || a.student_id || '-');
      const name = escapeHtml(a.fullName || d.fullName || a.studentName || a.full_name || '-');
      const gender = escapeHtml(a.gender || d.gender || '-');
      const dept = escapeHtml(a.department || d.department || '-');
      const year = escapeHtml(a.year || d.year || a.academic_year || '-');
      const cat = escapeHtml(a.residencyCategory || d.category || a.residence_category || '-');
      const status = escapeHtml(a.docStatus || a.status || 'Pending');

      const remark = escapeHtml(a.adminRemark || '');

      return `<tr data-id="${escapeHtml(id)}">
        <td>${sId}</td>
        <td>${name}</td>
        <td>${gender}</td>
        <td>${dept}</td>
        <td>${year}</td>
        <td>${cat}</td>
        <td title="${remark}" style="cursor:help;">${status} ${status === 'Rejected' ? 'ⓘ' : ''}</td>
        <td>
          <button class="view-docs-btn" data-id="${escapeHtml(id)}">View Docs</button>
        </td>
      </tr>`;
    }).join('');

    // Re-attach event listeners
    tbody.querySelectorAll('.view-docs-btn').forEach(btn => {
      btn.addEventListener('click', () => openApplicationDocuments(btn.dataset.id));
    });
  }

  async function openApplicationDocuments(appId) {
    try {
      // Self-healing: Ensure correct modal exists
      if (!document.getElementById('docTableBody')) {
        console.warn('Doc modal corrupt or missing. Re-injecting...');
        const badModal = document.getElementById('docModal');
        if (badModal) badModal.remove();

        const docModalHtml = `
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
            </div>`;
        document.body.insertAdjacentHTML('beforeend', docModalHtml);
      }

      const r = await authFetch(`${API_BASE}/applications/${appId}`);
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
            fullUrl = `${window.location.origin}${fullUrl}`;
          }
          if (typeof API_URL !== 'undefined' && app.documents[type.key].startsWith('/uploads')) {
            fullUrl = `${API_URL}${app.documents[type.key]}`;
          }

          const tr = document.createElement('tr');
          tr.innerHTML = `
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight:500;">${type.label}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <a href="${fullUrl}" target="_blank" style="color: #2196F3; text-decoration: none;">View file</a>
                </td>
            `;
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
      if (reasonSelect) reasonSelect.value = ""; // Reset dropdown value

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
  }

  function showPreview(url) {
    const container = document.getElementById('docPreviewContainer');
    const fullUrl = `${API_URL}${url}`;
    const ext = url.split('.').pop().toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
      container.innerHTML = `<img src="${fullUrl}" style="max-width:100%; max-height:100%; object-fit:contain;" />`;
    } else if (ext === 'pdf') {
      container.innerHTML = `<iframe src="${fullUrl}" style="width:100%; height:100%; border:none;"></iframe>`;
    } else {
      container.innerHTML = `<a href="${fullUrl}" target="_blank">Download File</a>`;
    }
  }

  async function updateApplicationDocStatus(appId, docStatus, reason = null) {
    try {
      const body = { action: docStatus === 'Verified' ? 'verify' : 'reject' };
      if (reason) body.reason = reason;

      const r = await authFetch(`${API_BASE}/applications/${appId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!r.ok) {
        notify('Error', 'Update failed');
      } else {
        notify('Updated', `Application ${docStatus}`);
        const modal = document.getElementById('docModal');
        if (modal) modal.style.display = 'none';

        if (document.getElementById('verificationBody')) {
          await loadVerificationTable();
        }
      }
    } catch (e) {
      console.error(e);
      notify('Error', 'Network error: ' + e.message);
    }
  }

  // Room Management State
  let allRooms = [];

  function initRoomManagement() {
    harmonizeModalButtons();

    document.getElementById('addRoomBtn')?.addEventListener('click', () => openModal('addRoomModal'));
    document.getElementById('addSaveBtn')?.addEventListener('click', createRoomFromModal);

    // Bind Edit Save button
    document.getElementById('editSaveBtn')?.addEventListener('click', saveEditedRoom);

    // Bind Export button
    document.getElementById('exportCsvBtn')?.addEventListener('click', exportToExcel);

    const editBtn = document.getElementById('editRoomBtn') || Array.from(document.querySelectorAll('.top-buttons button')).find(b => /edit\s*room/i.test(b.innerText));
    if (editBtn) {
      editBtn.addEventListener('click', async () => {
        const selected = Array.from(document.querySelectorAll('.room-checkbox:checked')).map(cb => cb.dataset.id);
        if (selected.length === 0) return notify('Select Room', 'Please select one room to edit (double-click row or select and click Edit).');
        if (selected.length > 1) return notify('Select Single Room', 'Please select only one room to edit.');
        openEditRoomModal(selected[0]);
      });
    }

    let selectedRoomIds = [];
    const deleteBtn = document.getElementById('deleteRoomBtn') || Array.from(document.querySelectorAll('.top-buttons button')).find(b => /delete\s*room/i.test(b.innerText));
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        selectedRoomIds = Array.from(document.querySelectorAll('.room-checkbox:checked')).map(cb => cb.dataset.id);
        if (selectedRoomIds.length === 0) return notify('No Selection', 'Please select one or more rooms to delete.');

        const modal = document.getElementById('deleteRoomModal');
        if (modal) {
          const p = modal.querySelector('p');
          if (p) p.innerText = `Are you sure you want to permanently delete ${selectedRoomIds.length} selected room(s)?`;
          openModal('deleteRoomModal');
        } else {
          // Fallback to confirm if modal missing
          if (confirm(`Are you sure you want to delete ${selectedRoomIds.length} rooms?`)) {
            processRoomDeletion();
          }
        }
      });
    }

    document.getElementById('deleteConfirmBtn')?.addEventListener('click', processRoomDeletion);

    async function processRoomDeletion() {
      closeModal('deleteRoomModal');
      try {
        let count = 0;
        for (const id of selectedRoomIds) {
          try {
            const r = await authFetch(`${API_BASE}/rooms/${id}`, { method: 'DELETE' });
            if (r.ok) count++;
          } catch (e) {
            console.error('Delete failed for id:', id, e);
          }
        }
        notify('Deleted', `${count} room(s) removed successfully`);
        await loadRooms();
      } catch (e) {
        console.error(e);
        notify('Error', 'Failed to delete some rooms');
      }
    }

    // Filter Listeners
    ['filterDormBlock', 'filterStatus', 'searchRoomInput'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', filterAndRenderRooms);
    });

    const resetBtn = document.getElementById('resetFilters') || Array.from(document.querySelectorAll('.filters-search button')).find(b => /reset/i.test(b.innerText));
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        ['filterDormBlock', 'filterStatus', 'searchRoomInput'].forEach(id => {
          const el = document.getElementById(id);
          if (el) { if (el.tagName.toLowerCase() === 'select') el.selectedIndex = 0; else el.value = ''; }
        });
        filterAndRenderRooms();
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
    if (refreshBtn) refreshBtn.addEventListener('click', loadRooms);

    loadRooms();
  }

  async function fetchRooms() {
    try {
      const r = await authFetch(`${API_BASE}/rooms`);
      if (r.ok) return await r.json();
    } catch (e) { console.error('fetchRooms', e); }
    return [];
  }

  async function loadRooms() {
    const tbody = document.getElementById('dormTableBody'); if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';
    const rooms = await fetchRooms();
    allRooms = Array.isArray(rooms) ? rooms : [];
    filterAndRenderRooms();
  }

  function filterAndRenderRooms() {
    const tbody = document.getElementById('dormTableBody'); if (!tbody) return;

    const blockFilter = document.getElementById('filterDormBlock')?.value?.toLowerCase() || '';
    const statusFilter = document.getElementById('filterStatus')?.value?.toLowerCase() || '';
    const search = document.getElementById('searchRoomInput')?.value?.toLowerCase() || '';

    const filtered = allRooms.filter(r => {
      const rNo = String(r.room_number || '').toLowerCase();
      const rBlock = String(r.block_name || '').toLowerCase(); // e.g., 'male' or 'female'
      const rStatus = String(r.status || '').toLowerCase();

      // We assume block_name stores 'male' or 'female' or similar, matching the filter values
      // Check block
      if (blockFilter) {
        // If filter is 'male', we check if block_name includes 'male' (but 'female' also includes 'male' substr?)
        // Better to check robustly. If filter is 'male', we want block_name to be 'male' or 'male block'.
        // If filter is 'female', block_name should be 'female'.
        if (blockFilter === 'male' && rBlock.includes('female')) return false; // Female contains male string
        if (!rBlock.includes(blockFilter)) return false;
      }

      // Check status
      if (statusFilter) {
        if (statusFilter === 'empty' && r.current_occupancy > 0) return false;
        if (statusFilter === 'full' && r.current_occupancy < r.capacity) return false;
        // 'available' usually means there is space? or explicit status 'available'?
        // If user means status string:
        if (statusFilter === 'available' && rStatus !== 'available' && rStatus !== 'active') {
          // If we fallback to occupancy check: available if space > 0
          if (r.current_occupancy >= r.capacity) return false;
        }
        // Simple status string check
        if (statusFilter !== 'empty' && statusFilter !== 'full' && statusFilter !== 'available') {
          if (rStatus !== statusFilter) return false;
        }
      }

      // Check search
      if (search && !rNo.includes(search)) return false;

      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#666">No rooms found.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const id = r.id;
      const roomNo = escapeHtml(r.room_number || '-');
      const block = escapeHtml(r.block_name || '-');
      const capacity = r.capacity || 0;
      const occupied = r.current_occupancy || 0;
      const remaining = Math.max(0, capacity - occupied);
      const status = escapeHtml(r.status || 'Active');
      return `<tr data-id="${escapeHtml(id)}">
        <td><input type="checkbox" class="room-checkbox" data-id="${escapeHtml(id)}"></td>
        <td>${roomNo}</td><td>${block}</td><td>${capacity}</td><td>${occupied}</td><td>${remaining}</td><td>${status}</td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('tr[data-id]').forEach(tr => tr.addEventListener('dblclick', () => openEditRoomModal(tr.dataset.id)));
  }

  async function createRoomFromModal() {
    const blockName = document.getElementById('addDormBlock')?.value;
    const roomNumber = document.getElementById('addRoomNumber')?.value?.trim();
    const capacity = parseInt(document.getElementById('addCapacity')?.value) || 0;
    const status = document.getElementById('addStatus')?.value || 'Active';
    const gender = blockName === 'female' ? 'Female' : 'Male';

    if (!roomNumber || !blockName || !capacity) return notify('Error', 'Fill required fields');

    try {
      const r = await authFetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockName, roomNumber, capacity, status, gender })
      });
      const data = await r.json();
      if (r.ok) {
        notify('Created', 'Room added');
        closeModal('addRoomModal');
        await loadRooms();
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
    if (titleEl) titleEl.innerText = `Edit Dorm Room (Room ${room.room_number || room.id})`;

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
      const r = await authFetch(`${API_BASE}/rooms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockName, roomNumber, capacity, status, gender })
      });
      if (r.ok) {
        notify('Saved', 'Room updated successfully');
        closeModal('editRoomModal');
        await loadRooms();
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

  // Allocation State
  let allAllocations = [];

  function initAllocationPage() {
    // Run button
    document.getElementById('runAllocationBtn')?.addEventListener('click', async () => {
      if (!confirm("This will prioritize Rural and Medical students and randomly assign rooms. Continue?")) return;
      try {
        const r = await authFetch(`${API_BASE}/allocation/run`, { method: 'POST' });
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

    // Set Rules button
    document.getElementById('setRulesBtn')?.addEventListener('click', () => {
      console.log("Set Rules button clicked");
      const activeRules = JSON.parse(localStorage.getItem('dms_allocation_rules') || '[]');
      const checkboxes = document.querySelectorAll('.rules-checkboxes input[type="checkbox"]');
      console.log(`Found ${checkboxes.length} checkboxes`);
      checkboxes.forEach(cb => {
        cb.checked = activeRules.includes(cb.value);
      });
      openModal('rulesModal');
    });

    // Save Rules button
    document.getElementById('saveRulesBtn')?.addEventListener('click', () => {
      const selected = Array.from(document.querySelectorAll('.rules-checkboxes input[type="checkbox"]:checked')).map(cb => cb.value);
      localStorage.setItem('dms_allocation_rules', JSON.stringify(selected));
      notify('Saved', 'Allocation rules updated');
      closeModal('rulesModal');
    });

    // Excel Export
    document.getElementById('generateReportBtn')?.addEventListener('click', exportAllocationsToExcel);

    // Refresh/Reset
    document.getElementById('resetFilters')?.addEventListener('click', () => {
      ['filterGender', 'filterCategory', 'filterStatus', 'searchStudentInput'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { if (el.tagName.toLowerCase() === 'select') el.selectedIndex = 0; else el.value = ''; }
      });
      filterAndRenderAllocations();
    });

    // Filter Listeners
    ['filterGender', 'filterCategory', 'filterStatus', 'searchStudentInput'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', filterAndRenderAllocations);
    });

    // Refresh table on load
    loadAllocationResults();
  }

  async function loadAllocationResults() {
    const tbody = document.getElementById('allocationTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8">Loading allocations...</td></tr>';

    try {
      const r = await authFetch(`${API_BASE}/allocation/results`);
      if (r.ok) {
        const data = await r.json();
        allAllocations = Array.isArray(data) ? data : [];
        filterAndRenderAllocations();
      }
    } catch (e) {
      console.error(e);
      tbody.innerHTML = '<tr><td colspan="8">Failed to load results</td></tr>';
    }
  }

  function filterAndRenderAllocations() {
    const gender = document.getElementById('filterGender')?.value?.toLowerCase() || '';
    const category = document.getElementById('filterCategory')?.value?.toLowerCase() || '';
    const status = document.getElementById('filterStatus')?.value?.toLowerCase() || '';
    const search = document.getElementById('searchStudentInput')?.value?.toLowerCase() || '';

    const filtered = allAllocations.filter(item => {
      const sId = String(item.studentId || '').toLowerCase();
      const sName = String(item.full_name || '').toLowerCase();
      const sGen = String(item.gender || '').toLowerCase();
      const sCat = String(item.category || '').toLowerCase();
      const sStatus = String(item.status || '').toLowerCase();

      if (gender && sGen !== gender) return false;
      if (category && sCat !== category) return false;
      if (status && sStatus !== status) return false;
      if (search && !sId.includes(search) && !sName.includes(search)) return false;

      return true;
    });

    renderAllocationTable(filtered);
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
      const roomInfo = alloc ? `${alloc.dormName} - ${alloc.roomNumber}` : 'Not Allocated';

      return `<tr>
        <td><input type="checkbox" class="student-checkbox" data-id="${item.id}"></td>
        <td>${escapeHtml(item.studentId)}</td>
        <td>${escapeHtml(item.full_name)}</td>
        <td>${escapeHtml(item.gender)}</td>
        <td>${escapeHtml(item.department)}</td>
        <td>${escapeHtml(item.category)}</td>
        <td>${roomInfo}</td>
        <td>${escapeHtml(item.status)}</td>
      </tr>`;
    }).join('');
  }

  async function exportAllocationsToExcel() {
    try {
      const r = await authFetch(`${API_BASE}/allocation/results`);
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

  function setupUniversalUI() {
    document.querySelectorAll('.logout').forEach(b => b.addEventListener('click', (e) => { e.preventDefault(); sessionStorage.clear(); window.location.href = 'admin-login.html'; }));
  }

  function setAdminHeader(user) {
    const nameEl = document.getElementById('adminName'); const roleEl = document.getElementById('adminRole');
    if (nameEl) nameEl.innerText = user.name ?? user.adminId ?? user.id ?? 'Admin';
    if (roleEl) roleEl.innerText = user.role ?? 'Administrator';
  }

  function renderProfessionalLockout() {
    document.documentElement.innerHTML = `<div style="height:100vh;background:#f4f7f6;display:flex;align-items:center;justify-content:center;font-family:sans-serif;">
      <div style="background:white;padding:50px;border-radius:16px;text-align:center;border-top:10px solid #d9534f;">
        <h1>Restricted</h1><p>Insufficient permissions or not logged in.</p>
        <a href="admin-login.html" style="background:#003366;color:white;padding:12px 35px;text-decoration:none;border-radius:8px;">Back to Login</a>
      </div></div>`;
  }

  // -------------------------
  // Modals injection + helpers
  // -------------------------
  function injectAdminModals() {
    // Force inject/update Document Verification Modal
    const existingDocModal = document.getElementById('docModal');
    if (existingDocModal) existingDocModal.remove();

    const docModalHtml = `
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
      </div>`;
    document.body.insertAdjacentHTML('beforeend', docModalHtml);

    if (document.getElementById('notifyModal')) return; // already injected by earlier run
    // Only inject rulesModal if it doesn't already exist in the HTML
    const hasRulesModal = document.getElementById('rulesModal');
    const html = `
      <!-- Add Admin Modal -->
      <div id="addAdminModal" class="sys-modal" style="display:none"><div class="modal-content">
        <h3>Add New System User</h3>
        <div class="form-grid">
          <input id="newName" placeholder="Full Name" />
          <input id="newId" placeholder="Admin ID (Unique)" />
          <input id="newPhone" placeholder="Phone No" />
          <input id="newPass" placeholder="Temp Password" type="password" />
          <select id="newResponsibility">
             <option value="">-- Select Admin Position --</option>
             <option value="ALLOCATION">Dorm Allocation Admin</option>
             <option value="ROOMS">Room Management Admin</option>
             <option value="VERIFY">Document Verification Admin</option>
             <option value="OVERVIEW">Application Overview Admin</option>
          </select>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="cancel-btn" onclick="closeModal('addAdminModal')">Cancel</button>
          <button class="verify-btn" onclick="saveNewAdmin()">Create Admin</button>
        </div>
      </div></div>

      <!-- Manage Roles Modal -->
      <div id="manageRolesModal" class="sys-modal" style="display:none"><div class="modal-content" style="width:420px;">
        <h3>Manage User Roles</h3>
        <input id="manageAdminIdInput" placeholder="Enter Admin ID (e.g., dorm_02)"/>
        <button id="manageLookupBtn" class="verify-btn" style="margin-top:8px;">Lookup</button>
        <div id="manageAdminInfo" style="margin:10px 0;color:#555;font-size:0.95rem;"></div>
        <div style="text-align:left;padding:6px;">
          <label><input type="checkbox" value="OVERVIEW"> Application Overview</label><br/>
          <label><input type="checkbox" value="VERIFY"> Document Verification</label><br/>
          <label><input type="checkbox" value="ROOMS"> Room Management</label><br/>
          <label><input type="checkbox" value="ALLOCATION"> Dorm Allocation</label>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="cancel-btn" onclick="closeModal('manageRolesModal')">Back</button>
          <button class="verify-btn" onclick="updateRoles()">Save Change</button>
        </div>
      </div></div>

      <!-- Delete Admin Modal -->
      <div id="deleteAdminModal" class="sys-modal" style="display:none"><div class="modal-content" style="width:420px;">
        <h3>Delete System User</h3>
        <p>To confirm deletion, enter the Admin ID below. This action is irreversible.</p>
        <input id="delAdminIdInput" placeholder="Enter Admin ID (e.g., dorm_02)"/>
        <div style="color:#c33;margin-top:6px;font-size:0.9rem;">Warning: Ensure the ID is correct before proceeding.</div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="cancel-btn" onclick="closeModal('deleteAdminModal')">Back</button>
          <button class="reject-btn" style="background:#d9534f;color:white;" onclick="confirmDeleteAdmin()">Confirm Deletion</button>
        </div>
      </div></div>

      ${hasRulesModal ? '' : `
      <!-- Rules Modal for Allocation -->
      <div id="rulesModal" class="sys-modal" style="display:none"><div class="modal-content" style="width:640px;">
        <h3>Current Allocation Rules</h3>
        <div style="display:flex;flex-wrap:wrap;gap:12px;">
          <label><input type="checkbox" value="gender"> Gender Separation</label>
          <label><input type="checkbox" value="medical"> Medical Priority</label>
          <label><input type="checkbox" value="75percent"> 75% Rule Compliance</label>
          <label><input type="checkbox" value="distance"> Distance Priority</label>
          <label><input type="checkbox" value="rural"> Category Priority (Rural)</label>
          <label><input type="checkbox" value="placeholder"> Rule Placeholder</label>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;"><button class="cancel-btn" onclick="closeModal('rulesModal')">Close</button><button class="verify-btn" id="saveRulesBtn">Save Rules</button></div>
      </div></div>
      `}

      <!-- Notify modal -->
      <div id="notifyModal" class="sys-modal" style="display:none"><div class="modal-content"><h3 id="nT"></h3><p id="nB"></p><button class="verify-btn" onclick="closeModal('notifyModal')">OK</button></div></div>

      <style>
        .sys-modal { position:fixed; z-index:9999; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; }
        .sys-modal .modal-content { background:#fff; padding:20px; border-radius:10px; box-shadow:0 6px 20px rgba(0,0,0,0.12); }
        .sys-modal input, .sys-modal select { width:100%; padding:10px; margin:8px 0; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; }
        .verify-btn { background:#1e6bd8; color:#fff; padding:10px 14px; border-radius:6px; border:none; cursor:pointer; }
        .cancel-btn { background:#1e6bd8; color:#fff; padding:10px 14px; border-radius:6px; border:none; cursor:pointer; } /* same color as save */
        .reject-btn { padding:10px 14px; border-radius:6px; border:none; cursor:pointer; }
        .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; align-items:center; }
        @media(max-width:620px){ .form-grid { grid-template-columns:1fr; } .sys-modal .modal-content{width:95%;} }
      </style>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  window.openModal = (id) => { const el = document.getElementById(id); if (!el) return; el.style.display = 'flex'; if (id === 'manageRolesModal') refreshAdminList(); };
  window.closeModal = (id) => { const el = document.getElementById(id); if (!el) return; el.style.display = 'none'; };
  window.notify = (title, body) => { const nT = document.getElementById('nT'), nB = document.getElementById('nB'); if (nT && nB) { nT.innerText = title; nB.innerText = body; openModal('notifyModal'); } else alert(`${title}\\n\\n${body}`); };

  // -------------------------
  // Utilities
  // -------------------------
  function escapeHtml(str) { if (str === undefined || str === null) return ''; return String(str).replace(/[&<>"'`=\/]/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;', '=': '&#61;', '/': '&#47;' })[s]); }

  // Expose helpers for debugging
  window.__adminHelpers = {
    fetchUser, hasPermission, refreshPhaseTable, refreshAdminList, loadRooms, loadApplications: window.loadApplications
  };
  // Target the forgot password link
  const forgotLink = document.getElementById('forgotPassword');
  if (forgotLink) {
    forgotLink.addEventListener('click', function (e) {
      e.preventDefault(); // prevent default page jump
      const email = prompt("Enter your email to reset password:");
      if (email) {
        alert("A reset link has been sent to: " + email);
      } else {
        alert("Please enter a valid email.");
      }
    });
  }


})();