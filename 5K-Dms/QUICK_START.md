# Quick Start Guide

## 🚀 Get Your Website Running in 3 Steps

### Step 1: Setup Database

1. Open MySQL (command line or Workbench)
2. Run these commands:
   ```sql
   CREATE DATABASE 5kdms_db;
   ```
3. Import the schema:
   ```bash
   mysql -u root -p 5kdms_db < backend/config/01-init-db.sql
   ```
   Or copy/paste the SQL from `backend/config/01-init-db.sql` into MySQL Workbench.

### Step 2: Configure Backend

1. Go to `backend` folder
2. Create `.env` file:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=5kdms_db
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRES_IN=24h
   PORT=3000
   ```

### Step 3: Start Server

**Windows:**
- Double-click `start-server.bat`

**Mac/Linux:**
```bash
chmod +x start-server.sh
./start-server.sh
```

**Or manually:**
```bash
cd backend
npm install
npm start
```

### ✅ Access Your Website

Open your browser and go to:
**http://localhost:3000**

You'll see the landing page!

### 🔑 Default Login

**System Admin:**
- ID: `admin`
- Password: `admin123`

### 📁 File Structure

- **Frontend files**: `frontend/` folder (HTML, CSS, JS)
- **Backend server**: `backend/` folder (Express API)
- **Database**: MySQL `5kdms_db`

### ⚠️ Troubleshooting

**"Cannot connect to database"**
- Check MySQL is running
- Verify `.env` file has correct credentials
- Make sure database `5kdms_db` exists

**"Port 3000 already in use"**
- Change `PORT=3001` in `.env` file
- Or stop the process using port 3000

**"Module not found"**
- Run `npm install` in `backend` folder

### 🎯 What You Get

- ✅ Full-stack website (HTML/CSS/JS + Express/MySQL)
- ✅ Student registration and login
- ✅ Admin dashboard
- ✅ Dormitory application system
- ✅ Document upload
- ✅ Room management
- ✅ Allocation system

**Everything works when you open http://localhost:3000!**

