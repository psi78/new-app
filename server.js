const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const { query, testConnection } = require("./database/config");

const app = express();
const PORT = process.env.PORT || 3000;

// Debug logging to file since we can't see the console
async function logToFile(msg) {
  try {
    const timestamp = new Date().toISOString();
    await fs.appendFile(path.join(__dirname, "server_debug.log"), `[${timestamp}] ${msg}\n`);
  } catch (e) { }
}

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug logging middleware
app.use((req, res, next) => {
  const log = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
  console.log(log.trim());
  require('fs').appendFile(path.join(__dirname, 'server_debug.log'), log, (err) => {
    if (err) console.error('Log error:', err);
  });
  next();
});

app.post("/api/adminLogin", async (req, res) => {
  try {
    const { admin_id, password } = req.body;
    if (!admin_id || !password) return res.status(400).json({ success: false, message: "Required" });
    const [admin] = await query("SELECT * FROM admin_registry WHERE admin_id = ?", [admin_id]);
    if (!admin) return res.status(401).json({ success: false, message: "Invalid" });
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid" });

    const perms = typeof admin.perms === 'string' ? JSON.parse(admin.perms) : (admin.perms || []);

    res.json({
      success: true,
      token: "test_token_" + Date.now(),
      adminData: {
        adminId: admin.admin_id,
        role: admin.role,
        name: admin.name,
        perms: perms
      }
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Configure multer for file uploads (profile pictures)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads", "profiles");
    fs.mkdir(uploadDir, { recursive: true })
      .then(() => {
        cb(null, uploadDir);
      })
      .catch((err) => cb(err));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "profile-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only JPEG and PNG images are allowed"));
    }
  },
});

// Configure multer for document uploads (applications)
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads", "documents");
    fs.mkdir(uploadDir, { recursive: true })
      .then(() => {
        cb(null, uploadDir);
      })
      .catch((err) => cb(err));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "doc-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and PDF files are allowed"));
    }
  },
});

// Debug logging middleware
app.use((req, res, next) => {
  const log = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
  console.log(log.trim());
  require('fs').appendFile(path.join(__dirname, 'server_debug.log'), log, (err) => {
    if (err) console.error('Log error:', err);
  });
  next();
});

// Serve static files (profile images and documents)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==================== ADMINISTRATIVE API (Standardized) ====================

// Admin Registry
app.get("/api/adminRegistry", async (req, res) => {
  try {
    const admins = await query("SELECT * FROM admin_registry");
    res.json(admins.map(a => ({
      id: a.id, adminId: a.admin_id, name: a.name, role: a.role, phone: a.phone,
      perms: typeof a.perms === 'string' ? JSON.parse(a.perms) : (a.perms || [])
    })));
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

app.get("/api/adminRegistry/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const isNum = /^\d+$/.test(id);
    const sql = isNum ? "SELECT * FROM admin_registry WHERE id = ? OR admin_id = ?" : "SELECT * FROM admin_registry WHERE admin_id = ?";
    const p = isNum ? [id, id] : [id];
    const [admin] = await query(sql, p);
    if (!admin) return res.status(404).json({ error: "Admin not found" });
    res.json({
      id: admin.id, adminId: admin.admin_id, name: admin.name, role: admin.role, phone: admin.phone,
      perms: typeof admin.perms === 'string' ? JSON.parse(admin.perms) : (admin.perms || [])
    });
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/adminRegistry", async (req, res) => {
  try {
    const { adminId, password, name, phone, role, perms } = req.body;
    const hashedPassword = await bcrypt.hash(password || "admin123", 10);
    const pStr = JSON.stringify(perms || []);
    await query("INSERT INTO admin_registry (admin_id, password, name, phone, role, perms) VALUES (?,?,?,?,?,?)", [adminId, hashedPassword, name, phone, role || 'Admin', pStr]);
    res.status(201).json({ success: true, message: "Admin created" });
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

app.patch("/api/adminRegistry/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, role, perms, password } = req.body;
    const isNum = /^\d+$/.test(id);
    const lookupSql = isNum ? "SELECT id FROM admin_registry WHERE id = ? OR admin_id = ?" : "SELECT id FROM admin_registry WHERE admin_id = ?";
    const lookupParams = isNum ? [id, id] : [id];
    const [admin] = await query(lookupSql, lookupParams);
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    const updates = [];
    const values = [];
    if (name) { updates.push("name = ?"); values.push(name); }
    if (phone) { updates.push("phone = ?"); values.push(phone); }
    if (role) { updates.push("role = ?"); values.push(role); }
    if (perms) { updates.push("perms = ?"); values.push(JSON.stringify(perms)); }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push("password = ?");
      values.push(hashedPassword);
    }
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });
    values.push(admin.id);
    await query(`UPDATE admin_registry SET ${updates.join(", ")} WHERE id = ?`, values);
    res.json({ success: true, message: "Admin updated" });
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

app.delete("/api/adminRegistry/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const isNum = /^\d+$/.test(id);
    const sql = isNum ? "DELETE FROM admin_registry WHERE id = ? OR admin_id = ?" : "DELETE FROM admin_registry WHERE admin_id = ?";
    const p = isNum ? [id, id] : [id];
    await query(sql, p);
    res.json({ success: true, message: "Admin deleted" });
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

// Phases
app.get("/api/phases", async (req, res) => {
  try {
    const phases = await query("SELECT * FROM phases ORDER BY created_at DESC");
    res.json(phases.map(p => ({
      id: p.id, type: p.type, start: p.start_date, end: p.end_date, status: p.status, createdAt: p.created_at
    })));
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/phases", async (req, res) => {
  try {
    const { type, start, end, status } = req.body;
    await query("INSERT INTO phases (type, start_date, end_date, status) VALUES (?,?,?,?)", [type, start, end, status || "Inactive"]);
    const [np] = await query("SELECT * FROM phases ORDER BY id DESC LIMIT 1");
    res.status(201).json({ id: np.id, type: np.type, start: np.start_date, end: np.end_date, status: np.status });
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

app.patch("/api/phases/:id", async (req, res) => {
  try {
    const { status } = req.body;
    await query("UPDATE phases SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

app.delete("/api/phases/:id", async (req, res) => {
  try {
    await query("DELETE FROM phases WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

// Announcements
app.get("/api/announcement/latest", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM announcements WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1");
    if (rows.length === 0) return res.json(null);
    res.json(rows[0]); // Returns object with .message
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/announcement", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });
    await query("INSERT INTO announcements (message) VALUES (?)", [message]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

app.get("/api/publicAnnouncements", async (req, res) => {
  try {
    const ann = await query("SELECT * FROM announcements WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 10");
    res.json(ann.map(a => ({ id: a.id, text: a.message, message: a.message, date: a.created_at, type: 'Announcement' })));
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/publicAnnouncements", async (req, res) => {
  try {
    const { text, message } = req.body;
    const finalMsg = message || text;
    await query("INSERT INTO announcements (message) VALUES (?)", [finalMsg]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

// Applications (Administrative) routes will be handled near line 1083 with consistent /api prefix

// --------------------------------------------------------------------------

app.use(express.static(__dirname));

// Initialize Database Tables
async function initDb() {
  try {
    // Users Table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'admin') DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Students Table
    await query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(20) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        gender ENUM('Male', 'Female') NOT NULL,
        department VARCHAR(100),
        academic_year INT,
        phone VARCHAR(20),
        residence_category VARCHAR(50),
        profile_picture VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Applications Table
    await query(`
      CREATE TABLE IF NOT EXISTS applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        application_id VARCHAR(50) UNIQUE NOT NULL,
        student_id VARCHAR(20) NOT NULL,
        full_name VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        residency_category VARCHAR(50),
        subcity VARCHAR(50),
        woreda VARCHAR(50),
        kebele_id_doc VARCHAR(255),
        support_letter_doc VARCHAR(255),
        medical_doc VARCHAR(255),
        special_needs BOOLEAN DEFAULT FALSE,
        status ENUM('Pending', 'Verified', 'Approved', 'Rejected') DEFAULT 'Pending',
        doc_status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
        admin_remark TEXT,
        dorm_allocation JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
      )
    `);

    // Dorm Rooms Table
    await query(`
      CREATE TABLE IF NOT EXISTS dorm_rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        block_name VARCHAR(50) NOT NULL,
        room_number VARCHAR(20) NOT NULL,
        capacity INT DEFAULT 4,
        current_occupancy INT DEFAULT 0,
        gender ENUM('Male', 'Female') NOT NULL,
        status ENUM('Active', 'Maintenance', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Phases Table
    await query(`
      CREATE TABLE IF NOT EXISTS phases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        start_date DATE,
        end_date DATE,
        status ENUM('Active', 'Inactive', 'Upcoming') DEFAULT 'Inactive',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Admin Registry Table
    await query(`
      CREATE TABLE IF NOT EXISTS admin_registry (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        phone VARCHAR(20),
        role ENUM('Admin','System Admin','App Admin','Doc Admin','Room Admin','Alloc Admin') DEFAULT 'Admin',
        perms JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Announcements Table
    await query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Database initialized successfully");

    // Auto-seed default admin if empty
    const adminCheck = await query("SELECT id FROM admin_registry LIMIT 1");
    if (adminCheck.length === 0) {
      const hash = await bcrypt.hash("admin123", 10);
      await query("INSERT INTO admin_registry (admin_id, password, name, phone, role, perms) VALUES (?, ?, ?, ?, ?, ?)",
        ["sysadmin", hash, "System Admin", "0911000000", "System Admin", JSON.stringify(["HOME", "SYS_ADMIN"])]);
      console.log("✅ Default 'sysadmin' account created.");
    }
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error; // RETHROW SO FIXCLOUD CATCHES IT
  }
}

// Run DB Init
// Run DB Init (catch error so server doesn't crash on startup)
initDb().catch(err => console.log("Initial DB Init failed, waiting for manual fixCloud trigger."));

// --- RESCUE ROUTE FOR CLOUD ---
app.get("/api/fixCloud", async (req, res) => {
  try {
    console.log("Manual fix triggered...");
    await initDb();

    // Force update sysadmin permissions to include SYS_ADMIN
    await query(`UPDATE admin_registry SET perms = ? WHERE admin_id = 'sysadmin'`,
      [JSON.stringify(["HOME", "SYS_ADMIN"])]);

    // Check if sysadmin exists now
    const users = await query("SELECT * FROM admin_registry");
    res.json({
      success: true,
      message: "Database initialization attempted.",
      adminCount: users ? users.length : 0,
      admins: users ? users.map(u => u.admin_id) : []
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e.message || "Unknown Error",
      code: e.code || "No Code",
      details: {
        host: process.env.DB_HOST ? "Set" : "Missing",
        user: process.env.DB_USER ? "Set" : "Missing",
        pass: process.env.DB_PASSWORD ? "Set" : "Missing",
        db: process.env.DB_NAME ? "Set" : "Missing",
        port: process.env.PORT ? process.env.PORT : "Missing"
      },
      tip: "Check the 'details' above. If any say 'Missing', you forgot to add them in Railway Variables."
    });
  }
});



app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ==================== STUDENT PROFILE ENDPOINTS ====================

// GET student profile by studentId
app.get("/students/:studentId", async (req, res) => {
  try {
    const students = await query(
      "SELECT * FROM students WHERE student_id = ?",
      [req.params.studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const student = students[0];
    res.json({
      id: student.id,
      studentId: student.student_id,
      fullName: student.full_name,
      gender: student.gender,
      department: student.department,
      academicYear: student.academic_year,
      phone: student.phone,
      residenceCategory: student.residence_category,
      profilePicture: student.profile_picture,
      createdAt: student.created_at,
      updatedAt: student.updated_at,
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET all students
app.get("/students", async (req, res) => {
  try {
    const students = await query(
      "SELECT * FROM students ORDER BY created_at DESC"
    );
    res.json(
      students.map((s) => ({
        id: s.id,
        studentId: s.student_id,
        fullName: s.full_name,
        gender: s.gender,
        department: s.department,
        academicYear: s.academic_year,
        phone: s.phone,
        residenceCategory: s.residence_category,
        profilePicture: s.profile_picture,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      }))
    );
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST create new student profile
app.post("/students", async (req, res) => {
  try {
    const {
      studentId,
      fullName,
      gender,
      department,
      academicYear,
      phone,
      residenceCategory,
    } = req.body;

    // Check if student already exists
    const [existing] = await query(
      "SELECT id FROM students WHERE student_id = ?",
      [studentId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Student already exists" });
    }

    await query(
      `INSERT INTO students (student_id, full_name, gender, department, academic_year, phone, residence_category) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        fullName,
        gender,
        department,
        academicYear,
        phone || null,
        residenceCategory || null,
      ]
    );

    const newStudent = await query(
      "SELECT * FROM students WHERE student_id = ?",
      [studentId]
    );

    res.status(201).json({
      id: newStudent[0].id,
      studentId: newStudent[0].student_id,
      fullName: newStudent[0].full_name,
      gender: newStudent[0].gender,
      department: newStudent[0].department,
      academicYear: newStudent[0].academic_year,
      phone: newStudent[0].phone,
      residenceCategory: newStudent[0].residence_category,
      profilePicture: newStudent[0].profile_picture,
      createdAt: newStudent[0].created_at,
      updatedAt: newStudent[0].updated_at,
    });
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH update student profile
app.patch(
  "/students/:studentId",
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const {
        fullName,
        gender,
        department,
        academicYear,
        phone,
        residenceCategory,
      } = req.body;

      // Check if student exists
      const [students] = await query(
        "SELECT * FROM students WHERE student_id = ?",
        [req.params.studentId]
      );
      if (students.length === 0) {
        return res.status(404).json({ error: "Student not found" });
      }

      const student = students[0];

      // Build update query dynamically
      const updates = [];
      const values = [];

      if (fullName !== undefined) {
        updates.push("full_name = ?");
        values.push(fullName);
      }
      if (gender !== undefined) {
        updates.push("gender = ?");
        values.push(gender);
      }
      if (department !== undefined) {
        updates.push("department = ?");
        values.push(department);
      }
      if (academicYear !== undefined) {
        updates.push("academic_year = ?");
        values.push(parseInt(academicYear));
      }
      if (phone !== undefined) {
        updates.push("phone = ?");
        values.push(phone);
      }
      if (residenceCategory !== undefined) {
        updates.push("residence_category = ?");
        values.push(residenceCategory);
      }

      // Handle profile picture upload
      if (req.file) {
        // Delete old profile picture if exists
        if (student.profile_picture) {
          const oldPath = path.join(__dirname, student.profile_picture);
          try {
            await fs.unlink(oldPath);
          } catch (err) {
            console.error("Error deleting old profile picture:", err);
          }
        }
        updates.push("profile_picture = ?");
        values.push(`/uploads/profiles/${req.file.filename}`);
      }

      if (updates.length > 0) {
        values.push(req.params.studentId);
        await query(
          `UPDATE students SET ${updates.join(", ")} WHERE student_id = ?`,
          values
        );
      }

      const updated = await query(
        "SELECT * FROM students WHERE student_id = ?",
        [req.params.studentId]
      );

      res.json({
        id: updated[0].id,
        studentId: updated[0].student_id,
        fullName: updated[0].full_name,
        gender: updated[0].gender,
        department: updated[0].department,
        academicYear: updated[0].academic_year,
        phone: updated[0].phone,
        residenceCategory: updated[0].residence_category,
        profilePicture: updated[0].profile_picture,
        createdAt: updated[0].created_at,
        updatedAt: updated[0].updated_at,
      });
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ==================== STUDENT AUTHENTICATION ENDPOINTS ====================

// POST student login
app.post("/api/login", async (req, res) => {
  try {
    const { student_id, password } = req.body;

    if (!student_id || !password) {
      return res.status(400).json({
        success: false,
        message: "Student ID and password are required",
      });
    }

    // Check student account
    const accounts = await query(
      "SELECT * FROM student_accounts WHERE student_id = ?",
      [student_id]
    );

    if (accounts.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const account = accounts[0];

    // Simple password check (in production, use bcrypt)
    if (account.password !== password) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Get student profile
    const students = await query(
      "SELECT * FROM students WHERE student_id = ?",
      [student_id]
    );
    const student = students.length > 0 ? students[0] : null;

    // Generate simple token (in production, use JWT)
    const token = `token_${Date.now()}_${student_id}`;

    res.json({
      success: true,
      token: token,
      userData: {
        student_id: student_id,
        full_name: student?.full_name || account.full_name || "",
        gender: student?.gender || account.gender || "",
        academic_year: student?.academic_year || account.academic_year || "",
        department: student?.department || account.department || "",
        phone: student?.phone || account.phone || "",
      },
      redirect: "../student/profile.html",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// POST student registration
app.post("/api/register", async (req, res) => {
  try {
    const {
      student_id,
      full_name,
      gender,
      academic_year,
      department,
      phone,
      password,
      confirm_password,
    } = req.body;

    // Validation
    if (
      !student_id ||
      !full_name ||
      !gender ||
      !academic_year ||
      !department ||
      !phone ||
      !password
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (password !== confirm_password) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    // Check if student account already exists
    const existing = await query(
      "SELECT id FROM student_accounts WHERE student_id = ?",
      [student_id]
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Student ID already registered" });
    }

    // Start transaction
    const connection = await require("./database/config").getConnection();
    await connection.beginTransaction();

    try {
      // Create or Update student profile (Handle existing student case)
      await connection.execute(
        `INSERT INTO students (student_id, full_name, gender, department, academic_year, phone, residence_category) 
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         gender = VALUES(gender),
         department = VALUES(department),
         academic_year = VALUES(academic_year),
         phone = VALUES(phone)`,
        [
          student_id,
          full_name,
          gender,
          department,
          parseInt(academic_year),
          phone,
          "",
        ]
      );

      // Create student account
      await connection.execute(
        `INSERT INTO student_accounts (student_id, password, full_name, gender, academic_year, department, phone) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          student_id,
          password,
          full_name,
          gender,
          parseInt(academic_year),
          department,
          phone,
        ]
      );

      await connection.commit();
      res.json({ success: true, message: "Registration successful" });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ==================== DORM APPLICATION ENDPOINTS ====================

// POST create dorm application
app.post(
  "/applications",
  documentUpload.fields([
    { name: "kebele_id", maxCount: 1 },
    { name: "support_letter", maxCount: 1 },
    { name: "medical_doc", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { studentId, residency_category, subcity, woreda, terms_confirm } =
        req.body;

      // Get studentId from request body
      const currentStudentId = studentId;

      if (!currentStudentId) {
        return res.status(401).json({ error: "Student ID is required" });
      }

      // Check if application already exists (not rejected)
      const existingApps = await query(
        'SELECT id FROM applications WHERE student_id = ? AND status != "Rejected"',
        [currentStudentId]
      );

      if (existingApps.length > 0) {
        return res
          .status(400)
          .json({ error: "You already have an active application" });
      }

      // Get student profile
      const students = await query(
        "SELECT * FROM students WHERE student_id = ?",
        [currentStudentId]
      );
      if (students.length === 0) {
        return res.status(404).json({ error: "Student profile not found" });
      }

      const student = students[0];

      // --- PHASE CHECK LOGIC ---
      const activePhases = await query(
        "SELECT * FROM phases WHERE status = 'Active'"
      );

      let isEligible = false;
      // Prioritize form input, fallback to DB (correct column), default to Rural
      const categoryToCheck = (
        req.body.residency_category ||
        student.residence_category ||
        "Rural"
      ).trim().toLowerCase();

      for (const phase of activePhases) {
        const pType = (phase.type || "").toLowerCase();

        // Check for Rural
        if (pType.includes("rural") && categoryToCheck === "rural") {
          isEligible = true;
          break;
        }

        // Check for Addis Ababa
        if (
          pType.includes("addis ababa") &&
          (categoryToCheck === "addis ababa" || categoryToCheck === "aa")
        ) {
          isEligible = true;
          break;
        }
      }

      if (!isEligible) {
        return res.status(403).json({
          error: "Applications are not currently open for student category: " + categoryToCheck
        });
      }
      // -------------------------

      // Handle file uploads
      const kebeleIdDoc = req.files?.kebele_id?.[0]
        ? `/uploads/documents/${req.files.kebele_id[0].filename}`
        : null;
      const supportLetterDoc = req.files?.support_letter?.[0]
        ? `/uploads/documents/${req.files.support_letter[0].filename}`
        : null;
      const medicalDoc = req.files?.medical_doc?.[0]
        ? `/uploads/documents/${req.files.medical_doc[0].filename}`
        : null;

      const applicationId = `APP-${Date.now()}`;

      // Insert application
      await query(
        `INSERT INTO applications (application_id, student_id, status, doc_status, residency_category, subcity, woreda, kebele_id_doc, support_letter_doc, medical_doc, admin_remark) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          applicationId,
          currentStudentId,
          "Pending",
          "Pending",
          residency_category || "Rural",
          subcity || null,
          woreda || null,
          kebeleIdDoc,
          supportLetterDoc,
          medicalDoc,
          "Waiting for document review",
        ]
      );

      const newApp = await query(
        "SELECT * FROM applications WHERE application_id = ?",
        [applicationId]
      );

      res.status(201).json({
        id: newApp[0].id,
        applicationId: newApp[0].application_id,
        studentId: newApp[0].student_id,
        status: newApp[0].status,
        docStatus: newApp[0].doc_status,
        residencyCategory: newApp[0].residency_category,
        subcity: newApp[0].subcity,
        woreda: newApp[0].woreda,
        documents: {
          kebeleId: newApp[0].kebele_id_doc,
          supportLetter: newApp[0].support_letter_doc,
          medicalDoc: newApp[0].medical_doc,
        },
        data: {
          studentId: currentStudentId,
          fullName: student.full_name,
          gender: student.gender,
          department: student.department,
          year: student.academic_year,
          category: residency_category || "Rural",
        },
        adminRemark: newApp[0].admin_remark,
        dormAllocation: (typeof app.dorm_allocation === 'string')
          ? JSON.parse(app.dorm_allocation)
          : (app.dorm_allocation || null),
        createdAt: newApp[0].created_at,
        updatedAt: newApp[0].updated_at,
      });
    } catch (error) {
      console.error("Error creating application:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET application by studentId (handles slashes in IDs)
app.get("/applications/student/:studentId(*)", async (req, res) => {
  try {
    const studentId = req.params.studentId;
    await logToFile(`[Server] Fetching application for student: ${studentId}`);
    console.log(`[Server] Fetching application for student: ${studentId}`);

    const applications = await query(
      "SELECT a.*, s.full_name, s.gender, s.department, s.academic_year FROM applications a LEFT JOIN students s ON a.student_id = s.student_id WHERE a.student_id = ? ORDER BY a.created_at DESC LIMIT 1",
      [studentId]
    );

    if (applications.length === 0) {
      console.log(`[Server] No application found for student: ${studentId}`);
      return res.status(404).json({ error: "Application not found" });
    }

    const app = applications[0];

    // Safety for JSON columns
    let dormAlloc = app.dorm_allocation;
    if (typeof dormAlloc === 'string' && dormAlloc.trim().startsWith('{')) {
      try {
        dormAlloc = JSON.parse(dormAlloc);
      } catch (e) {
        console.error("[Server] Failed to parse dorm_allocation:", e);
      }
    }

    res.json({
      id: app.id,
      applicationId: app.application_id,
      studentId: app.student_id,
      status: app.status,
      docStatus: app.doc_status,
      residencyCategory: app.residency_category || 'N/A',
      subcity: app.subcity,
      woreda: app.woreda,
      documents: {
        kebeleId: app.kebele_id_doc,
        supportLetter: app.support_letter_doc,
        medicalDoc: app.medical_doc,
      },
      data: {
        studentId: app.student_id,
        fullName: app.full_name || 'Student',
        gender: app.gender,
        department: app.department,
        year: app.academic_year,
        category: app.residency_category,
      },
      fullName: app.full_name, // fallback for root access
      adminRemark: app.admin_remark || 'No remarks yet',
      dormAllocation: dormAlloc,
      createdAt: app.created_at,
      updatedAt: app.updated_at,
    });
  } catch (error) {
    console.error("[Server] Error fetching application:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET pending applications (for Document Verification)
app.get("/api/applications/pending", async (req, res) => {
  try {
    const applications = await query(
      "SELECT a.*, s.full_name, s.gender, s.department, s.academic_year FROM applications a LEFT JOIN students s ON a.student_id = s.student_id WHERE a.doc_status = 'Pending' OR a.status = 'Pending' ORDER BY a.created_at ASC"
    );

    res.json(
      applications.map((app) => ({
        id: app.id,
        applicationId: app.application_id,
        studentId: app.student_id,
        status: app.status,
        docStatus: app.doc_status,
        residencyCategory: app.residency_category,
        subcity: app.subcity,
        woreda: app.woreda,
        documents: {
          kebeleId: app.kebele_id_doc,
          supportLetter: app.support_letter_doc,
          medicalDoc: app.medical_doc,
        },
        data: {
          studentId: app.student_id,
          fullName: app.full_name,
          gender: app.gender,
          department: app.department,
          year: app.academic_year,
          category: app.residency_category,
        },
        adminRemark: app.admin_remark,
        createdAt: app.created_at,
        updatedAt: app.updated_at,
      }))
    );
  } catch (error) {
    console.error("Error fetching pending applications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET all applications
app.get("/api/applications", async (req, res) => {
  try {
    const applications = await query(
      "SELECT a.*, s.full_name, s.gender, s.department, s.academic_year FROM applications a LEFT JOIN students s ON a.student_id = s.student_id ORDER BY a.created_at DESC"
    );

    res.json(
      applications.map((app) => ({
        id: app.id,
        applicationId: app.application_id,
        studentId: app.student_id,
        status: app.status,
        docStatus: app.doc_status,
        residencyCategory: app.residency_category,
        subcity: app.subcity,
        woreda: app.woreda,
        documents: {
          kebeleId: app.kebele_id_doc,
          supportLetter: app.support_letter_doc,
          medicalDoc: app.medical_doc,
        },
        data: {
          studentId: app.student_id,
          fullName: app.full_name,
          gender: app.gender,
          department: app.department,
          year: app.academic_year,
          category: app.residency_category,
        },
        adminRemark: app.admin_remark,
        dormAllocation: (typeof app.dorm_allocation === 'string')
          ? JSON.parse(app.dorm_allocation)
          : (app.dorm_allocation || null),
        createdAt: app.created_at,
        updatedAt: app.updated_at,
      }))
    );
  } catch (error) {
    console.error("Error fetching pending applications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET application by ID (Application ID or Primary Key)
app.get("/api/applications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Safe lookup: only check the numeric 'id' column if input is actually numeric
    let queryStr = "SELECT a.*, s.full_name, s.gender, s.department, s.academic_year FROM applications a LEFT JOIN students s ON a.student_id = s.student_id WHERE a.application_id = ?";
    let queryParams = [id];

    if (/^\d+$/.test(id)) {
      queryStr += " OR a.id = ?";
      queryParams.push(id);
    }
    queryStr += " LIMIT 1";

    const applications = await query(queryStr, queryParams);

    if (applications.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    const app = applications[0];
    res.json({
      id: app.id,
      applicationId: app.application_id,
      studentId: app.student_id,
      status: app.status,
      docStatus: app.doc_status,
      residencyCategory: app.residency_category,
      subcity: app.subcity,
      woreda: app.woreda,
      documents: {
        kebeleId: app.kebele_id_doc,
        supportLetter: app.support_letter_doc,
        medicalDoc: app.medical_doc,
      },
      data: {
        studentId: app.student_id,
        fullName: app.full_name,
        gender: app.gender,
        department: app.department,
        year: app.academic_year,
        category: app.residency_category,
      },
      adminRemark: app.admin_remark,
      dormAllocation: app.dorm_allocation
        ? JSON.parse(app.dorm_allocation)
        : null,
      createdAt: app.created_at,
      updatedAt: app.updated_at,
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH verify/reject application
app.patch("/api/applications/:id/verify", async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    await logToFile(`[Verify] Action: ${action}, ID: ${id}, Reason: ${reason}`);

    let docStatus, status, adminRemark;

    if (action === 'verify') {
      docStatus = 'Verified';
      status = 'Verified';
      adminRemark = 'Documents verified successfully';
    } else if (action === 'reject') {
      docStatus = 'Rejected';
      status = 'Rejected';
      adminRemark = reason || 'Documents rejected';
    } else {
      await logToFile(`[Verify] Error: Invalid action ${action}`);
      return res.status(400).json({ error: 'Invalid action' });
    }

    await logToFile(`[Verify] adminRemark set to: ${adminRemark}`);

    // Safe update: only check 'id' column if input is numeric to avoid ER_TRUNCATED_WRONG_VALUE
    let whereClause = "WHERE application_id = ?";
    let whereParams = [docStatus, status, adminRemark, id];

    if (/^\d+$/.test(id)) {
      whereClause += " OR id = ?";
      whereParams.push(id);
    }

    console.log(`[Verify] Executing query: UPDATE applications SET doc_status = ?, status = ?, admin_remark = ? WHERE application_id = ? ...`);

    const result = await query(
      `UPDATE applications SET doc_status = ?, status = ?, admin_remark = ?, updated_at = NOW() ${whereClause}`,
      whereParams
    );

    console.log(`[Verify] Query result:`, result);

    if (result.affectedRows === 0) {
      console.log(`[Verify] Application not found with ID: ${id}`);
      return res.status(404).json({ error: 'Application not found' });
    }

    console.log(`[Verify] Success. Sending JSON response.`);
    res.json({ success: true, message: `Application ${docStatus}` });
  } catch (error) {
    console.error("[Verify] CRITICAL ERROR:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================== ROOM MANAGEMENT ENDPOINTS ====================

// GET all rooms
app.get("/api/rooms", async (req, res) => {
  try {
    console.log("[Rooms] Fetching all rooms");
    const rooms = await query("SELECT * FROM dorm_rooms ORDER BY block_name, room_number");
    res.json(rooms);
  } catch (error) {
    console.error("[Rooms] Error fetching rooms:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST add new room
app.post("/api/rooms", async (req, res) => {
  try {
    const { blockName, roomNumber, capacity, gender, status } = req.body;
    console.log("[Rooms] Adding room:", { blockName, roomNumber, capacity, gender, status });

    if (!blockName || !roomNumber || !capacity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await query(
      "INSERT INTO dorm_rooms (block_name, room_number, capacity, gender, status) VALUES (?, ?, ?, ?, ?)",
      [blockName, roomNumber, capacity, gender || 'Male', status || 'Active']
    );

    res.json({ success: true, id: result.insertId, message: "Room added successfully" });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      return res.status(409).json({ error: `Room ${roomNumber} in block ${blockName} already exists.` });
    }
    console.error("[Rooms] Error creating room:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH update room
app.patch("/api/rooms/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { blockName, roomNumber, capacity, status, gender } = req.body;
    console.log("[Rooms] Updating room:", id, req.body);

    const updates = [];
    const values = [];

    if (blockName) { updates.push("block_name = ?"); values.push(blockName); }
    if (roomNumber) { updates.push("room_number = ?"); values.push(roomNumber); }
    if (capacity !== undefined) { updates.push("capacity = ?"); values.push(capacity); }
    if (status) { updates.push("status = ?"); values.push(status); }
    if (gender) { updates.push("gender = ?"); values.push(gender); }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);
    const result = await query(
      `UPDATE dorm_rooms SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Room not found" });
    }

    res.json({ success: true, message: "Room updated successfully" });
  } catch (error) {
    console.error("[Rooms] Error updating room:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE room
app.delete("/api/rooms/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("[Rooms] Deleting room:", id);
    const result = await query("DELETE FROM dorm_rooms WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Room not found" });
    }

    res.json({ success: true, message: "Room deleted successfully" });
  } catch (error) {
    console.error("[Rooms] Error deleting room:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================== ALLOCATION ENDPOINTS ====================

// GET all approved allocations
app.get("/api/allocation/results", async (req, res) => {
  try {
    const results = await query(`
      SELECT a.id, a.application_id as applicationId, a.student_id as studentId, a.status,
             s.full_name, s.gender, s.department, a.residency_category as category,
             a.dorm_allocation
      FROM applications a
      JOIN students s ON a.student_id = s.student_id
      WHERE a.status IN ('Approved', 'Verified') OR a.dorm_allocation IS NOT NULL
      ORDER BY a.updated_at DESC
    `);
    res.json(results);
  } catch (error) {
    console.error("[Allocation] Error fetching results:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST run allocation algorithm
app.post("/api/allocation/run", async (req, res) => {
  try {
    console.log("[Allocation] Starting allocation process...");

    // 1. Fetch Students (Verified and not yet allocated)
    const students = await query(`
      SELECT a.id, a.application_id, a.student_id, a.residency_category, a.medical_doc, s.gender
      FROM applications a
      JOIN students s ON a.student_id = s.student_id
      WHERE a.status = 'Verified' AND (a.dorm_allocation IS NULL OR a.dorm_allocation = '')
    `);

    if (students.length === 0) {
      return res.json({ success: true, message: "No pending verified students to allocate." });
    }

    // 2. Fetch Available Rooms (Active, Available, or Empty)
    const rooms = await query(`
      SELECT id, block_name, room_number, capacity, current_occupancy, gender 
      FROM dorm_rooms 
      WHERE status IN ('Active', 'available', 'empty') AND current_occupancy < capacity
    `);

    if (rooms.length === 0) {
      return res.status(400).json({ error: "No available rooms found." });
    }

    // 3. Categorize by Priority
    const rural = students.filter(s => s.residency_category?.toLowerCase() === 'rural');
    const medical = students.filter(s =>
      s.residency_category?.toLowerCase() === 'addis ababa' &&
      (s.medical_doc !== null && s.medical_doc !== '')
    );
    const others = students.filter(s =>
      !rural.includes(s) && !medical.includes(s)
    );

    // Shuffle function for randomness
    const shuffle = (array) => array.sort(() => Math.random() - 0.5);

    const sortedQueues = [
      shuffle(rural),
      shuffle(medical),
      shuffle(others)
    ];

    let allocatedCount = 0;

    // 4. Allocation Logic
    for (const queue of sortedQueues) {
      for (const student of queue) {
        // Find matching room (Gender + Space)
        const room = rooms.find(r =>
          r.gender.toLowerCase() === student.gender.toLowerCase() &&
          r.current_occupancy < r.capacity
        );

        if (room) {
          const allocationData = JSON.stringify({
            dormName: room.block_name,
            roomNumber: room.room_number
          });

          // Update DB
          await query(
            "UPDATE applications SET dorm_allocation = ?, status = 'Approved', updated_at = NOW() WHERE id = ?",
            [allocationData, student.id]
          );

          await query(
            "UPDATE dorm_rooms SET current_occupancy = current_occupancy + 1 WHERE id = ?",
            [room.id]
          );

          // Update local state to avoid over-allocation in this loop
          room.current_occupancy++;
          allocatedCount++;
        }
      }
    }

    console.log(`[Allocation] Process finished. Allocated ${allocatedCount} students.`);
    res.json({ success: true, message: `Successfully allocated ${allocatedCount} students.` });
  } catch (error) {
    console.error("[Allocation] CRITICAL ERROR during run:", error);
    res.status(500).json({ error: "Internal server error during allocation." });
  }
});

// PATCH update application status (for admin)
app.patch("/applications/:applicationId", async (req, res) => {
  try {
    const { status, docStatus, adminRemark, dormAllocation } = req.body;

    const updates = [];
    const values = [];

    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }
    if (docStatus !== undefined) {
      updates.push("doc_status = ?");
      values.push(docStatus);
    }
    if (adminRemark !== undefined) {
      updates.push("admin_remark = ?");
      values.push(adminRemark);
    }
    if (dormAllocation !== undefined) {
      updates.push("dorm_allocation = ?");
      values.push(JSON.stringify(dormAllocation));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(req.params.applicationId);
    await query(
      `UPDATE applications SET ${updates.join(", ")} WHERE application_id = ?`,
      values
    );

    const updated = await query(
      "SELECT a.*, s.full_name, s.gender, s.department, s.academic_year FROM applications a LEFT JOIN students s ON a.student_id = s.student_id WHERE a.application_id = ?",
      [req.params.applicationId]
    );

    if (updated.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    const app = updated[0];
    res.json({
      id: app.id,
      applicationId: app.application_id,
      studentId: app.student_id,
      status: app.status,
      docStatus: app.doc_status,
      residencyCategory: app.residency_category,
      subcity: app.subcity,
      woreda: app.woreda,
      documents: {
        kebeleId: app.kebele_id_doc,
        supportLetter: app.support_letter_doc,
        medicalDoc: app.medical_doc,
      },
      data: {
        studentId: app.student_id,
        fullName: app.full_name,
        gender: app.gender,
        department: app.department,
        year: app.academic_year,
        category: app.residency_category,
      },
      adminRemark: app.admin_remark,
      dormAllocation: app.dorm_allocation
        ? JSON.parse(app.dorm_allocation)
        : null,
      createdAt: app.created_at,
      updatedAt: app.updated_at,
    });
  } catch (error) {
    console.error("Error updating application:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Registrar Matching logic
app.post("/api/registrar/match", async (req, res) => {
  logToFile("Starting /api/registrar/match with Strict Rule: UGR/1111/16 - UGR/9999/16");
  try {
    // 1. Fetch ALL students
    const allStudents = await query("SELECT student_id FROM students");

    if (allStudents.length === 0) {
      return res.json({ success: true, message: "No students in database to check." });
    }

    const studentsToDelete = [];
    const validRangeStart = 1111;
    const validRangeEnd = 9999;
    const yearSuffix = '16'; // strictly /16

    // 2. Filter invalid IDs
    for (const s of allStudents) {
      const id = String(s.student_id || '').trim().toUpperCase();

      // Expected Format: UGR/xxxx/16
      // Regex: ^UGR\/(\d{4})\/16$
      const match = id.match(/^UGR\/(\d{4})\/16$/);

      if (!match) {
        // Invalid format (wrong year, wrong prefix, etc.)
        studentsToDelete.push(s.student_id);
        continue;
      }

      // Check numeric range
      const number = parseInt(match[1], 10);
      if (number < validRangeStart || number > validRangeEnd) {
        // Out of range
        studentsToDelete.push(s.student_id);
      }
    }

    logToFile(`Found ${studentsToDelete.length} invalid students out of ${allStudents.length} total.`);

    if (studentsToDelete.length === 0) {
      return res.json({
        success: true,
        message: "Match complete. All students are valid."
      });
    }

    // 3. Delete invalid students
    // Batch delete
    const result = await query(
      "DELETE FROM students WHERE student_id IN (?)",
      [studentsToDelete]
    );

    const deletedCount = result.affectedRows || 0;
    logToFile(`Deleted ${deletedCount} invalid students.`);

    // 4. Cleanup orphaned applications (Recommended)
    const appResult = await query("DELETE FROM applications WHERE student_id IN (?)", [studentsToDelete]);
    const deletedApps = appResult.affectedRows || 0;

    res.json({
      success: true,
      deletedStudents: deletedCount,
      deletedApps: deletedApps,
      message: `Match complete. Removed ${deletedCount} students outside range UGR/${validRangeStart}/${yearSuffix} - UGR/${validRangeEnd}/${yearSuffix}.`
    });

  } catch (error) {
    logToFile(`CRITICAL ERROR in matching: ${error.message}`);
    console.error("[Matching ERROR]:", error);
    res.status(500).json({ error: "Internal server error during matching" });
  }
});


// Custom 404 handler for debugging unmatched routes
app.use(async (req, res, next) => {
  const logMsg = `[404 NOT FOUND] ${req.method} ${req.url}`;
  console.log(logMsg);
  await logToFile(logMsg);
  res.status(404).json({ error: "Route not found", url: req.url });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(
    `📸 Profile pictures: ${path.join(__dirname, "uploads", "profiles")}`
  );
  console.log(`📄 Documents: ${path.join(__dirname, "uploads", "documents")}`);

  // Test database connection
  const connected = await testConnection();
  if (!connected) {
    console.log(
      "⚠️  Warning: Database connection failed. Please check your MySQL configuration."
    );
  }
});
