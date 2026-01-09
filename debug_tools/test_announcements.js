async function testAnnouncements() {
    const API_URL = 'http://localhost:3000';
    try {
        console.log("1. Testing GET /api/announcement/latest...");
        const resGet = await fetch(`${API_URL}/api/announcement/latest`);
        const dataGet = await resGet.json();
        console.log("Latest:", JSON.stringify(dataGet, null, 2));

        console.log("\n2. Testing POST /api/announcement...");
        const msg = "Automated test from Antigravity " + new Date().toISOString();
        const resPost = await fetch(`${API_URL}/api/announcement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        });
        const dataPost = await resPost.json();
        console.log("Post Response:", dataPost);

        if (dataPost.success) {
            console.log("\n3. Verifying new announcement is latest...");
            const resVerify = await fetch(`${API_URL}/api/announcement/latest`);
            const dataVerify = await resVerify.json();
            console.log("New Latest:", dataVerify.message);
            if (dataVerify.message === msg) {
                console.log("\n✅ SUCCESS: Announcement fix verified!");
            } else {
                console.log("\n❌ FAILURE: Message mismatch!");
            }
        }
    } catch (err) {
        console.error("Test error:", err);
    }
}

testAnnouncements();
