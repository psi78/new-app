# Backend Setup Guide

This guide explains how to set up and run the backend server for the 5K Dormitory Management System.

## Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Backend Server**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Verify Server is Running**
   The server will start on `http://localhost:3000`
   You should see:
   ```
   🚀 Backend server running on http://localhost:3000
   📁 Database file: [path to db.json]
   📸 Profile pictures: [path to uploads/profiles]
   ```

## API Endpoints

### Student Profile Endpoints

- **GET** `/students/:studentId` - Get student profile by ID
- **GET** `/students` - Get all students
- **POST** `/students` - Create new student profile
- **PATCH** `/students/:studentId` - Update student profile (supports file upload)
- **PUT** `/students/:studentId` - Update student profile (alternative to PATCH)

### Other Endpoints (for compatibility)

- **GET** `/adminRegistry` - Get all admin users
- **POST** `/adminRegistry` - Create new admin
- **GET** `/publicAnnouncements` - Get all announcements
- **POST** `/publicAnnouncements` - Create new announcement
- **GET** `/phases` - Get all phases
- **POST** `/phases` - Create new phase

## File Uploads

Profile pictures are uploaded to the `uploads/profiles/` directory and served at `/uploads/profiles/[filename]`.

## Database

The backend uses a JSON file (`Frontend_implementation/db.json`) as the database. The file is automatically updated when you create or update records.

## Troubleshooting

- **Port 3000 already in use**: Change the PORT in `server.js` to a different port (e.g., 3001)
- **CORS errors**: Make sure the backend is running and the API_URL in your frontend matches the backend URL
- **File upload errors**: Ensure the `uploads/profiles/` directory exists and has write permissions




