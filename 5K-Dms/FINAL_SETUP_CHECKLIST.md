# ✅ Final Setup Checklist

## Before Running the Server

### 1. Database Setup ✅
- [ ] MySQL is installed and running
- [ ] Database `5kdms_db` is created
- [ ] Schema imported from `backend/config/01-init-db.sql`
- [ ] Default admin account exists (ID: `admin`, Password: `admin123`)

### 2. Backend Configuration ✅
- [ ] `backend/.env` file created with:
  ```env
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=your_password
  DB_NAME=5kdms_db
  JWT_SECRET=your-secret-key
  JWT_EXPIRES_IN=24h
  PORT=3000
  ```
- [ ] Dependencies installed: `cd backend && npm install`

### 3. Frontend Files ✅
- [ ] All files in `frontend/` folder
- [ ] `frontend/index.html` exists (landing page)
- [ ] `frontend/pages/` contains all HTML pages
- [ ] `frontend/pages/css/` contains stylesheets
- [ ] `frontend/icons/` contains images

### 4. File Structure ✅
```
5K-DMS/
├── backend/
│   ├── .env (create this!)
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── routes/
│   └── ...
├── frontend/
│   ├── index.html
│   ├── pages/
│   └── icons/
└── start-server.bat (Windows) or start-server.sh (Mac/Linux)
```

## Starting the Server

### Option 1: Use Startup Script
- **Windows**: Double-click `start-server.bat`
- **Mac/Linux**: Run `./start-server.sh`

### Option 2: Manual Start
```bash
cd backend
npm install  # First time only
npm start
```

## Access the Website

1. Open browser: **http://localhost:3000**
2. You should see the landing page
3. Click "Student Login" or "Admin Login"

## Testing

### Test Admin Login
- Go to: http://localhost:3000/pages/admin/admin-login.html
- ID: `admin`
- Password: `admin123`

### Test Student Registration
- Go to: http://localhost:3000/pages/student/student-register.html
- Fill form and register
- Then login with your student ID

## Common Issues

### ❌ "Cannot connect to database"
**Fix:**
- Check MySQL is running
- Verify `.env` file has correct DB credentials
- Ensure database `5kdms_db` exists

### ❌ "Port 3000 already in use"
**Fix:**
- Change `PORT=3001` in `backend/.env`
- Or stop the process using port 3000

### ❌ "Module not found"
**Fix:**
```bash
cd backend
npm install
```

### ❌ "404 Not Found" for pages
**Fix:**
- Make sure all files are in `frontend/` folder
- Check server is running
- Verify file paths in HTML files

## What Works

✅ Landing page at http://localhost:3000
✅ Student registration and login
✅ Admin login and dashboard
✅ Dormitory application submission
✅ Document upload
✅ Room management
✅ Application verification
✅ Phase management
✅ Announcements

## Next Steps

1. ✅ Start server
2. ✅ Open http://localhost:3000
3. ✅ Test login functionality
4. ✅ Create test student account
5. ✅ Test admin features

**Your full-stack website is ready! 🎉**

