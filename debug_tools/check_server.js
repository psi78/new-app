const http = require('http');

http.get('http://localhost:3000/applications', (res) => {
    console.log('Status:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Data count:', JSON.parse(data).length);
        process.exit(0);
    });
}).on('error', (err) => {
    console.error('Server down:', err.message);
    process.exit(1);
});
