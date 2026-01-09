const mysql = require('mysql2/promise');

const dbConfig = {
    host: "localhost",
    user: "root",
    password: "Mufe22004", // Updated from config.js
    database: "dormitory_management",
};

const demoStudents = [
    { id: "UGR/1111/16", name: "Abebe Kebede", gender: "Male", dept: "Software Engineering", year: 2, cat: "Rural" },
    { id: "UGR/2222/16", name: "Sara Mohammed", gender: "Female", dept: "Computer Science", year: 2, cat: "Addis Ababa" },
    { id: "UGR/3333/16", name: "Chala Desta", gender: "Male", dept: "Electrical Engineering", year: 3, cat: "Rural" },
    { id: "UGR/4444/16", name: "Tigist Haile", gender: "Female", dept: "Civil Engineering", year: 4, cat: "Rural" },
    { id: "UGR/5555/16", name: "Dawit Alemu", gender: "Male", dept: "Mechanical Engineering", year: 2, cat: "Addis Ababa" },
    { id: "UGR/6666/16", name: "Hana Tesfaye", gender: "Female", dept: "Architecture", year: 5, cat: "Rural" },
    { id: "UGR/7777/16", name: "Yonas Berhe", gender: "Male", dept: "Information Systems", year: 3, cat: "Addis Ababa" },
    { id: "UGR/8888/16", name: "Bethelhem Assefa", gender: "Female", dept: "Medicine", year: 4, cat: "Rural" },
    { id: "UGR/9990/16", name: "Mikiyas Girma", gender: "Male", dept: "Law", year: 2, cat: "Rural" },
    { id: "UGR/9999/16", name: "Zebene Lemma", gender: "Male", dept: "Accounting", year: 3, cat: "Rural" },
    // Edge case invalid ones (commented out, but good for testing if we wanted to verify they get deleted)
    // { id: "UGR/1000/16", name: "Invalid Low", ... }, 
    // { id: "UGR/10000/16", name: "Invalid High", ... },
];

async function seed() {
    let connection;
    try {
        console.log("Connecting to DB...");
        connection = await mysql.createConnection(dbConfig);

        console.log(`Seeding ${demoStudents.length} demo students...`);

        for (const s of demoStudents) {
            // 1. Insert into students table
            await connection.execute(
                `INSERT INTO students (student_id, full_name, gender, department, academic_year, residence_category) 
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         full_name = VALUES(full_name), gender = VALUES(gender), department = VALUES(department), residence_category = VALUES(residence_category)`,
                [s.id, s.name, s.gender, s.dept, s.year, s.cat]
            );

            // 2. Insert into student_accounts (so they can login)
            // Password default: 123456
            await connection.execute(
                `INSERT INTO student_accounts (student_id, password, full_name, gender, academic_year, department)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         password = VALUES(password)`,
                [s.id, '123456', s.name, s.gender, s.year, s.dept]
            );
        }

        console.log("✅ Seeding complete!");

    } catch (err) {
        console.error("❌ Error seeding:", err);
    } finally {
        if (connection) await connection.end();
    }
}

seed();
