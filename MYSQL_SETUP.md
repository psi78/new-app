# MySQL Database Setup Guide

This guide will help you set up MySQL database for the 5K Dormitory Management System.

## Prerequisites

1. **Install MySQL Server**
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Or use XAMPP/WAMP which includes MySQL
   - Make sure MySQL service is running

2. **Install Node.js Dependencies**
   ```bash
   npm install
   ```

## Setup Steps

### 1. Create Database and Tables

**Option A: Using MySQL Command Line**
```bash
mysql -u root -p < database/schema.sql
```

**Option B: Using MySQL Workbench or phpMyAdmin**
1. Open MySQL Workbench or phpMyAdmin
2. Create a new database named `dormitory_management`
3. Open and execute the SQL file: `database/schema.sql`

### 2. Configure Database Connection

Create a `.env` file in the root directory:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=dormitory_management
```

**Note:** If you don't have a password, leave `DB_PASSWORD` empty:
```env
DB_PASSWORD=
```

### 3. Start the Server

```bash
npm start
```

You should see:
```
🚀 Backend server running on http://localhost:3000
✅ MySQL Database connected successfully
```

## Database Schema

The database includes the following tables:

1. **students** - Student profile information
2. **student_accounts** - Student login credentials
3. **applications** - Dorm applications with documents
4. **admin_registry** - Admin accounts
5. **public_announcements** - Public announcements
6. **phases** - Application phases

## Default Test Account

After running the schema, you'll have a default test account:
- **Student ID:** STU_001
- **Password:** password123

## Troubleshooting

### Connection Error
- Make sure MySQL service is running
- Check your `.env` file has correct credentials
- Verify database `dormitory_management` exists

### Port Already in Use
- Change PORT in `server.js` if 3000 is already in use

### Table Already Exists
- Drop the database and recreate it:
  ```sql
  DROP DATABASE IF EXISTS dormitory_management;
  CREATE DATABASE dormitory_management;
  USE dormitory_management;
  ```
  Then run the schema again.

## Migration from JSON

If you have existing data in `db.json`, you can manually migrate it or start fresh with the MySQL database. The schema includes a default test account for immediate testing.




