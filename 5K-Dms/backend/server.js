import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

// Import routes
import authRoutes from "./routes/auth.js"
import applicationRoutes from "./routes/applications.js"
import adminRoutes from "./routes/admin.js"
import allocationRoutes from "./routes/allocations.js"
import notificationRoutes from "./routes/notifications.js"
import phaseRoutes from "./routes/phases.js"
import roomRoutes from "./routes/rooms.js"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "5K DMS API is running" })
})

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/applications", applicationRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/allocations", allocationRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/phases", phaseRoutes)
app.use("/api/rooms", roomRoutes)

// Public announcements endpoint (for landing page - no auth required)
app.get("/api/publicAnnouncements", async (req, res) => {
  try {
    const db = (await import("./config/database.js")).default
    const [announcements] = await db.execute(
      "SELECT id, title as type, message as text, created_at as date FROM announcements WHERE target_audience = 'all' ORDER BY created_at DESC LIMIT 10"
    )
    
    // Format dates
    const formatted = announcements.map(a => ({
      id: a.id,
      type: a.type || "Announcement",
      text: a.message || a.text,
      date: new Date(a.date).toLocaleDateString()
    }))
    
    res.json(formatted)
  } catch (error) {
    console.error("Public announcements error:", error)
    res.status(500).json({ success: false, message: "Failed to fetch announcements" })
  }
})

// Compatibility routes for old frontend API calls (legacy support)
// These map old endpoints to new Express API structure
app.get("/adminRegistry", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }
    
    const jwt = (await import("jsonwebtoken")).default
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    
    if (decoded.role !== "system_admin" && decoded.role !== "dorm_manager") {
      return res.status(403).json({ success: false, message: "Forbidden" })
    }
    
    const db = (await import("./config/database.js")).default
    const [admins] = await db.execute(
      "SELECT id, admin_id as adminId, full_name as name, role, gender, phone FROM users WHERE role IN ('dorm_manager', 'system_admin')"
    )
    
    // Transform to match old format
    const transformed = admins.map(a => ({
      id: a.id,
      adminId: a.adminId,
      name: a.name,
      role: a.role === "system_admin" ? "SYSTEM" : "DORM",
      phone: a.phone || "",
      perms: a.role === "system_admin" ? ["SYSTEM", "HOME"] : ["HOME", "OVERVIEW"]
    }))
    
    res.json(transformed)
  } catch (error) {
    console.error("Admin registry error:", error)
    res.status(500).json({ success: false, message: "Failed to fetch admins" })
  }
})

// Legacy phases endpoint
app.get("/phases", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }
    
    const db = (await import("./config/database.js")).default
    const [phases] = await db.execute(
      "SELECT id, type, start_date as start, end_date as end, status, created_at as createdAt FROM phases ORDER BY created_at DESC"
    )
    
    const transformed = phases.map(p => ({
      id: p.id,
      type: p.type === "rural" ? "Rural Student Registration" : "Addis Ababa Student Registration",
      start: p.start,
      end: p.end,
      status: p.status,
      createdAt: p.createdAt
    }))
    
    res.json(transformed)
  } catch (error) {
    console.error("Phases error:", error)
    res.status(500).json({ success: false, message: "Failed to fetch phases" })
  }
})

app.post("/phases", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }
    
    const jwt = (await import("jsonwebtoken")).default
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    
    if (decoded.role !== "system_admin") {
      return res.status(403).json({ success: false, message: "Forbidden" })
    }
    
    const { type, start, end, status } = req.body
    const db = (await import("./config/database.js")).default
    
    const phaseType = type.toLowerCase().includes("rural") ? "rural" : "addis_ababa"
    
    const [result] = await db.execute(
      "INSERT INTO phases (type, start_date, end_date, status) VALUES (?, ?, ?, ?)",
      [phaseType, start, end, status || "inactive"]
    )
    
    res.json({ id: result.insertId, ...req.body })
  } catch (error) {
    console.error("Create phase error:", error)
    res.status(500).json({ success: false, message: "Failed to create phase" })
  }
})

app.patch("/phases/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }
    
    const { id } = req.params
    const { status } = req.body
    const db = (await import("./config/database.js")).default
    
    await db.execute("UPDATE phases SET status = ? WHERE id = ?", [status, id])
    res.json({ id, status })
  } catch (error) {
    console.error("Update phase error:", error)
    res.status(500).json({ success: false, message: "Failed to update phase" })
  }
})

app.delete("/phases/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }
    
    const { id } = req.params
    const db = (await import("./config/database.js")).default
    
    await db.execute("DELETE FROM phases WHERE id = ?", [id])
    res.json({ id })
  } catch (error) {
    console.error("Delete phase error:", error)
    res.status(500).json({ success: false, message: "Failed to delete phase" })
  }
})

// Legacy applications endpoint
app.get("/applications", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }
    
    const db = (await import("./config/database.js")).default
    const [applications] = await db.execute(
      `SELECT a.*, u.full_name, u.student_id, u.department, u.academic_year 
       FROM applications a 
       JOIN users u ON a.user_id = u.id 
       ORDER BY a.submission_date DESC`
    )
    
    res.json(applications)
  } catch (error) {
    console.error("Applications error:", error)
    res.status(500).json({ success: false, message: "Failed to fetch applications" })
  }
})

app.patch("/applications/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }
    
    const { id } = req.params
    const { docStatus, adminRemark } = req.body
    const db = (await import("./config/database.js")).default
    
    await db.execute(
      "UPDATE applications SET status = ?, admin_remark = ? WHERE id = ?",
      [docStatus, adminRemark || null, id]
    )
    
    res.json({ id, status: docStatus })
  } catch (error) {
    console.error("Update application error:", error)
    res.status(500).json({ success: false, message: "Failed to update application" })
  }
})

// Legacy rooms endpoint
app.get("/rooms", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }
    
    const db = (await import("./config/database.js")).default
    const [rooms] = await db.execute("SELECT * FROM rooms ORDER BY block_name, room_number")
    
    res.json(rooms)
  } catch (error) {
    console.error("Rooms error:", error)
    res.status(500).json({ success: false, message: "Failed to fetch rooms" })
  }
})

app.post("/rooms", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }
    
    const { block, roomNo, capacity, genderType } = req.body
    const db = (await import("./config/database.js")).default
    
    const [result] = await db.execute(
      "INSERT INTO rooms (room_number, block_name, gender_type, capacity) VALUES (?, ?, ?, ?)",
      [roomNo, block, genderType || "male", capacity]
    )
    
    res.json({ id: result.insertId, ...req.body })
  } catch (error) {
    console.error("Create room error:", error)
    res.status(500).json({ success: false, message: "Failed to create room" })
  }
})

app.patch("/rooms/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }
    
    const { id } = req.params
    const { block, roomNo, capacity, status } = req.body
    const db = (await import("./config/database.js")).default
    
    await db.execute(
      "UPDATE rooms SET room_number = ?, block_name = ?, capacity = ?, status = ? WHERE id = ?",
      [roomNo, block, capacity, status, id]
    )
    
    res.json({ id, ...req.body })
  } catch (error) {
    console.error("Update room error:", error)
    res.status(500).json({ success: false, message: "Failed to update room" })
  }
})

app.delete("/rooms/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }
    
    const { id } = req.params
    const db = (await import("./config/database.js")).default
    
    await db.execute("DELETE FROM rooms WHERE id = ?", [id])
    res.json({ id })
  } catch (error) {
    console.error("Delete room error:", error)
    res.status(500).json({ success: false, message: "Failed to delete room" })
  }
})

// Serve static files from frontend (HTML, CSS, JS)
const frontendPath = path.join(__dirname, "..", "frontend")
app.use(express.static(frontendPath))
app.use("/pages", express.static(path.join(frontendPath, "pages")))
app.use("/icons", express.static(path.join(__dirname, "..", "icons")))

// Serve index.html for root route
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"))
})

// Error handling middleware (must be before 404 handler)
app.use((err, req, res, next) => {
  console.error("Error:", err)
  // If it's an API route, return JSON
  if (req.path.startsWith("/api")) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error",
    })
  }
  // Otherwise, send error page or redirect
  res.status(err.status || 500).send("Internal server error")
})

// 404 handler for API routes only
app.use("/api/*", (req, res) => {
  res.status(404).json({ success: false, message: "API route not found" })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📝 API endpoints available at http://localhost:${PORT}/api`)
})

export default app

