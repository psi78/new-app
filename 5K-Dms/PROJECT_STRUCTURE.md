# Project Structure

This document describes the organization of the 5K Dormitory Management System.

## Directory Structure

```
5K-DMS/
│
├── backend/                          # Express.js Backend API
│   ├── config/                      # Configuration files
│   │   ├── database.js              # MySQL connection pool
│   │   └── 01-init-db.sql           # Database schema & initial data
│   │
│   ├── controllers/                 # Business logic handlers
│   │   ├── admin-controller.js      # Admin management
│   │   ├── allocation-controller.js # Dorm allocation logic
│   │   ├── application-controller.js # Application handling
│   │   ├── auth-controller.js       # Authentication logic
│   │   ├── notification-controller.js # Announcements
│   │   ├── phase-controller.js      # Application phases
│   │   └── room-controller.js       # Room management
│   │
│   ├── middleware/                   # Express middleware
│   │   ├── auth.js                  # JWT authentication & authorization
│   │   └── upload.js                # File upload handling (Multer)
│   │
│   ├── routes/                      # API route definitions
│   │   ├── admin.js                 # Admin routes
│   │   ├── allocations.js           # Allocation routes
│   │   ├── applications.js          # Application routes
│   │   ├── auth.js                  # Authentication routes
│   │   ├── notifications.js         # Notification routes
│   │   ├── phases.js                # Phase routes
│   │   └── rooms.js                 # Room routes
│   │
│   ├── utils/                       # Utility functions
│   │   ├── response.js              # Standardized API responses
│   │   └── validators.js            # Input validation helpers
│   │
│   ├── uploads/                     # Uploaded files directory
│   │   └── documents/               # Student documents (Kebele ID, etc.)
│   │
│   ├── .env.example                 # Environment variables template
│   ├── .gitignore                   # Git ignore rules
│   ├── package.json                 # Backend dependencies
│   └── server.js                    # Express server entry point
│
├── frontend/                        # Static Frontend (HTML/CSS/JS)
│   ├── pages/                       # HTML pages
│   │   ├── admin/                   # Admin interface pages
│   │   │   ├── admin-home.html      # Admin dashboard
│   │   │   ├── admin-login.html     # Admin login page
│   │   │   ├── admin.js             # Admin JavaScript logic
│   │   │   ├── application-overview.html # Application management
│   │   │   ├── document-verification.html # Document review
│   │   │   ├── dorm-allocation.html # Allocation management
│   │   │   ├── dorm-rooms.html      # Room management
│   │   │   └── system-admin.html    # System admin panel
│   │   │
│   │   ├── student/                 # Student interface pages
│   │   │   ├── application-status.html # Application tracking
│   │   │   ├── auth.js              # Authentication utilities
│   │   │   ├── dorm-application.html # Application form
│   │   │   ├── navigation-guard.js  # Route protection
│   │   │   ├── profile.html         # Student profile
│   │   │   ├── profile.js           # Profile JavaScript
│   │   │   ├── session-monitor.js   # Session management
│   │   │   ├── student-login.html   # Student login
│   │   │   ├── student-login.js     # Login logic
│   │   │   └── student-register.html # Registration form
│   │   │
│   │   └── css/                     # Stylesheets
│   │       ├── main.css             # Main styles
│   │       └── style.css            # Additional styles
│   │
│   ├── config/                      # Frontend configuration
│   │   └── api.js                   # API endpoint definitions
│   │
│   ├── icons/                       # Images and icons
│   │   ├── AAU_logo.png             # University logo
│   │   └── aau-image.png            # University image
│   │
│   └── index.html                   # Landing page
│
├── .gitignore                       # Root git ignore
├── README.md                        # Main documentation
└── PROJECT_STRUCTURE.md             # This file
```

## File Descriptions

### Backend Files

#### `server.js`
Main Express server file. Sets up middleware, routes, and starts the HTTP server. Also serves static frontend files.

#### `config/database.js`
MySQL connection pool configuration. Uses environment variables for database credentials.

#### `config/01-init-db.sql`
SQL script to create database schema, tables, and initial admin user.

#### Controllers
Each controller handles business logic for a specific domain:
- **auth-controller.js**: User registration, login, profile management
- **application-controller.js**: Application submission, status updates, retrieval
- **admin-controller.js**: Admin user CRUD operations
- **room-controller.js**: Room management (create, read, update, delete)
- **phase-controller.js**: Application phase management
- **allocation-controller.js**: Dormitory allocation logic
- **notification-controller.js**: Announcement creation and retrieval

#### Middleware
- **auth.js**: JWT token verification and role-based authorization
- **upload.js**: Multer configuration for file uploads (documents)

#### Routes
Route files define API endpoints and connect them to controllers with appropriate middleware.

### Frontend Files

#### `index.html`
Landing page with login options for students and admins. Displays public announcements.

#### Student Pages
- **student-login.html/js**: Student authentication
- **student-register.html**: New student registration
- **profile.html/js**: Student profile and dashboard
- **dorm-application.html**: Application submission form
- **application-status.html**: Track application status

#### Admin Pages
- **admin-login.html**: Admin authentication
- **admin-home.html**: Admin dashboard
- **application-overview.html**: View all applications
- **document-verification.html**: Review and verify documents
- **dorm-rooms.html**: Manage dormitory rooms
- **dorm-allocation.html**: Allocate students to rooms
- **system-admin.html**: System administration panel

#### `config/api.js`
Centralized API endpoint configuration. Provides helper functions for making authenticated API calls.

## Data Flow

1. **User Request** → Frontend HTML/JS
2. **API Call** → Express Server (server.js)
3. **Authentication** → Middleware (auth.js)
4. **Route Handler** → Routes (routes/*.js)
5. **Business Logic** → Controllers (controllers/*.js)
6. **Data Access** → Database (MySQL via database.js)
7. **Response** → Frontend (JSON)

## Environment Variables

Backend requires `.env` file with:
- `DB_HOST`: MySQL host (default: localhost)
- `DB_USER`: MySQL username
- `DB_PASSWORD`: MySQL password
- `DB_NAME`: Database name (default: 5kdms_db)
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_EXPIRES_IN`: Token expiration (default: 24h)
- `PORT`: Server port (default: 3000)

## API Endpoint Pattern

All API endpoints follow the pattern:
```
/api/{resource}/{action}
```

Example:
- `POST /api/auth/login`
- `GET /api/applications/applications`
- `PATCH /api/applications/applications/:id`

## Authentication

- JWT tokens stored in `localStorage` as `auth_token`
- Tokens included in `Authorization: Bearer {token}` header
- Protected routes require valid token and appropriate role

## File Uploads

- Documents uploaded via Multer middleware
- Stored in `backend/uploads/documents/`
- Supported formats: JPEG, PNG, PDF
- Max file size: 5MB

