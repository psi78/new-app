const bcrypt = require("bcryptjs");

const hash = "$2a$10$bxLwo4c3d6HxjD.RHafX2uNLTTCZc5FYOrC7p1qjW6/7nnPOvhueC";
const password = "admin123";

async function test() {
    const isMatch = await bcrypt.compare(password, hash);
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
    console.log(`Match: ${isMatch}`);
}

test();
