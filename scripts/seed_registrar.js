const { query, pool } = require('../database/config');

async function seedRegistrar() {
    console.log("🌱 Seeding Registrar Records...");

    try {
        // 1. Drop and Create the table to ensure schema matches
        await query("DROP TABLE IF EXISTS registrar_records");
        await query(`
      CREATE TABLE registrar_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        gender VARCHAR(10) NOT NULL,
        department VARCHAR(100) NOT NULL,
        academic_year INT NOT NULL,
        residence_category VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log("✅ Table 'registrar_records' recreated.");

        // 2. Define Students
        const students = [
            // --- 10 Demo Students ---
            ['UGR/0001/16', 'Abebe Kebede', 'Male', 'Computer Science', 1, 'Rural'],
            ['UGR/0002/16', 'Sara Mohammed', 'Female', 'Medicine', 1, 'Rural'],
            ['UGR/0003/16', 'Chala Tadesse', 'Male', 'Electrical Engineering', 2, 'Addis Ababa'],
            ['UGR/0004/16', 'Tigist Hailu', 'Female', 'Civil Engineering', 2, 'Rural'],
            ['UGR/0005/16', 'Dawit Girma', 'Male', 'Architecture', 3, 'Rural'],
            ['UGR/0006/16', 'Hana Ali', 'Female', 'Accounting', 3, 'Addis Ababa'],
            ['UGR/0007/16', 'Yonas Tesfaye', 'Male', 'Economics', 4, 'Rural'],
            ['UGR/0008/16', 'Martha Bekele', 'Female', 'Law', 4, 'Rural'],
            ['UGR/0009/16', 'Solomon Desta', 'Male', 'Mechanical Engineering', 5, 'Addis Ababa'],
            ['UGR/0010/16', 'Genet Wolde', 'Female', 'Software Engineering', 5, 'Rural'],

            // --- CSV Imports (Manual Sync) ---
            ['UGR/7570/16', 'Israel S', 'Male', 'Software Engineering', 4, 'Addis Ababa'],
            ['UGR/1111/16', 'Test User 1', 'Male', 'Civil Engineering', 4, 'Rural'],
            ['UGR/2222/16', 'Test User 2', 'Male', 'Mechanical Engineering', 3, 'Rural'],
            ['ugr/9999/99', 'Ghost User', 'Male', 'Architecture', 5, 'Addis Ababa'],

            // --- Extra Checks (User Complaints) ---
            ['UGR/1111/16/2016', 'Test User 1 (Var)', 'Male', 'Civil Engineering', 2, 'Rural']
        ];

        // 3. Insert Data
        for (const s of students) {
            try {
                await query(
                    "INSERT INTO registrar_records (student_id, full_name, gender, department, academic_year, residence_category) VALUES (?, ?, ?, ?, ?, ?)",
                    s
                );
            } catch (err) {
                // Ignore dupes if they happen between sections
                if (err.code !== 'ER_DUP_ENTRY') console.error(`Failed to insert ${s[0]}:`, err.message);
            }
        }

        console.log(`✅ Successfully inserted ${students.length} safe students into 'registrar_records'.`);

    } catch (error) {
        console.error("❌ Error seeding registrar records:", error);
    } finally {
        process.exit();
    }
}

seedRegistrar();
