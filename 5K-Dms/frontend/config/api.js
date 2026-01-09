// API Configuration
// This file centralizes all API endpoint URLs
const API_BASE_URL = "http://localhost:3000/api"

const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  PROFILE: `${API_BASE_URL}/auth/profile`,

  // Applications
  SUBMIT_APPLICATION: `${API_BASE_URL}/applications/submit-application`,
  MY_APPLICATION: `${API_BASE_URL}/applications/my-application`,
  ALL_APPLICATIONS: `${API_BASE_URL}/applications/applications`,
  UPDATE_APPLICATION: (id) => `${API_BASE_URL}/applications/applications/${id}`,

  // Admin
  ADMINS: `${API_BASE_URL}/admin/admins`,
  DELETE_ADMIN: (id) => `${API_BASE_URL}/admin/admins/${id}`,

  // Rooms
  ROOMS: `${API_BASE_URL}/rooms/rooms`,
  ROOM: (id) => `${API_BASE_URL}/rooms/rooms/${id}`,

  // Phases
  PHASES: `${API_BASE_URL}/phases/phases`,
  PHASE: (id) => `${API_BASE_URL}/phases/phases/${id}`,

  // Allocations
  ALLOCATIONS: `${API_BASE_URL}/allocations/allocations`,
  ALLOCATE: `${API_BASE_URL}/allocations/allocate`,
  MY_ALLOCATION: `${API_BASE_URL}/allocations/my-allocation`,

  // Notifications
  NOTIFICATIONS: `${API_BASE_URL}/notifications/announcements`,
  PUBLIC_ANNOUNCEMENTS: "http://localhost:3000/api/publicAnnouncements",
}

// Helper function to make authenticated API calls
async function apiCall(url, options = {}) {
  const token = localStorage.getItem("auth_token")
  
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  }

  const response = await fetch(url, { ...defaultOptions, ...options })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }))
    throw new Error(error.message || "Request failed")
  }
  
  return response.json()
}

// Export for use in HTML files
if (typeof window !== "undefined") {
  window.API_ENDPOINTS = API_ENDPOINTS
  window.apiCall = apiCall
}
