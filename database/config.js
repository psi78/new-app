// MySQL Database Configuration
const mysql = require("mysql2/promise");
require("dotenv").config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Mufe22004",
  database: process.env.DB_NAME || "dormitory_management",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL Database connected successfully");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("👉 TIP: Check your .env file. Make sure DB_USER and DB_PASSWORD are correct.");
    }
    return false;
  }
}

// Execute query helper
async function query(sql, params = []) {
  try {
    const [results] = await pool.query(sql, params);
    return results;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// Get connection from pool
async function getConnection() {
  return await pool.getConnection();
}

module.exports = {
  pool,
  query,
  getConnection,
  testConnection,
  dbConfig,
};
