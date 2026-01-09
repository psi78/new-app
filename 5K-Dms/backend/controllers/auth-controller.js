import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import db from "../config/database.js"
import { successResponse, errorResponse, validationErrorResponse } from "../utils/response.js"
import { isValidPassword } from "../utils/validators.js"

export const registerStudent = async (req, res) => {
  try {
    const { studentId, fullName, gender, department, academicYear, phone, password } = req.body

    // Basic validation
    if (!studentId || !fullName || !password) {
      return validationErrorResponse(res, { message: "Required fields missing" })
    }

    if (!isValidPassword(password)) {
      return errorResponse(res, "Password must be at least 8 characters long")
    }

    // Check if student already exists
    const [existingUser] = await db.execute("SELECT id FROM users WHERE student_id = ?", [studentId])

    if (existingUser.length > 0) {
      return errorResponse(res, "Account already registered with this Student ID", 409)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user record
    const [result] = await db.execute(
      `INSERT INTO users (
        student_id, full_name, gender, department, academic_year, phone, password, role, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'student', 'not_applied')`,
      [studentId, fullName, gender, department, academicYear, phone, hashedPassword],
    )

    return successResponse(res, { userId: result.insertId }, "Registration successful", 201)
  } catch (error) {
    console.error("[v0] Registration error:", error.message)
    return errorResponse(res, "Registration failed. Please try again later.", 500)
  }
}

export const login = async (req, res) => {
  try {
    const { id, password } = req.body // id can be student_id or admin_id

    if (!id || !password) {
      return validationErrorResponse(res, { message: "ID and password are required" })
    }

    // Find user by student_id or admin_id
    const [users] = await db.execute("SELECT * FROM users WHERE student_id = ? OR admin_id = ?", [id, id])

    if (users.length === 0) {
      return errorResponse(res, "Account not found", 404)
    }

    const user = users[0]

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return errorResponse(res, "Incorrect password", 401)
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        studentId: user.student_id,
        adminId: user.admin_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    )

    return successResponse(
      res,
      {
        token,
        user: {
          id: user.id,
          fullName: user.full_name,
          role: user.role,
          studentId: user.student_id,
          status: user.status,
        },
      },
      "Login successful",
    )
  } catch (error) {
    console.error("[v0] Login error:", error.message)
    return errorResponse(res, "Login failed. Please try again later.", 500)
  }
}

export const getProfile = async (req, res) => {
  try {
    const [users] = await db.execute(
      "SELECT id, student_id, admin_id, full_name, role, gender, department, academic_year, phone, status FROM users WHERE id = ?",
      [req.user.id],
    )

    if (users.length === 0) {
      return errorResponse(res, "User not found", 404)
    }

    return successResponse(res, users[0])
  } catch (error) {
    console.error("[v0] Get profile error:", error.message)
    return errorResponse(res, "Failed to fetch profile", 500)
  }
}
