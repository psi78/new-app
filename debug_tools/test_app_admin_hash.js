const bcrypt = require("bcryptjs");

const appAdminHash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
const passwords = ["admin123", "password123", "app_admin", "admin", ""];

async function test() {
    console.log("Testing app_admin hash against common passwords:");
    console.log(`Hash: ${appAdminHash}\n`);

    for (const pwd of passwords) {
        const isMatch = await bcrypt.compare(pwd, appAdminHash);
        console.log(`Password: "${pwd}" -> ${isMatch ? "✅ MATCH" : "❌ no match"}`);
    }
}

test();
