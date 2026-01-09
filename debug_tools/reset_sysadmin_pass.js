const bcrypt = require("bcryptjs");
const { query } = require("./database/config");

async function resetPassword() {
    try {
        const password = "admin123";
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`Resetting password for sysadmin to: ${password}`);
        console.log(`New hash: ${hashedPassword}`);

        const result = await query(
            "UPDATE admin_registry SET password = ? WHERE admin_id = ?",
            [hashedPassword, "sysadmin"]
        );

        if (result.affectedRows > 0) {
            console.log("Password reset successful!");
        } else {
            console.log("Admin 'sysadmin' not found in database.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Error resetting password:", error);
        process.exit(1);
    }
}

resetPassword();
