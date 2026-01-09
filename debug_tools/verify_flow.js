const { pool } = require('./database/config');
const bcrypt = require('bcryptjs');

async function testRegistrationFlow() {
    const testId = `TEST_USER_${Date.now()}`;
    const testPass = 'mypassword123';

    console.log(`\n=== 1. Simulating Registration for Student ID: ${testId} ===`);

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insert into students (Profile Data)
        console.log("Inserting into 'students' table...");
        await connection.query(
            `INSERT INTO students (student_id, full_name, gender, department, academic_year, phone, residence_category) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [testId, "Test Student", "Male", "Software Eng", 3, "0911223344", ""]
        );

        // 2. Hash Password (mimic server.js)
        const hashedPassword = await bcrypt.hash(testPass, 10);

        // 3. Insert into student_accounts (Login Credentials)
        console.log("Inserting into 'student_accounts' table...");
        await connection.query(
            `INSERT INTO student_accounts (student_id, full_name, gender, academic_year, department, phone, password) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [testId, "Test Student", "Male", 3, "Software Eng", "0911223344", hashedPassword]
        );

        await connection.commit();
        console.log("✅ Registration Successful (Data committed to DB)");

    } catch (error) {
        await connection.rollback();
        console.error("❌ Registration Failed:", error);
        process.exit(1);
    } finally {
        connection.release();
    }

    console.log(`\n=== 2. Simulating Login for Student ID: ${testId} ===`);

    // Check DB for account
    const [accounts] = await pool.query("SELECT * FROM student_accounts WHERE student_id = ?", [testId]);

    if (accounts.length === 0) {
        console.error("❌ Login Failed: User not found in DB");
    } else {
        const user = accounts[0];
        const isMatch = await bcrypt.compare(testPass, user.password);
        if (isMatch) {
            console.log("✅ Login Successful: Password matches hash in DB");
        } else {
            console.error("❌ Login Failed: Password hash mismatch");
        }
    }

    console.log(`\n=== 3. Simulating Profile Fetch for Student ID: ${testId} ===`);

    // Fetch profile
    const [profiles] = await pool.query("SELECT * FROM students WHERE student_id = ?", [testId]);

    if (profiles.length === 0) {
        console.error("❌ Profile Fetch Failed: Student record missing");
    } else {
        console.log("✅ Profile Data Found:", profiles[0]);
    }

    // Cleanup (Optional - keep it to verify in workbench if needed, or delete)
    // await pool.query("DELETE FROM student_accounts WHERE student_id = ?", [testId]);
    // await pool.query("DELETE FROM students WHERE student_id = ?", [testId]);

    process.exit(0);
}

testRegistrationFlow();
