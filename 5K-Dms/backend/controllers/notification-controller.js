import db from "../config/database.js"
import { successResponse, errorResponse } from "../utils/response.js"

export const sendAnnouncement = async (req, res) => {
  try {
    const { title, message, targetAudience } = req.body
    const createdBy = req.user.id

    const [result] = await db.execute(
      "INSERT INTO announcements (title, message, target_audience, created_by) VALUES (?, ?, ?, ?)",
      [title, message, targetAudience || "all", createdBy],
    )

    return successResponse(res, { id: result.insertId }, "Announcement sent successfully", 201)
  } catch (error) {
    console.error("[v0] Send announcement error:", error.message)
    return errorResponse(res, "Failed to send announcement", 500)
  }
}

export const getAnnouncements = async (req, res) => {
  try {
    let query = "SELECT a.*, u.full_name as author FROM announcements a JOIN users u ON a.created_by = u.id"
    const params = []

    if (req.user.role === "student") {
      // Get student's category for filtering
      const [student] = await db.execute(
        "SELECT app.category FROM users u JOIN applications app ON u.id = app.user_id WHERE u.id = ?",
        [req.user.id],
      )

      query += " WHERE target_audience = 'all'"
      if (student.length > 0) {
        query += " OR target_audience = ?"
        params.push(student[0].category)
      }
    }

    query += " ORDER BY a.created_at DESC"

    const [announcements] = await db.execute(query, params)
    return successResponse(res, announcements)
  } catch (error) {
    console.error("[v0] Get announcements error:", error.message)
    return errorResponse(res, "Failed to fetch announcements", 500)
  }
}
