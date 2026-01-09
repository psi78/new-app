const bcrypt = require("bcryptjs");

const newHash = "$2a$10$l96gCxmSBBAv4mFys5LQSOfDZuXjyKxKQ1PaDF4agpTED0.E2aNrq";
const password = "admin123";

async function test() {
    const isMatch = await bcrypt.compare(password, newHash);
    console.log(`Password: ${password}`);
    console.log(`New Hash: ${newHash}`);
    console.log(`Match: ${isMatch ? "✅ SUCCESS" : "❌ FAILED"}`);
}

test();
