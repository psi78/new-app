const http = require('http');

const data = JSON.stringify({
    registrarIds: ['STU_001', 'STU_003'] // Some IDs from the SQL dump
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/registrar/match',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (error) => {
    console.error('Test Request Error:', error.message);
});

req.write(data);
req.end();
