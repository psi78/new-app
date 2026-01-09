HOW TO RUN 5K-DMS
=======================

Prerequisites:
1. Node.js installed (https://nodejs.org/)
2. MySQL Server installed and running

Step-by-Step Setup:
-------------------
1.  Run the "setup_project.bat" file. 
    - This will install necessary helper files (node_modules).
    - It will copy configuration files.
    - It will help you set up the database.

2.  If the setup asks for credentials, enter your MySQL root password.
    - If you don't have a password, just press Enter.

3.  Once setup is complete, you can start the server anytime by:
    - Opening a terminal in this folder.
    - Running: npm start

 Troubleshooting:
----------------
- If you see "Database connection error", open the ".env" file in a text editor (Notepad).
  Check that DB_PASS and DB_USER match your MySQL installation.
- If the browser doesn't open or shows an error, make sure you go to:
  http://localhost:3000 (or the port shown in the terminal).

Enjoy!
