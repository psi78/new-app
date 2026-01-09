// Native fetch in Node 25

async function testLogin() {
    try {
        console.log("Testing sysadmin login...");
        const response = await fetch('http://localhost:3000/api/adminLogin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_id: 'sysadmin',
                password: 'admin123'
            })
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));

    } catch (err) {
        console.error("Fetch error:", err);
    }
}

testLogin();
