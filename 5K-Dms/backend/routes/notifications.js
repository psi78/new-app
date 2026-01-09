import express from "express"
import { sendAnnouncement, getAnnouncements } from "../controllers/notification-controller.js"
import { authenticateToken, authorizeRole } from "../middleware/auth.js"

const router = express.Router()

router.post("/publicAnnouncements", authenticateToken, authorizeRole("system_admin", "dorm_manager"), sendAnnouncement)
router.get("/announcements", authenticateToken, getAnnouncements)

export default router
