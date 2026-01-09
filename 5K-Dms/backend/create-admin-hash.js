// Quick script to generate password hash for admin
import bcrypt from "bcryptjs"

const password = "admin123"
const hash = await bcrypt.hash(password, 10)
console.log(`Password: ${password}`)
console.log(`Hash: ${hash}`)
console.log("\nCopy this hash to your database SQL file:")

