const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Mufe22004',
    database: process.env.DB_NAME || 'dormitory_management'
};

async function checkApps() {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [rows] = await conn.execute("SELECT id, application_id, student_id, status FROM applications");
        console.log("Applications:", rows);
        await conn.end();
    } catch (e) {
        console.error(e);
    }
}

checkApps();
