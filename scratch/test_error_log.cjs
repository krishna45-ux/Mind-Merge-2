const http = require('http');

const data = JSON.stringify({
  name: 'TestError',
  message: 'This is a test client crash triggered from node test script',
  stack: 'Error: This is a test client crash\n    at Object.<anonymous> (scratch/test_error_log.cjs:3:14)',
  componentStack: '\n    in App\n    in StrictMode',
  url: 'http://localhost:3000/test',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NodeJS Test Script',
  timestamp: new Date().toISOString()
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/log-error',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Response:', body);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
