# 5K Dormitory Management System

A full-stack web application for managing dormitory applications, allocations, and administration at Addis Ababa University's 5K Campus.

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla JS)
- **Backend**: Node.js with Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)

## Project Structure

```
5K-DMS/
├── backend/                 # Express.js API Server
│   ├── config/             # Database configuration
│   │   ├── database.js     # MySQL connection pool
│   │   └── 01-init-db.sql  # Database schema
│   ├── controllers/       # Request handlers
│   ├── middleware/         # Auth & upload middleware
│   ├── routes/             # API route definitions
│   ├── utils/              # Helper functions
│   ├── uploads/            # Uploaded documents
│   └── server.js           # Express server entry point
│
├── frontend/               # Static HTML/CSS/JS files
│   ├── pages/              # HTML pages
│   │   ├── admin/          # Admin pages
│   │   ├── student/        # Student pages
│   │   └── css/            # Stylesheets
│   ├── config/             # Frontend configuration
│   │   └── api.js          # API endpoint definitions
│   ├── icons/              # Images and icons
│   └── index.html          # Landing page
│
└── README.md
```

## Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or pnpm

## Setup Instructions

### 1. Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE 5kdms_db;
```

2. Run the initialization script:
```bash
mysql -u root -p 5kdms_db < backend/config/01-init-db.sql
```

Or import it through MySQL Workbench/phpMyAdmin.

### 2. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `backend` directory:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=5kdms_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=development
```

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### 3. Frontend Setup

The frontend is served statically by the Express server. Once the backend is running, you can access:

- Landing page: `http://localhost:3000`
- Student login: `http://localhost:3000/pages/student/student-login.html`
- Admin login: `http://localhost:3000/pages/admin/admin-login.html`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)

### Applications
- `POST /api/applications/submit-application` - Submit dorm application (student)
- `GET /api/applications/my-application` - Get student's application
- `GET /api/applications/applications` - Get all applications (admin)
- `PATCH /api/applications/applications/:id` - Update application status (admin)

### Admin
- `GET /api/admin/admins` - Get all admins
- `POST /api/admin/admins` - Add new admin
- `DELETE /api/admin/admins/:id` - Delete admin

### Rooms
- `GET /api/rooms/rooms` - Get all rooms
- `POST /api/rooms/rooms` - Add new room
- `PATCH /api/rooms/rooms/:id` - Update room
- `DELETE /api/rooms/rooms/:id` - Delete room

### Phases
- `GET /api/phases/phases` - Get all phases
- `POST /api/phases/phases` - Create new phase
- `PATCH /api/phases/phases/:id` - Update phase status

### Allocations
- `POST /api/allocations/allocate` - Run allocation process
- `GET /api/allocations/allocations` - Get all allocations
- `GET /api/allocations/my-allocation` - Get student's allocation

### Notifications
- `GET /api/publicAnnouncements` - Get public announcements (no auth)
- `GET /api/notifications/announcements` - Get user announcements
- `POST /api/notifications/publicAnnouncements` - Create announcement (admin)

## Default Credentials

After running the database initialization script, you can use:

**System Admin:**
- ID: `admin`
- Password: `admin123` (change this in production!)

## Features

### Student Features
- User registration and login
- Dormitory application submission
- Document upload (Kebele ID, support letter, medical documents)
- Application status tracking
- View dormitory allocation

### Admin Features
- Application verification
- Document review
- Dormitory room management
- Allocation management
- Phase management (rural/Addis Ababa)
- Announcement creation
- Admin user management

## Development

### File Uploads
Uploaded documents are stored in `backend/uploads/documents/`. Make sure this directory exists and has write permissions.

### Database Migrations
The database schema is defined in `backend/config/01-init-db.sql`. To modify the schema, update this file and re-run it.

### API Testing
You can test the API using tools like Postman or curl:

```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"id":"student123","password":"password123"}'
```

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database `5kdms_db` exists

### Port Already in Use
- Change `PORT` in `.env` file
- Or stop the process using port 3000

### File Upload Issues
- Ensure `backend/uploads/` directory exists
- Check file permissions
- Verify file size limits (default: 5MB)

## License

This project is for educational purposes.

## Support

For issues or questions, please contact the development team.

