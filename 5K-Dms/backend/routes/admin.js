import express from "express"
import { getAllAdmins, addAdmin, deleteAdmin } from "../controllers/admin-controller.js"
import { authenticateToken, authorizeRole } from "../middleware/auth.js"

const router = express.Router()

router.get("/admins", authenticateToken, authorizeRole("system_admin"), getAllAdmins)
router.post("/admins", authenticateToken, authorizeRole("system_admin"), addAdmin)
router.delete("/admins/:id", authenticateToken, authorizeRole("system_admin"), deleteAdmin)

export default router
