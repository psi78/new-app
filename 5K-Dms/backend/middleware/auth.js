import jwt from "jsonwebtoken"

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, message: "Access token required" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ success: false, message: "Invalid or expired token" })
  }
}

export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" })
    }

    const userRole = req.user.role

    // Map role names
    const roleMap = {
      student: "student",
      dorm_manager: "dorm_manager",
      system_admin: "system_admin",
    }

    const normalizedUserRole = roleMap[userRole] || userRole

    if (!allowedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({ success: false, message: "Insufficient permissions" })
    }

    next()
  }
}

