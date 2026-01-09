import bcrypt from "bcryptjs"
import db from "../config/database.js"
import { successResponse, errorResponse } from "../utils/response.js"

export const getAllAdmins = async (req, res) => {
  try {
    const [admins] = await db.execute(
      "SELECT id, admin_id, full_name, role, gender, created_at FROM users WHERE role IN ('dorm_manager', 'system_admin')",
    )
    return successResponse(res, admins)
  } catch (error) {
    console.error("[v0] Get admins error:", error.message)
    return errorResponse(res, "Failed to fetch admins", 500)
  }
}

export const addAdmin = async (req, res) => {
  try {
    const { adminId, fullName, gender, role, password } = req.body

    const hashedPassword = await bcrypt.hash(password, 10)

    const [result] = await db.execute(
      "INSERT INTO users (admin_id, full_name, gender, role, password) VALUES (?, ?, ?, ?, ?)",
      [adminId, fullName, gender, role, hashedPassword],
    )

    return successResponse(res, { id: result.insertId }, "Admin added successfully", 201)
  } catch (error) {
    console.error("[v0] Add admin error:", error.message)
    return errorResponse(res, "Failed to add admin", 500)
  }
}

export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params

    // Prevent system admin from deleting themselves
    if (Number.parseInt(id) === req.user.id) {
      return errorResponse(res, "You cannot delete your own account", 400)
    }

    const [result] = await db.execute("DELETE FROM users WHERE id = ? AND role != 'student'", [id])

    if (result.affectedRows === 0) {
      return errorResponse(res, "Admin not found", 404)
    }

    return successResponse(res, null, "Admin deleted successfully")
  } catch (error) {
    console.error("[v0] Delete admin error:", error.message)
    return errorResponse(res, "Failed to delete admin", 500)
  }
}
