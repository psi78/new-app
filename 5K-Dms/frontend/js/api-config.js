// Centralized API Configuration
// This file should be included in all HTML pages that need API access

const API_BASE_URL = "http://localhost:3000/api";

// Helper function to get auth token
function getAuthToken() {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

// Helper function to make authenticated API calls
async function apiCall(endpoint, options = {}) {
    const token = getAuthToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...(options.headers || {})
        }
    };

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
        delete defaultOptions.headers['Content-Type'];
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {})
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.API_BASE_URL = API_BASE_URL;
    window.apiCall = apiCall;
    window.getAuthToken = getAuthToken;
}

