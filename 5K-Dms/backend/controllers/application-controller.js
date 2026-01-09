import db from "../config/database.js"
import { successResponse, errorResponse } from "../utils/response.js"

export const submitApplication = async (req, res) => {
  try {
    const { category } = req.body
    const userId = req.user.id

    // Check if user already has an application
    const [existing] = await db.execute("SELECT id FROM applications WHERE user_id = ?", [userId])

    if (existing.length > 0) {
      return errorResponse(res, "Application already submitted", 400)
    }

    // Get file paths from multer
    const kebele_id_url = req.files["kebele_id"] ? req.files["kebele_id"][0].path : null
    const support_letter_url = req.files["support_letter"] ? req.files["support_letter"][0].path : null
    const medical_doc_url = req.files["medical_doc"] ? req.files["medical_doc"][0].path : null

    // Insert application
    const [result] = await db.execute(
      `INSERT INTO applications (user_id, category, kebele_id_url, support_letter_url, medical_doc_url, status) 
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [userId, category, kebele_id_url, support_letter_url, medical_doc_url],
    )

    // Update user status
    await db.execute("UPDATE users SET status = 'pending' WHERE id = ?", [userId])

    return successResponse(res, { applicationId: result.insertId }, "Application submitted successfully", 201)
  } catch (error) {
    console.error("[v0] Application submission error:", error.message)
    return errorResponse(res, "Failed to submit application", 500)
  }
}

export const getAllApplications = async (req, res) => {
  try {
    const { status, category } = req.query
    let query = `
      SELECT a.*, u.full_name, u.student_id, u.department, u.academic_year 
      FROM applications a 
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `
    const params = []

    if (status) {
      query += " AND a.status = ?"
      params.push(status)
    }

    if (category) {
      query += " AND a.category = ?"
      params.push(category)
    }

    query += " ORDER BY a.submission_date DESC"

    const [applications] = await db.execute(query, params)
    return successResponse(res, applications)
  } catch (error) {
    console.error("[v0] Get applications error:", error.message)
    return errorResponse(res, "Failed to fetch applications", 500)
  }
}

export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, adminRemark } = req.body

    if (!["verified", "rejected"].includes(status)) {
      return errorResponse(res, "Invalid status")
    }

    // Update application
    const [result] = await db.execute("UPDATE applications SET status = ?, admin_remark = ? WHERE id = ?", [
      status,
      adminRemark,
      id,
    ])

    if (result.affectedRows === 0) {
      return errorResponse(res, "Application not found", 404)
    }

    // Get user_id for this application to update user status
    const [apps] = await db.execute("SELECT user_id FROM applications WHERE id = ?", [id])
    const userId = apps[0].user_id

    await db.execute("UPDATE users SET status = ? WHERE id = ?", [status, userId])

    return successResponse(res, null, `Application ${status} successfully`)
  } catch (error) {
    console.error("[v0] Update application error:", error.message)
    return errorResponse(res, "Failed to update application", 500)
  }
}

export const getUserApplication = async (req, res) => {
  try {
    const [apps] = await db.execute("SELECT * FROM applications WHERE user_id = ?", [req.user.id])

    if (apps.length === 0) {
      return successResponse(res, null, "No application found")
    }

    return successResponse(res, apps[0])
  } catch (error) {
    console.error("[v0] Get user application error:", error.message)
    return errorResponse(res, "Failed to fetch application", 500)
  }
}
