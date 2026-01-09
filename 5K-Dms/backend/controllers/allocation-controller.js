import db from "../config/database.js"
import { successResponse, errorResponse } from "../utils/response.js"

export const runAllocationProcess = async (req, res) => {
  const connection = await db.getConnection()
  try {
    await connection.beginTransaction()

    // 1. Get all verified students who haven't been allocated yet
    const [students] = await connection.execute(
      `SELECT u.id, u.gender, a.category 
       FROM users u 
       JOIN applications a ON u.id = a.user_id 
       WHERE u.role = 'student' AND u.status = 'verified'`,
    )

    if (students.length === 0) {
      await connection.rollback()
      return successResponse(res, null, "No students available for allocation")
    }

    // 2. Get available rooms
    const [rooms] = await connection.execute(
      "SELECT * FROM rooms WHERE status != 'full' ORDER BY block_name, room_number",
    )

    if (rooms.length === 0) {
      await connection.rollback()
      return errorResponse(res, "No available rooms found", 400)
    }

    // Allocation logic based on rules (Rural priority 75%, Gender separation)
    const maleStudents = students.filter((s) => s.gender === "male")
    const femaleStudents = students.filter((s) => s.gender === "female")

    const allocateByGender = async (studentsList, gender) => {
      const genderRooms = rooms.filter((r) => r.gender_type === gender)
      let roomIdx = 0
      let allocationsCount = 0

      // Sort students: Rural first (priority)
      const sortedStudents = [...studentsList].sort((a, b) => {
        if (a.category === "rural" && b.category !== "rural") return -1
        if (a.category !== "rural" && b.category === "rural") return 1
        return 0
      })

      for (const student of sortedStudents) {
        // Find next available room with capacity
        while (roomIdx < genderRooms.length && genderRooms[roomIdx].occupancy_count >= genderRooms[roomIdx].capacity) {
          roomIdx++
        }

        if (roomIdx < genderRooms.length) {
          const room = genderRooms[roomIdx]

          // Create allocation
          await connection.execute("INSERT INTO allocations (user_id, room_id) VALUES (?, ?)", [student.id, room.id])

          // Update room occupancy
          room.occupancy_count++
          const newStatus = room.occupancy_count >= room.capacity ? "full" : "available"

          await connection.execute("UPDATE rooms SET occupancy_count = ?, status = ? WHERE id = ?", [
            room.occupancy_count,
            newStatus,
            room.id,
          ])

          // Update user status
          await connection.execute("UPDATE users SET status = 'allocated' WHERE id = ?", [student.id])

          allocationsCount++
        }
      }
      return allocationsCount
    }

    const maleCount = await allocateByGender(maleStudents, "male")
    const femaleCount = await allocateByGender(femaleStudents, "female")

    await connection.commit()
    return successResponse(
      res,
      { maleAllocations: maleCount, femaleAllocations: femaleCount },
      "Allocation process completed successfully",
    )
  } catch (error) {
    await connection.rollback()
    console.error("[v0] Allocation error:", error.message)
    return errorResponse(res, "Allocation process failed", 500)
  } finally {
    connection.release()
  }
}

export const getAllocations = async (req, res) => {
  try {
    const { gender, block } = req.query
    let query = `
      SELECT al.*, u.full_name, u.student_id, u.gender, u.department, r.room_number, r.block_name 
      FROM allocations al 
      JOIN users u ON al.user_id = u.id 
      JOIN rooms r ON al.room_id = r.id
      WHERE 1=1
    `
    const params = []

    if (gender) {
      query += " AND u.gender = ?"
      params.push(gender)
    }
    if (block) {
      query += " AND r.block_name = ?"
      params.push(block)
    }

    const [results] = await db.execute(query, params)
    return successResponse(res, results)
  } catch (error) {
    console.error("[v0] Get allocations error:", error.message)
    return errorResponse(res, "Failed to fetch allocations", 500)
  }
}

export const getStudentAllocation = async (req, res) => {
  try {
    const [results] = await db.execute(
      `SELECT al.*, r.room_number, r.block_name 
       FROM allocations al 
       JOIN rooms r ON al.room_id = r.id 
       WHERE al.user_id = ?`,
      [req.user.id],
    )

    if (results.length === 0) {
      return successResponse(res, null, "No allocation found for this student")
    }

    return successResponse(res, results[0])
  } catch (error) {
    console.error("[v0] Get student allocation error:", error.message)
    return errorResponse(res, "Failed to fetch allocation", 500)
  }
}
