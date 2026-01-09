import db from "../config/database.js"
import { successResponse, errorResponse } from "../utils/response.js"

export const getAllRooms = async (req, res) => {
  try {
    const { block, status, gender } = req.query
    let query = "SELECT * FROM rooms WHERE 1=1"
    const params = []

    if (block) {
      query += " AND block_name = ?"
      params.push(block)
    }
    if (status) {
      query += " AND status = ?"
      params.push(status)
    }
    if (gender) {
      query += " AND gender_type = ?"
      params.push(gender)
    }

    const [rooms] = await db.execute(query, params)
    return successResponse(res, rooms)
  } catch (error) {
    console.error("[v0] Get rooms error:", error.message)
    return errorResponse(res, "Failed to fetch rooms", 500)
  }
}

export const addRoom = async (req, res) => {
  try {
    const { roomNumber, blockName, genderType, capacity } = req.body

    const [result] = await db.execute(
      "INSERT INTO rooms (room_number, block_name, gender_type, capacity, status) VALUES (?, ?, ?, ?, 'empty')",
      [roomNumber, blockName, genderType, capacity],
    )

    return successResponse(res, { roomId: result.insertId }, "Room added successfully", 201)
  } catch (error) {
    console.error("[v0] Add room error:", error.message)
    return errorResponse(res, "Failed to add room", 500)
  }
}

export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params
    const { roomNumber, blockName, genderType, capacity, status } = req.body

    const [result] = await db.execute(
      "UPDATE rooms SET room_number = ?, block_name = ?, gender_type = ?, capacity = ?, status = ? WHERE id = ?",
      [roomNumber, blockName, genderType, capacity, status, id],
    )

    if (result.affectedRows === 0) {
      return errorResponse(res, "Room not found", 404)
    }

    return successResponse(res, null, "Room updated successfully")
  } catch (error) {
    console.error("[v0] Update room error:", error.message)
    return errorResponse(res, "Failed to update room", 500)
  }
}

export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params

    // Check if room has students
    const [allocations] = await db.execute("SELECT id FROM allocations WHERE room_id = ?", [id])
    if (allocations.length > 0) {
      return errorResponse(res, "Cannot delete room with allocated students", 400)
    }

    const [result] = await db.execute("DELETE FROM rooms WHERE id = ?", [id])

    if (result.affectedRows === 0) {
      return errorResponse(res, "Room not found", 404)
    }

    return successResponse(res, null, "Room deleted successfully")
  } catch (error) {
    console.error("[v0] Delete room error:", error.message)
    return errorResponse(res, "Failed to delete room", 500)
  }
}
