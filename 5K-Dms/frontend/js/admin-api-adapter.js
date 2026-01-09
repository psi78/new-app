// Admin API Adapter - Maps old admin.js API calls to new Express API
// Include this before admin.js in HTML files

const API_BASE = "http://localhost:3000/api";

// Helper to get auth token
function getAdminToken() {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

// Helper to make authenticated calls
async function adminApiCall(endpoint, options = {}) {
    const token = getAdminToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(options.headers || {})
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.success ? data.data : data;
    } catch (error) {
        console.error('Admin API error:', error);
        throw error;
    }
}

// Admin login using Express API
async function adminLogin(adminId, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: adminId, password })
        });

        const result = await response.json();
        
        if (result.success && result.data.token) {
            localStorage.setItem('auth_token', result.data.token);
            sessionStorage.setItem('auth_token', result.data.token);
            sessionStorage.setItem('adminId', result.data.user.id);
            sessionStorage.setItem('adminResourceId', result.data.user.id);
            sessionStorage.setItem('adminRole', result.data.user.role);
            return result.data.user;
        }
        
        throw new Error(result.message || 'Login failed');
    } catch (error) {
        console.error('Admin login error:', error);
        throw error;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.adminApiCall = adminApiCall;
    window.adminLogin = adminLogin;
    window.getAdminToken = getAdminToken;
}

