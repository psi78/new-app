const http = require('http');
const mysql = require('mysql2/promise');

const dbConfig = {
    host: "localhost",
    user: "root",
    password: "Mufe22004",
    database: "dormitory_management",
};

async function verify() {
    let connection;
    try {
        console.log("1. Connecting to DB...");
        connection = await mysql.createConnection(dbConfig);

        // 2. Insert INVALID student
        const invalidId = "UGR/1000/16";
        console.log(`2. Inserting invalid student: ${invalidId}`);
        await connection.execute(
            `INSERT INTO students (student_id, full_name, gender, department, academic_year, residence_category) 
       VALUES (?, 'Invalid Student', 'Male', 'Test', 1, 'Rural')`,
            [invalidId]
        );

        // 3. Call Match API
        console.log("3. Calling /api/registrar/match...");
        const postData = JSON.stringify({});

        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/registrar/match',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', async () => {
                console.log("API Response:", data);

                // 4. Check if invalid student is deleted
                const [rows] = await connection.execute("SELECT * FROM students WHERE student_id = ?", [invalidId]);
                if (rows.length === 0) {
                    console.log("✅ VERIFICATION SUCCESS: Invalid student was deleted.");
                } else {
                    console.error("❌ VERIFICATION FAILURE: Invalid student still exists!");
                }
                await connection.end();
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
            connection.end();
        });

        req.write(postData);
        req.end();

    } catch (err) {
        console.error("Error:", err);
        if (connection) connection.end();
    }
}

verify();
