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

const API_URL = "http://localhost:3000/api";

  // Helper to get auth token
  function getAuthToken() {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  // Helper to make authenticated API calls
  async function authFetch(url, options = {}) {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(options.headers || {})
    };
    return fetch(url, { ...options, headers });
  }

(function () {
  document.addEventListener('DOMContentLoaded', async () => {
    // Ensure admin modals exist (inserts them if not)
    injectAdminModals();

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Public pages
    if (currentPage === 'index.html') {
      document.body.style.visibility = 'visible';
      renderHomeAnnouncements().catch(()=>{});
      return;
    }
    if (currentPage.includes('admin-login')) {
      document.body.style.visibility = 'visible';
      initLoginLogic();
      return;
    }

    // Protected pages
    const resourceId = sessionStorage.getItem('adminResourceId') || sessionStorage.getItem('adminId');
    const user = await fetchUser(resourceId);

    if (!user || !hasPermission(user, window.location.pathname)) {
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
    if (currentPage === 'system-admin.html') initSystemAdminUI();
    if (currentPage === 'application-overview.html') initApplicationOverview();
    if (currentPage === 'document-verification.html') initDocumentVerification();
    if (currentPage === 'dorm-rooms.html') initRoomManagement();
    if (currentPage === 'dorm-allocation.html') initAllocationPage();
  });

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
  // Helper to get auth token
  function getAuthToken() {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  // Helper to make authenticated API calls
  async function authFetch(url, options = {}) {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(options.headers || {})
    };
    return fetch(url, { ...options, headers });
  }

  async function fetchUser(identifier) {
    if (!identifier) return null;
    try {
      const token = getAuthToken();
      if (!token) return null;

      // Try to get admin by ID from admin list
      let r = await authFetch(`${API_URL}/adminRegistry`);
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
      perms: Array.isArray(a.perms) ? a.perms : (typeof a.perms === 'string' ? a.perms.split(',').map(s => s.trim()) : [])
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
        // Use Express API login endpoint
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: idInput, password: passInput })
        });

        // Check if response is ok
        if (!res.ok) {
          // Try to get error message
          try {
            const errorData = await res.json();
            return showLoginError(errorData.message || `Server error (${res.status})`);
          } catch (e) {
            return showLoginError(`Server error: ${res.status} ${res.statusText}. Make sure the server is running on http://localhost:3000`);
          }
        }

        const result = await res.json();
        
        if (result.success && result.data && result.data.token) {
          const user = result.data.user;
          
          // Check if user is admin
          if (user.role !== 'system_admin' && user.role !== 'dorm_manager') {
            return showLoginError('Access denied. Admin credentials required.');
          }

          // Store session
          localStorage.setItem('auth_token', result.data.token);
          sessionStorage.setItem('auth_token', result.data.token);
          sessionStorage.setItem('adminResourceId', String(user.id));
          sessionStorage.setItem('adminId', String(user.id));
          sessionStorage.setItem('adminKey', String(user.adminId || user.id));
          sessionStorage.setItem('adminRole', user.role);
          
          // Redirect based on role
          window.location.href = (user.role === 'system_admin') ? 'system-admin.html' : 'admin-home.html';
          return;
        }

        showLoginError(result.message || 'Invalid credentials');
      } catch (err) {
        console.error('login error', err);
        showLoginError(`Network error: ${err.message}. Make sure the server is running on http://localhost:3000`);
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
        if (!text) return notify('Error','Announcement empty');
        try {
          const r = await authFetch(`${API_URL}/notifications/publicAnnouncements`, { method:'POST', body: JSON.stringify({ title: 'Update', message: text, targetAudience: 'all' }) });
          if (!r.ok) { console.error('announce failed', await r.text()); return notify('Error','Failed to post'); }
          notify('Success','Announcement posted'); if (ta) ta.value = '';
        } catch (err) { console.error(err); notify('Error','Network error'); }
      });
    }

    // Manage Roles: lookup button wiring (if present)
    const lookupBtn = document.getElementById('manageLookupBtn');
    if (lookupBtn) {
      lookupBtn.addEventListener('click', async () => {
        const typed = document.getElementById('manageAdminIdInput')?.value?.trim();
        if (!typed) return notify('Error','Enter Admin ID to lookup');
        const admin = await findAdminByIdentifier(typed);
        if (!admin) return notify('Error','Admin not found');
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
      const r = await fetch(`${API_URL}/adminRegistry`);
      if (!r.ok) return;
      const list = await r.json();
      sel.innerHTML = '<option value="">-- Select Admin --</option>';
      (Array.isArray(list) ? list : []).forEach(a => {
        if (a.role === 'SYSTEM') return;
        const value = a.id ?? a._id ?? a.adminId ?? '';
        const label = a.adminId ?? a.id ?? a._id ?? value;
        sel.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(value)}">${escapeHtml(String(label))}</option>`);
      });
    } catch (e) { console.error('refreshAdminList', e); }
  }

  window.saveNewAdmin = async () => {
    const name = document.getElementById('newName')?.value?.trim();
    const adminId = document.getElementById('newId')?.value?.trim();
    const phone = document.getElementById('newPhone')?.value?.trim();
    const pass = document.getElementById('newPass')?.value?.trim();
    const role = document.getElementById('newRole')?.value || 'DORM';
    if (!adminId || !pass || !name) return notify('Error','Name, Admin ID and Password are required');
    try {
      const res = await fetch(`${API_URL}/adminRegistry`);
      const list = res.ok ? await res.json() : [];
      if (Array.isArray(list) && list.some(a => String(a.adminId ?? a.id) === String(adminId))) return notify('Error','Admin ID already exists');
      const perms = role === 'SYSTEM' ? ['SYSTEM','HOME','OVERVIEW','VERIFY','ROOMS','ALLOCATION'] : ['HOME'];
      const payload = { adminId, name, phone, pass, role, perms };
      const r = await fetch(`${API_URL}/adminRegistry`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if (!r.ok) { console.error('create admin failed', await r.text()); return notify('Error','Server failed to create'); }
      notify('Created', `New ${role} created successfully`);
      closeModal('addAdminModal');
      await refreshAdminList();
    } catch (e) { console.error(e); notify('Error','Network error'); }
  };

  window.updateRoles = async () => {
    const modal = document.getElementById('manageRolesModal');
    let resourceId = modal?.dataset.resourceId || null;
    const typed = document.getElementById('manageAdminIdInput')?.value?.trim();
    if (typed) {
      const admin = await findAdminByIdentifier(typed);
      if (!admin) return notify('Error','Admin not found');
      resourceId = admin.id;
    }
    if (!resourceId) resourceId = document.getElementById('adminSel')?.value;
    if (!resourceId) return notify('Error','Select or enter an admin');

    const perms = [];
    document.querySelectorAll('#manageRolesModal input[type="checkbox"]').forEach(cb => { if (cb.checked) perms.push(cb.value); });
    if (!perms.includes('HOME')) perms.unshift('HOME');

    try {
      const r = await fetch(`${API_URL}/adminRegistry/${resourceId}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ perms }) });
      if (!r.ok) { console.error(await r.text()); return notify('Error','Server failed to update roles'); }
      notify('Updated','Permissions updated successfully');
      closeModal('manageRolesModal');
      await refreshAdminList();

      // If the updated admin is the currently logged-in admin, refresh UI and permissions
      const currentResource = sessionStorage.getItem('adminResourceId') || sessionStorage.getItem('adminId') || sessionStorage.getItem('adminKey');
      if (String(currentResource) === String(resourceId) || String(currentResource) === String(typed)) {
        const newUser = await fetchUser(resourceId);
        if (newUser) {
          applyUiPermissions(newUser);
          interceptSidebarLinks(newUser);
          setAdminHeader(newUser);
          // optionally reload page to enforce stricter checks (uncomment if desired)
          // window.location.reload();
        }
      }
    } catch (e) { console.error(e); notify('Error','Network error'); }
  };

  window.confirmDeleteAdmin = async () => {
    const idToDelete = document.getElementById('delAdminIdInput')?.value?.trim() || document.getElementById('delId')?.value?.trim();
    if (!idToDelete) return notify('Error','Enter Admin ID to delete');
    if (idToDelete.toLowerCase() === 'sysadmin') return notify('Error','Cannot delete core SYSTEM admin');
    try {
      const admin = await findAdminByIdentifier(idToDelete);
      if (!admin) return notify('Error','Admin not found');
      if (admin.role === 'SYSTEM') return notify('Error','Cannot delete SYSTEM account');
      if (!confirm(`Permanently delete admin ${admin.adminId || admin.id}?`)) return;
      const r = await fetch(`${API_URL}/adminRegistry/${admin.id ?? admin._id}`, { method:'DELETE' });
      if (!r.ok) { console.error(await r.text()); return notify('Error','Server failed to delete'); }
      notify('Deleted','Admin removed successfully');
      closeModal('deleteAdminModal');
      await refreshAdminList();

      // if the deleted admin is currently logged-in, log them out
      const currentResource = sessionStorage.getItem('adminResourceId') || sessionStorage.getItem('adminId');
      if (String(currentResource) === String(admin.id) || String(currentResource) === String(admin.adminId)) {
        sessionStorage.clear();
        notify('Notice','Your account was removed. Redirecting to login.');
        setTimeout(() => window.location.href = 'admin-login.html', 1200);
      }
    } catch (e) { console.error(e); notify('Error','Network error'); }
  };

  // -------------------------
  // Helper admin lookup
  // -------------------------
  async function findAdminByIdentifier(identifier) {
    if (!identifier) return null;
    try {
      let r = await fetch(`${API_URL}/adminRegistry/${identifier}`);
      if (r.ok) return await r.json();
      r = await fetch(`${API_URL}/adminRegistry`);
      if (!r.ok) return null;
      const list = await r.json();
      return (Array.isArray(list) ? list.find(a => String(a.id) === String(identifier) || String(a.adminId) === String(identifier)) : null) || null;
    } catch (e) { console.error('findAdminByIdentifier', e); return null; }
  }

  async function getAdminByResourceId(resourceId) {
    if (!resourceId) return null;
    try {
      const r = await fetch(`${API_URL}/adminRegistry/${resourceId}`);
      if (r.ok) return await r.json();
      const lr = await fetch(`${API_URL}/adminRegistry`);
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
    if (!type) return notify('Error','Select phase type');
    if (!start) return notify('Error','Pick a start date');
    if (!end) return notify('Error','Pick an end date');
    try {
      const payload = { type, start, end, status: 'Active', createdAt: new Date().toISOString() };
      const r = await fetch(`${API_URL}/phases`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if (!r.ok) { console.error('add phase', await r.text()); return notify('Error','Failed to add phase'); }
      notify('Added','Phase created');
      await refreshPhaseTable();
      if (typeEl) typeEl.value = ''; if (startEl) startEl.value = ''; if (endEl) endEl.value = '';
    } catch (e) { console.error(e); notify('Error','Network error'); }
  }

  async function refreshPhaseTable() {
    const tbody = document.querySelector('.system-admin .data-table tbody') || document.querySelector('.data-table tbody');
    if (!tbody) return;
    try {
      const r = await authFetch(`${API_URL.replace('/api', '')}/phases`);
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
          const r = await authFetch(`${API_URL.replace('/api', '')}/phases/${id}`, { method:'PATCH', body: JSON.stringify({ status: next }) });
          if (!r.ok) { console.error('toggle failed', await r.text()); return notify('Error','Failed to change status'); }
          notify('Updated', `Phase ${next}`);
          await refreshPhaseTable();
        } catch (e) { console.error(e); notify('Error','Network error'); }
      }));
      tbody.querySelectorAll('button.delete-phase').forEach(b => b.addEventListener('click', async () => {
        const id = b.dataset.id;
        if (!confirm('Delete this phase?')) return;
        try {
          const r = await authFetch(`${API_URL.replace('/api', '')}/phases/${id}`, { method:'DELETE' });
          if (!r.ok) { console.error(await r.text()); return notify('Error','Failed to delete'); }
          notify('Deleted','Phase removed'); await refreshPhaseTable();
        } catch (e) { console.error(e); notify('Error','Network error'); }
      }));
    } catch (e) { console.error('refreshPhaseTable', e); }
  }

  // -------------------------
  // Applications & Verification
  // -------------------------
  async function initApplicationOverview() {
    document.getElementById('refreshBtn')?.addEventListener('click', loadApplications);
    document.getElementById('matchBtn')?.addEventListener('click', () => notify('Info','Match not implemented'));
    document.getElementById('importBtn')?.addEventListener('click', () => notify('Info','Import not implemented'));
    document.getElementById('resetFilters')?.addEventListener('click', () => { const s = document.getElementById('searchInput'); if (s) s.value=''; loadApplications(); });
    await loadApplications();
  }

  async function loadApplications() {
    const tbody = document.getElementById('applicationsBody'); if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8">Loading...</td></tr>';
    try {
      let apps = [];
      let r = await authFetch(`${API_URL.replace('/api', '')}/applications`);
      if (r.ok) apps = await r.json();
      else { r = await fetch(`${API_URL}/_debug/db`); if (r.ok) { const db = await r.json(); apps = db.applications || []; } }
      if (!Array.isArray(apps) || apps.length === 0) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#666">No applications found.</td></tr>'; return; }
      tbody.innerHTML = apps.map(a => {
        const studentId = escapeHtml(a.studentId || a.data?.studentId || '-');
        const name = escapeHtml(a.data?.fullName || a.studentName || '-');
        const gender = escapeHtml(a.data?.gender || '-');
        const dept = escapeHtml(a.data?.department || '-');
        const year = escapeHtml(a.data?.year || '-');
        const category = escapeHtml(a.data?.category || '-');
        const status = escapeHtml(a.docStatus || a.status || '-');
        return `<tr data-id="${escapeHtml(a.id)}"><td>${studentId}</td><td>${name}</td><td>${gender}</td><td>${dept}</td><td>${year}</td><td>${category}</td>
          <td><a href="#" class="view-docs-link" data-id="${escapeHtml(a.id)}">View Doc't</a></td>
          <td style="color:${status==='Verified'?'green':status==='Rejected'?'red':'#333'}">${status}</td></tr>`;
      }).join('');
      tbody.querySelectorAll('.view-docs-link').forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); openApplicationDocuments(link.dataset.id); }));
    } catch (e) { console.error('loadApplications', e); tbody.innerHTML = '<tr><td colspan="8">Failed to load</td></tr>'; }
  }

  

  async function loadVerificationTable() {
    const tbody = document.getElementById('verificationBody'); if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8">Loading...</td></tr>';
    try {
      let apps = []; let r = await fetch(`${API_URL}/applications`);
      if (r.ok) apps = await r.json(); else { r = await fetch(`${API_URL}/_debug/db`); if (r.ok) { const db = await r.json(); apps = db.applications || []; } }
      if (!Array.isArray(apps) || apps.length === 0) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#666">No applications found.</td></tr>'; return; }
      tbody.innerHTML = apps.map(a => {
        const sid = escapeHtml(a.studentId || '-'); const name = escapeHtml(a.data?.fullName || '-');
        const gender = escapeHtml(a.data?.gender || '-'); const dept = escapeHtml(a.data?.department || '-');
        const year = escapeHtml(a.data?.year || '-'); const category = escapeHtml(a.data?.category || '-');
        const status = escapeHtml(a.docStatus || a.status || '-');
        return `<tr data-id="${escapeHtml(a.id)}" data-status="${escapeHtml(status)}"><td>${sid}</td><td>${name}</td><td>${gender}</td><td>${dept}</td><td>${year}</td><td>${category}</td>
          <td><a href="#" class="view-docs-btn" data-id="${escapeHtml(a.id)}">View Doc't</a></td>
          <td style="color:${status==='Verified'?'green':status==='Rejected'?'red':'#333'}">${status}</td></tr>`;
      }).join('');
      tbody.querySelectorAll('.view-docs-btn').forEach(b => b.addEventListener('click', (e) => { e.preventDefault(); openApplicationDocuments(b.dataset.id); }));
    } catch (e) { console.error('loadVerificationTable', e); tbody.innerHTML = '<tr><td colspan="8">Failed to load</td></tr>'; }
  }

  async function openApplicationDocuments(appId) {
    try {
      const r = await fetch(`${API_URL}/applications/${appId}`);
      let app = null;
      if (r.ok) app = await r.json();
      else {
        const r2 = await fetch(`${API_URL}/_debug/db`);
        const db = r2.ok ? await r2.json() : null;
        app = (db && Array.isArray(db.applications)) ? db.applications.find(x => String(x.id) === String(appId)) : null;
      }
      if (!app) return notify('Error','Application not found');
      const modal = document.getElementById('docModal');
      modal.dataset.appId = appId;
      document.getElementById('docType').innerText = app.data?.documentType || 'Documents';
      document.getElementById('docFileName').innerText = (app.data?.files && app.data.files[0]?.name) || 'file';
      const frame = document.getElementById('docFrame');
      const url = (app.data?.files && app.data.files[0]?.url) || app.data?.filesUrl?.[0] || '';
      frame.src = url || '';
      openDocumentModal();
    } catch (e) { console.error('openApplicationDocuments', e); notify('Error','Failed to load application'); }
  }

  async function updateApplicationDocStatus(appId, docStatus) {
    try {
      const r = await authFetch(`${API_URL.replace('/api', '')}/applications/${appId}`, { method:'PATCH', body: JSON.stringify({ docStatus }) });
      if (!r.ok) { console.warn('PATCH failed', await r.text()); notify('Warning','Server did not accept update'); }
      else notify('Updated', `Document ${docStatus}`);
      closeDocumentModal(); await loadVerificationTable(); await loadApplications();
    } catch (e) { console.error(e); notify('Error','Network error updating status'); }
  }

  // -------------------------
  // Rooms (full implementation included)
  // -------------------------
  function initRoomManagement() {
    // harmonize button colors
    harmonizeModalButtons();

    document.getElementById('addRoomBtn')?.addEventListener('click', () => openModal('addRoomModal'));
    document.getElementById('addSaveBtn')?.addEventListener('click', createRoomFromModal);

    const editBtn = document.getElementById('editRoomBtn') || Array.from(document.querySelectorAll('.top-buttons button')).find(b => /edit\s*room/i.test(b.innerText));
    if (editBtn) {
      editBtn.addEventListener('click', async () => {
        const selected = Array.from(document.querySelectorAll('.room-checkbox:checked')).map(cb => cb.dataset.id);
        if (selected.length === 0) return notify('Select Room','Please select one room to edit (double-click row or select and click Edit).');
        if (selected.length > 1) return notify('Select Single Room','Please select only one room to edit.');
        openEditRoomModal(selected[0]);
      });
    }

    const deleteBtn = document.getElementById('deleteRoomBtn') || Array.from(document.querySelectorAll('.top-buttons button')).find(b => /delete\s*room/i.test(b.innerText));
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        const selected = Array.from(document.querySelectorAll('.room-checkbox:checked')).map(cb => cb.dataset.id);
        if (selected.length === 0) return notify('No Selection','Please select one or more rooms to delete.');
        if (!confirm(`Are you sure you want to permanently delete ${selected.length} selected room(s)?`)) return;
        try {
          for (const id of selected) { try { await authFetch(`${API_URL.replace('/api', '')}/rooms/${id}`, { method:'DELETE' }); } catch (e) { /* ignore */ } }
        } catch (e) {}
        let rooms = await fetchRooms();
        rooms = rooms.filter(r => !selected.includes(String(r.id)) && !selected.includes(String(r.roomNo)));
        await saveRoomsToLocal(rooms);
        notify('Deleted', `${selected.length} room(s) removed`);
        await renderRoomsTable();
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
      const r = await authFetch(`${API_URL.replace('/api', '')}/rooms`);
      if (r.ok) return await r.json();
    } catch (e) {}
    const raw = localStorage.getItem('dms_rooms');
    return raw ? JSON.parse(raw) : [];
  }

  async function saveRoomsToLocal(rooms) { localStorage.setItem('dms_rooms', JSON.stringify(rooms)); }

  async function renderRoomsTable() {
    const tbody = document.getElementById('dormTableBody'); if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';
    try {
      const rooms = await fetchRooms();
      if (!rooms || rooms.length === 0) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#666">No rooms found.</td></tr>'; return; }
      tbody.innerHTML = rooms.map(r => {
        const id = r.id ?? r.roomNo ?? Math.random().toString(36).slice(2,8);
        const roomNo = escapeHtml(r.roomNo ?? r.id ?? '-');
        const block = escapeHtml(r.block ?? r.dormBlock ?? '-');
        const capacity = escapeHtml(String(r.capacity ?? '-'));
        const occupied = Number(r.occupied ?? 0);
        const remaining = Math.max(0, (r.capacity ?? 0) - occupied);
        const status = escapeHtml(r.status ?? (occupied >= (r.capacity ?? 0) ? 'Full' : 'Empty'));
        return `<tr data-id="${escapeHtml(id)}"><td><input type="checkbox" class="room-checkbox" data-id="${escapeHtml(id)}"></td>
          <td>${roomNo}</td><td>${block}</td><td>${capacity}</td><td>${occupied}</td><td>${remaining}</td><td>${status}</td></tr>`;
      }).join('');
      tbody.querySelectorAll('tr[data-id]').forEach(tr => tr.addEventListener('dblclick', () => openEditRoomModal(tr.dataset.id)));
    } catch (e) { console.error('renderRoomsTable', e); tbody.innerHTML = '<tr><td colspan="7">Failed to load</td></tr>'; }
  }

  async function createRoomFromModal() {
    const block = document.getElementById('addDormBlock')?.value?.trim();
    const roomNo = document.getElementById('addRoomNumber')?.value?.trim();
    const capacity = parseInt(document.getElementById('addCapacity')?.value) || 0;
    const status = document.getElementById('addStatus')?.value || 'Empty';
    if (!roomNo || !block || !capacity) return notify('Error','Fill required fields');
    const newRoom = { id: 'r_'+Date.now(), roomNo, block, capacity, occupied: 0, status };
    try {
      const r = await authFetch(`${API_URL.replace('/api', '')}/rooms`, { method:'POST', body: JSON.stringify(newRoom) });
      if (r.ok) { notify('Created','Room added (backend)'); closeModal('addRoomModal'); await renderRoomsTable(); return; }
    } catch (e) {}
    const rooms = await fetchRooms(); rooms.push(newRoom); await saveRoomsToLocal(rooms);
    notify('Created','Room added (local)'); closeModal('addRoomModal'); await renderRoomsTable();
  }

  async function openEditRoomModal(id) {
    const rooms = await fetchRooms();
    const room = (rooms || []).find(r => String(r.id) === String(id) || String(r.roomNo) === String(id));
    if (!room) return notify('Error','Room not found');
    document.getElementById('editDormBlock').value = room.block || room.dormBlock || '';
    document.getElementById('editRoomNumber').value = room.roomNo || '';
    document.getElementById('editCapacity').value = room.capacity || '';
    document.getElementById('editStatus').value = room.status || 'Empty';
    document.getElementById('editRoomModal').dataset.editId = room.id ?? room.roomNo;
    const titleEl = document.querySelector('#editRoomModal .modal-content h3'); if (titleEl) titleEl.innerText = `Edit Dorm Room (Room ${room.roomNo || room.id})`;
    harmonizeModalButtons();
    openModal('editRoomModal');
  }

  async function saveEditedRoom() {
    const id = document.getElementById('editRoomModal')?.dataset.editId;
    if (!id) return notify('Error','No room selected');
    const block = document.getElementById('editDormBlock')?.value?.trim();
    const roomNo = document.getElementById('editRoomNumber')?.value?.trim();
    const capacity = parseInt(document.getElementById('editCapacity')?.value) || 0;
    const status = document.getElementById('editStatus')?.value || 'Empty';
    if (!roomNo || !block || !capacity) return notify('Error','Fill required fields');
    try {
      const r = await authFetch(`${API_URL.replace('/api', '')}/rooms/${id}`, { method:'PATCH', body: JSON.stringify({ block, roomNo, capacity, status }) });
      if (r.ok) { notify('Saved','Room updated (backend)'); closeModal('editRoomModal'); await renderRoomsTable(); return; }
    } catch (e) {}
    const rooms = await fetchRooms(); const idx = rooms.findIndex(r => String(r.id) === String(id) || String(r.roomNo) === String(id));
    if (idx === -1) return notify('Error','Room not found locally');
    rooms[idx] = { ...rooms[idx], block, roomNo, capacity, status };
    await saveRoomsToLocal(rooms); notify('Saved','Room updated (local)'); closeModal('editRoomModal'); await renderRoomsTable();
  }

  // -------------------------
  // Allocation rules (persistence)
  // -------------------------
  function initAllocationPage() {
    document.getElementById('runAllocationBtn')?.addEventListener('click', () => notify('Info','Allocation algorithm not implemented in frontend'));
    document.getElementById('generateReportBtn')?.addEventListener('click', () => notify('Info','Export not implemented in frontend'));
    document.getElementById('setRulesBtn')?.addEventListener('click', () => {
      const stored = JSON.parse(localStorage.getItem('dms_rules') || 'null');
      if (stored && Array.isArray(stored)) document.querySelectorAll('#rulesModal input[type="checkbox"]').forEach(cb => cb.checked = stored.includes(cb.value));
      openModal('rulesModal');
    });
    document.getElementById('saveRulesBtn')?.addEventListener('click', () => {
      const selected = Array.from(document.querySelectorAll('#rulesModal input[type="checkbox"]:checked')).map(cb => cb.value);
      localStorage.setItem('dms_rules', JSON.stringify(selected));
      notify('Saved','Allocation rules saved');
      closeModal('rulesModal');
    });
  }

  // -------------------------
  // Universal helpers & UI
  // -------------------------
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
    if (document.getElementById('notifyModal')) return; // already injected by earlier run
    const html = `
      <!-- Add Admin Modal -->
      <div id="addAdminModal" class="sys-modal" style="display:none"><div class="modal-content">
        <h3>Add New System User</h3>
        <div class="form-grid">
          <input id="newName" placeholder="Full Name" />
          <input id="newId" placeholder="Admin ID (Unique)" />
          <input id="newPhone" placeholder="Phone No" />
          <input id="newPass" placeholder="Temp Password" type="password" />
          <select id="newRole"><option value="DORM">Dorm Admin</option></select>
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
  function escapeHtml(str) { if (str === undefined || str === null) return ''; return String(str).replace(/[&<>"'`=\/]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;','=':'&#61;','/':'&#47;'})[s]); }

  // Expose helpers for debugging
  window.__adminHelpers = {
    fetchUser, hasPermission, refreshPhaseTable, refreshAdminList, renderRoomsTable, loadApplications: window.loadApplications
  };
  // Target the forgot password link
const forgotLink = document.getElementById('forgotPassword');

forgotLink.addEventListener('click', function(e) {
    e.preventDefault(); // prevent default page jump
    const email = prompt("Enter your email to reset password:");
    if (email) {
        alert("A reset link has been sent to: " + email);
        // Here you can call your backend API to actually send the reset email
        // Example: fetch('/api/reset-password', { method: 'POST', body: JSON.stringify({ email }) })
    } else {
        alert("Please enter a valid email.");
    }
});


})();