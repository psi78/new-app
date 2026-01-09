const API_URL = 'http://127.0.0.1:3000';

async function checkApp(studentId) {
    console.log(`Checking app for: ${studentId}`);
    try {
        const url = `${API_URL}/applications/student/${encodeURIComponent(studentId)}`;
        console.log(`URL: ${url}`);
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            console.log('Found:', data.applicationId, data.status);
        } else {
            console.log('Status:', res.status, res.statusText);
            const txt = await res.text();
            console.log('Body:', txt);
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

async function run() {
    await checkApp('ugr/2222/16'); // Lowercase
    await checkApp('UGR/2222/16'); // Uppercase
    await checkApp('ugr/3333/16');
}

run();
