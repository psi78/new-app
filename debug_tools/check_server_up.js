const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/adminLogin', // Use the actual path we are testing
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, res => {
    console.log(`StatusCode: ${res.statusCode}`);
    res.on('data', d => {
        process.stdout.write(d);
    });
});

req.on('error', error => {
    console.error('Connection Error:', error.message);
});

// Send empty body just to trigger 400 Bad Request, verifying server is UP
req.write(JSON.stringify({}));
req.end();
