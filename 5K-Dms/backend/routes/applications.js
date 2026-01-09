import express from "express"
import {
  submitApplication,
  getAllApplications,
  updateApplicationStatus,
  getUserApplication,
} from "../controllers/application-controller.js"
import { authenticateToken, authorizeRole } from "../middleware/auth.js"
import { uploadApplicationDocuments } from "../middleware/upload.js"

const router = express.Router()

// Student routes
router.post(
  "/submit-application",
  authenticateToken,
  authorizeRole("student"),
  uploadApplicationDocuments,
  submitApplication,
)
router.get("/my-application", authenticateToken, authorizeRole("student"), getUserApplication)

// Admin routes
router.get("/applications", authenticateToken, authorizeRole("dorm_manager", "system_admin"), getAllApplications)
router.patch(
  "/applications/:id",
  authenticateToken,
  authorizeRole("dorm_manager", "system_admin"),
  updateApplicationStatus,
)

export default router
