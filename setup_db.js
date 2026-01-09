const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
    console.log("-----------------------------------------");
    console.log("   5K-DMS Database Setup Wizard");
    console.log("-----------------------------------------");

    let dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    };

    console.log(`Attempting to connect with User: ${dbConfig.user} on Host: ${dbConfig.host}...`);

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("✅ Connected to MySQL server successfully!");
    } catch (err) {
        console.log("❌ Connection failed with default/env credentials.");
        console.log("   Error: " + err.message);
        console.log("\nPlease enter your MySQL credentials:");

        dbConfig.user = await question('MySQL User (default: root): ') || 'root';
        dbConfig.password = await question('MySQL Password: ');

        try {
            connection = await mysql.createConnection(dbConfig);
            console.log("✅ Connected successfully with new credentials!");

            // Helpful tip to save these
            console.log("\n💡 TIP: Update your .env file with these credentials so the app can connect later.");
            console.log(`   DB_USER=${dbConfig.user}`);
            console.log(`   DB_PASSWORD=${dbConfig.password}\n`);

        } catch (retryErr) {
            console.error("❌ Failed again. Please ensure MySQL is running and credentials are correct.");
            process.exit(1);
        }
    }

    const dbName = process.env.DB_NAME || 'dormitory_management';

    try {
        // Create Database
        console.log(`Creating database '${dbName}' if it doesn't exist...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        await connection.query(`USE \`${dbName}\``);
        console.log("✅ Database selected.");

        // Read schema.sql if it exists, otherwise define tables here or rely on server.js to init
        // server.js has an initDb() function, but it's better to ensure tables exist now.
        // We will try to read server.js to extract schema or use a saved schema file.
        // Assuming the schema is in a file or the user wants to start fresh.
        // For now, let's just ensure the DB exists. The server.js initDb() handles table creation.

        console.log("✅ Database setup complete! You can now run the server.");
        console.log("   Run: npm start");

    } catch (err) {
        console.error("❌ Error during setup:", err);
    } finally {
        if (connection) await connection.end();
        rl.close();
    }
}

setup();
