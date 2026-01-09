const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const multer = require("multer");
const { query, testConnection } = require("./database/config");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Serve static files (profile images and documents)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
      // Create student profile
      await connection.execute(
        `INSERT INTO students (student_id, full_name, gender, department, academic_year, phone, residence_category) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
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
        dormAllocation: newApp[0].dorm_allocation
          ? JSON.parse(newApp[0].dorm_allocation)
          : null,
        createdAt: newApp[0].created_at,
        updatedAt: newApp[0].updated_at,
      });
    } catch (error) {
      console.error("Error creating application:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET application by studentId
app.get("/applications/student/:studentId", async (req, res) => {
  try {
    const applications = await query(
      "SELECT a.*, s.full_name, s.gender, s.department, s.academic_year FROM applications a LEFT JOIN students s ON a.student_id = s.student_id WHERE a.student_id = ? ORDER BY a.created_at DESC LIMIT 1",
      [req.params.studentId]
    );

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

// GET all applications
app.get("/applications", async (req, res) => {
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
        dormAllocation: app.dorm_allocation
          ? JSON.parse(app.dorm_allocation)
          : null,
        createdAt: app.created_at,
        updatedAt: app.updated_at,
      }))
    );
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ error: "Internal server error" });
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

// ==================== EXISTING ENDPOINTS (for compatibility) ====================

// Admin Registry endpoints
app.get("/adminRegistry", async (req, res) => {
  try {
    const admins = await query("SELECT * FROM admin_registry");
    res.json(
      admins.map((a) => ({
        id: a.id,
        adminId: a.admin_id,
        pass: a.password,
        name: a.name,
        phone: a.phone,
        role: a.role,
        perms: a.perms ? JSON.parse(a.perms) : [],
      }))
    );
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/adminRegistry", async (req, res) => {
  try {
    const { adminId, password, name, phone, role, perms } = req.body;
    await query(
      "INSERT INTO admin_registry (admin_id, password, name, phone, role, perms) VALUES (?, ?, ?, ?, ?, ?)",
      [
        adminId,
        password,
        name,
        phone || null,
        role,
        JSON.stringify(perms || []),
      ]
    );
    const newAdmin = await query(
      "SELECT * FROM admin_registry WHERE admin_id = ?",
      [adminId]
    );
    res.status(201).json({
      id: newAdmin[0].id,
      adminId: newAdmin[0].admin_id,
      pass: newAdmin[0].password,
      name: newAdmin[0].name,
      phone: newAdmin[0].phone,
      role: newAdmin[0].role,
      perms: newAdmin[0].perms ? JSON.parse(newAdmin[0].perms) : [],
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Public Announcements endpoints
app.get("/publicAnnouncements", async (req, res) => {
  try {
    const announcements = await query(
      "SELECT * FROM public_announcements ORDER BY created_at DESC"
    );
    res.json(
      announcements.map((a) => ({
        id: a.id,
        text: a.text,
        date: a.date,
        type: a.type,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/publicAnnouncements", async (req, res) => {
  try {
    const { text, date, type } = req.body;
    await query(
      "INSERT INTO public_announcements (text, date, type) VALUES (?, ?, ?)",
      [text, date || null, type || null]
    );
    const newAnnouncement = await query(
      "SELECT * FROM public_announcements ORDER BY id DESC LIMIT 1"
    );
    res.status(201).json({
      id: newAnnouncement[0].id,
      text: newAnnouncement[0].text,
      date: newAnnouncement[0].date,
      type: newAnnouncement[0].type,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Phases endpoints
app.get("/phases", async (req, res) => {
  try {
    const phases = await query("SELECT * FROM phases ORDER BY created_at DESC");
    res.json(
      phases.map((p) => ({
        id: p.id,
        type: p.type,
        start: p.start_date,
        end: p.end_date,
        status: p.status,
        createdAt: p.created_at,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/phases", async (req, res) => {
  try {
    const { type, start, end, status } = req.body;
    await query(
      "INSERT INTO phases (type, start_date, end_date, status) VALUES (?, ?, ?, ?)",
      [type, start, end, status || "Inactive"]
    );
    const newPhase = await query(
      "SELECT * FROM phases ORDER BY id DESC LIMIT 1"
    );
    res.status(201).json({
      id: newPhase[0].id,
      type: newPhase[0].type,
      start: newPhase[0].start_date,
      end: newPhase[0].end_date,
      status: newPhase[0].status,
      createdAt: newPhase[0].created_at,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
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
