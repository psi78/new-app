const API_URL = 'http://127.0.0.1:3000';

async function checkAllApps() {
    console.log('Checking ALL apps...');
    try {
        const url = `${API_URL}/applications`;
        console.log(`URL: ${url}`);
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            console.log(`Found ${data.length} applications.`);
            data.forEach(app => {
                console.log(`- ${app.applicationId} (${app.studentId}): ${app.status}`);
            });
        } else {
            console.log('Status:', res.status, res.statusText);
            const txt = await res.text();
            console.log('Body:', txt);
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

checkAllApps();
