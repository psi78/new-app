import express from "express"
import { getAllRooms, addRoom, updateRoom, deleteRoom } from "../controllers/room-controller.js"
import { authenticateToken, authorizeRole } from "../middleware/auth.js"

const router = express.Router()

router.get("/rooms", authenticateToken, authorizeRole("dorm_manager", "system_admin"), getAllRooms)
router.post("/rooms", authenticateToken, authorizeRole("system_admin"), addRoom)
router.patch("/rooms/:id", authenticateToken, authorizeRole("system_admin"), updateRoom)
router.delete("/rooms/:id", authenticateToken, authorizeRole("system_admin"), deleteRoom)

export default router
