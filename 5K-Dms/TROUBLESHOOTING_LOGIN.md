# Troubleshooting Login Issues

## Network Error When Logging In

If you're getting a "Network error" when trying to login, check these:

### 1. ✅ Server Must Be Running

**The server MUST be running before you can login!**

Start the server:
```bash
cd backend
npm install  # First time only
npm start
```

You should see:
```
🚀 Server running on http://localhost:3000
📝 API endpoints available at http://localhost:3000/api
✅ Database connected successfully
```

**If you don't see this, the server isn't running!**

### 2. ✅ Database Setup

Make sure:
- MySQL is running
- Database `5kdms_db` exists
- Tables are created (run `backend/config/01-init-db.sql`)
- Admin account exists with proper password hash

### 3. ✅ Admin Credentials

**Default Admin Accounts:**
- **ID:** `admin` OR `sysadmin`
- **Password:** `admin123`

**Important:** The password hash in the database must be correct!

### 4. ✅ Fix Admin Password Hash

If login fails with "Incorrect password", the password hash in database is wrong.

**Option 1: Update SQL file and re-import**
1. Generate proper hash:
   ```bash
   cd backend
   npm install
   node -e "const bcrypt=require('bcryptjs');bcrypt.hash('admin123',10).then(h=>console.log('Hash:',h))"
   ```
2. Copy the hash
3. Update `backend/config/01-init-db.sql` with the hash
4. Re-run the SQL script

**Option 2: Run fix script**
```sql
-- Run this in MySQL:
UPDATE users 
SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy' 
WHERE admin_id IN ('admin', 'sysadmin');
```

### 5. ✅ Check Browser Console

Open browser Developer Tools (F12) and check:
- **Console tab:** Look for JavaScript errors
- **Network tab:** Check if API calls are being made
- Look for CORS errors or 404 errors

### 6. ✅ Verify API URL

Make sure `frontend/pages/admin/admin.js` has:
```javascript
const API_URL = "http://localhost:3000/api";
```

### 7. ✅ Common Issues

**"Network error" = Server not running**
→ Start server with `npm start` in backend folder

**"Account not found" = Wrong admin ID**
→ Use `admin` or `sysadmin` (not case-sensitive)

**"Incorrect password" = Wrong password hash**
→ Update database with proper bcrypt hash

**"Cannot connect to database" = Database issue**
→ Check MySQL is running and `.env` has correct credentials

### 8. ✅ Quick Test

Test if server is running:
```bash
curl http://localhost:3000/health
```

Should return:
```json
{"status":"ok","message":"5K DMS API is running"}
```

If this fails, server isn't running!

### 9. ✅ Step-by-Step Fix

1. **Start MySQL** (make sure it's running)
2. **Create database:**
   ```sql
   CREATE DATABASE 5kdms_db;
   ```
3. **Import schema:**
   ```bash
   mysql -u root -p 5kdms_db < backend/config/01-init-db.sql
   ```
4. **Fix admin password** (run SQL from `backend/fix-admin-password.sql`)
5. **Create .env file** in `backend/` folder
6. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```
7. **Start server:**
   ```bash
   npm start
   ```
8. **Open browser:** http://localhost:3000
9. **Login with:** `sysadmin` / `admin123`

## Still Having Issues?

1. Check server logs in terminal
2. Check browser console (F12)
3. Verify database connection
4. Make sure port 3000 is not in use
5. Check `.env` file exists and has correct values

