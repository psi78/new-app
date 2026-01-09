# Quick Setup Guide

## Step 1: Database Setup

1. Open MySQL command line or MySQL Workbench
2. Create the database:
   ```sql
   CREATE DATABASE 5kdms_db;
   ```
3. Import the schema:
   ```bash
   mysql -u root -p 5kdms_db < backend/config/01-init-db.sql
   ```
   Or copy and paste the SQL from `backend/config/01-init-db.sql` into MySQL Workbench and execute it.

## Step 2: Backend Configuration

1. Navigate to backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (copy from `.env.example` if it exists, or create new):
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=5kdms_db
   JWT_SECRET=change-this-to-a-random-secret-key
   JWT_EXPIRES_IN=24h
   PORT=3000
   NODE_ENV=development
   ```

4. Start the server:
   ```bash
   npm start
   ```

   You should see:
   ```
   🚀 Server running on http://localhost:3000
   📝 API endpoints available at http://localhost:3000/api
   ✅ Database connected successfully
   ```

## Step 3: Access the Application

1. Open your browser and go to: `http://localhost:3000`
2. You'll see the landing page with login options

## Step 4: Test Login

### Default Admin Account
- **ID**: `admin`
- **Password**: `admin123`

### Create a Student Account
1. Go to: `http://localhost:3000/pages/student/student-register.html`
2. Fill in the registration form
3. Login with your student ID and password

## Troubleshooting

### Database Connection Error
- Make sure MySQL is running
- Verify database credentials in `.env`
- Check that database `5kdms_db` exists

### Port 3000 Already in Use
- Change `PORT` in `.env` to a different number (e.g., 3001)
- Or stop the process using port 3000

### Module Not Found Errors
- Run `npm install` again in the `backend` folder
- Make sure you're using Node.js v18 or higher

### Frontend Not Loading
- Make sure the backend server is running
- Check that files are in `frontend/` folder
- Verify the server is serving static files (check `server.js`)

## Development Mode

For auto-reload during development:
```bash
npm run dev
```

This will restart the server automatically when you make changes to backend files.

## Next Steps

- Review the API endpoints in `README.md`
- Check `PROJECT_STRUCTURE.md` for file organization
- Customize the frontend pages as needed
- Update database schema if required

