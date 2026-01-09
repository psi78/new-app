# Quick Fix for Login Network Error

## The Problem
You're getting "Network error" when trying to login with `sysadmin`/`admin123`.

## Most Common Cause: Server Not Running! ⚠️

**The server MUST be running before you can login!**

## Quick Fix Steps:

### Step 1: Start the Server
```bash
cd backend
npm install    # First time only
npm start
```

**You MUST see this output:**
```
🚀 Server running on http://localhost:3000
📝 API endpoints available at http://localhost:3000/api
✅ Database connected successfully
```

**If you don't see this, the server isn't running and login won't work!**

### Step 2: Verify Server is Running
Open browser and go to: **http://localhost:3000/health**

Should show:
```json
{"status":"ok","message":"5K DMS API is running"}
```

### Step 3: Fix Database Password (if needed)

If you get "Incorrect password", run this SQL:

```sql
USE 5kdms_db;

-- Update admin passwords
UPDATE users 
SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy' 
WHERE admin_id IN ('admin', 'sysadmin');

-- Or create if they don't exist
INSERT INTO users (admin_id, full_name, password, gender, role) 
VALUES 
  ('admin', 'System Administrator', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'male', 'system_admin'),
  ('sysadmin', 'System Administrator', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'male', 'system_admin')
ON DUPLICATE KEY UPDATE password = VALUES(password);
```

### Step 4: Try Login Again

1. Make sure server is running (Step 1)
2. Go to: http://localhost:3000/pages/admin/admin-login.html
3. Login with:
   - **ID:** `sysadmin` (or `admin`)
   - **Password:** `admin123`

## Still Getting Network Error?

1. **Check server terminal** - Look for error messages
2. **Check browser console** (F12) - Look for CORS or connection errors
3. **Verify .env file exists** in `backend/` folder with database credentials
4. **Check MySQL is running**
5. **Try different browser** or clear cache

## Error Messages Explained

- **"Network error"** = Server not running or can't connect
- **"Account not found"** = Wrong admin ID (use `admin` or `sysadmin`)
- **"Incorrect password"** = Wrong password hash in database (run SQL above)
- **"Server error (500)"** = Database connection issue (check .env file)

## The Fix I Made

I've updated the error handling to show better messages. Now you'll see:
- "Server error: Make sure the server is running on http://localhost:3000"
- Instead of just "Network error"

This will help you identify the problem faster!

