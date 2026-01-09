import express from "express"
import { registerStudent, login, getProfile } from "../controllers/auth-controller.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// Public routes
router.post("/register", registerStudent)
router.post("/login", login)

// Protected routes
router.get("/profile", authenticateToken, getProfile)

export default router
