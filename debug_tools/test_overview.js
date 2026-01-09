async function testOverview() {
    const API_URL = 'http://localhost:3000/api';
    try {
        console.log("Testing GET /api/applications...");
        const res = await fetch(`${API_URL}/applications`);
        if (!res.ok) {
            console.error("Error:", res.status, await res.text());
            return;
        }
        const data = await res.json();
        console.log("Response Count:", data.length);
        if (data.length > 0) {
            console.log("First Application ID:", data[0].applicationId);
            console.log("\n✅ SUCCESS: Application Overview fix verified!");
        } else {
            console.log("\n❌ FAILURE: No applications returned!");
        }
    } catch (err) {
        console.error("Test error:", err);
    }
}

testOverview();
