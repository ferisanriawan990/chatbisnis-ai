const http = require('http');

const data = JSON.stringify({
  event: 'message',
  payload: {
    from: '6280000000000@s.whatsapp.net',
    body: 'halo test debug',
    notifyName: 'User Test',
    fromMe: false,
    isGroup: false
  },
  session: 'waha_plus_597022d8-bf97-40c2-9852-c840f3cd60b8'
});

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/webhooks/waha',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-secret': 'a7f3c9e2b1d4f6a8c0e9b2a5d7f1c3e8b6a2d9f0c4e7b1a8d5c2f9e6a3b0d1c8',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});

req.on('error', console.error);
req.write(data);
req.end();
