import express from "express"
import { createPhase, updatePhaseStatus, getPhases } from "../controllers/phase-controller.js"
import { authenticateToken, authorizeRole } from "../middleware/auth.js"

const router = express.Router()

router.get("/phases", authenticateToken, authorizeRole("system_admin"), getPhases)
router.post("/phases", authenticateToken, authorizeRole("system_admin"), createPhase)
router.patch("/phases/:id", authenticateToken, authorizeRole("system_admin"), updatePhaseStatus)

export default router
