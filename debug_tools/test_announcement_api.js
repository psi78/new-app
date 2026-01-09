const http = require('http');

console.log("Testing Announcement API...");

// 1. Test GET
const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/announcement/latest',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`GET Status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('GET Body:', data);

        if (res.statusCode === 404) {
            console.log("Endpoint not found! Server might need restart.");
        } else if (JSON.parse(data).error) {
            console.log("DB Error likely.");
        } else {
            console.log("Endpoint is reachable.");
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
