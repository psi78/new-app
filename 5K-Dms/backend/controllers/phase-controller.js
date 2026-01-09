import db from "../config/database.js"
import { successResponse, errorResponse } from "../utils/response.js"

export const createPhase = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.body

    const [result] = await db.execute(
      "INSERT INTO phases (type, start_date, end_date, status) VALUES (?, ?, ?, 'inactive')",
      [type, startDate, endDate],
    )

    return successResponse(res, { id: result.insertId }, "Phase created successfully", 201)
  } catch (error) {
    console.error("[v0] Create phase error:", error.message)
    return errorResponse(res, "Failed to create phase", 500)
  }
}

export const updatePhaseStatus = async (req, res) => {
  const connection = await db.getConnection()
  try {
    await connection.beginTransaction()
    const { id } = req.params
    const { status } = req.body

    if (status === "active") {
      // Deactivate all other phases first as only one can be active at a time (SRS)
      await connection.execute("UPDATE phases SET status = 'inactive'")
    }

    const [result] = await connection.execute("UPDATE phases SET status = ? WHERE id = ?", [status, id])

    if (result.affectedRows === 0) {
      await connection.rollback()
      return errorResponse(res, "Phase not found", 404)
    }

    await connection.commit()
    return successResponse(res, null, `Phase ${status}d successfully`)
  } catch (error) {
    await connection.rollback()
    console.error("[v0] Update phase error:", error.message)
    return errorResponse(res, "Failed to update phase", 500)
  } finally {
    connection.release()
  }
}

export const getPhases = async (req, res) => {
  try {
    const [phases] = await db.execute("SELECT * FROM phases ORDER BY start_date DESC")
    return successResponse(res, phases)
  } catch (error) {
    console.error("[v0] Get phases error:", error.message)
    return errorResponse(res, "Failed to fetch phases", 500)
  }
}
