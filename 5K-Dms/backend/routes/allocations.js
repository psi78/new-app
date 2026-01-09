import express from "express"
import { runAllocationProcess, getAllocations, getStudentAllocation } from "../controllers/allocation-controller.js"
import { authenticateToken, authorizeRole } from "../middleware/auth.js"

const router = express.Router()

router.post("/allocate", authenticateToken, authorizeRole("system_admin"), runAllocationProcess)
router.get("/allocations", authenticateToken, authorizeRole("dorm_manager", "system_admin"), getAllocations)
router.get("/my-allocation", authenticateToken, authorizeRole("student"), getStudentAllocation)

export default router
