const mysql = require('mysql2/promise');

const dbConfig = {
    host: "localhost",
    user: "root",
    password: "Mufe22004",
    database: "dormitory_management",
};

async function resetAccounts() {
    let connection;
    try {
        console.log("Connecting to DB...");
        connection = await mysql.createConnection(dbConfig);

        // Deleting only the LOGIN accounts for the demo range, keeping the profile data in 'students' table.
        // This allows the "Student Registration" page to work (it won't find an existing account),
        // but the student data is there effectively as 'Registrar Data'.

        // Demo IDs are roughly UGR/1111/16 to UGR/9999/16
        console.log("Removing demo accounts from student_accounts table...");

        // Using a regex-like or range check if possible, or just targeting all starting with UGR/ and ending with /16
        // safely target the specific demo IDs we know we added, or the whole range.

        const [result] = await connection.execute(
            `DELETE FROM student_accounts 
       WHERE student_id LIKE 'UGR/%/16' 
       AND CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(student_id, '/', 2), '/', -1) AS UNSIGNED) BETWEEN 1111 AND 9999`
        );

        console.log(`✅ Deleted ${result.affectedRows} accounts. You can now register with these IDs.`);

    } catch (err) {
        console.error("❌ Error resetting:", err);
    } finally {
        if (connection) await connection.end();
    }
}

resetAccounts();
