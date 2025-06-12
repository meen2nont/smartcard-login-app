// 📦 smartcard-secure-agent.js

const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const { Reader } = require('thaismartcardreader.js');
const crypto = require('crypto');
require('dotenv').config();

// Load certs (สร้างด้วย mkcert หรือ Let's Encrypt)
const server = https.createServer({
  key: fs.readFileSync('./certs/key.pem'),
  cert: fs.readFileSync('./certs/cert.pem')
});

const wss = new WebSocket.Server({ server });
const reader = new Reader();

// === CONFIG === //
const ENCRYPT_KEY = Buffer.from(process.env.ENCRYPT_KEY, 'hex'); // 32 bytes hex
const VALID_TOKEN = process.env.CLIENT_TOKEN;

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPT_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

wss.on('connection', (socket, req) => {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const token = url.searchParams.get('token');

  if (token !== VALID_TOKEN) {
    console.log('❌ Invalid token, closing connection');
    socket.close();
    return;
  }

  console.log('✅ Web client connected securely');

  reader.on('card-inserted', async (card) => {
    try {
      const cid = await card.getCid();
      const thName = await card.getNameTH();
      const enName = await card.getNameEN();

      const payload = {
        cid,
        THName: `${thName.prefix} ${thName.firstname} ${thName.lastname}`,
        ENName: `${enName.prefix} ${enName.firstname} ${enName.lastname}`,
        timestamp: new Date().toISOString()
      };

      const encrypted = encrypt(JSON.stringify(payload));
      socket.send(encrypted);

      console.log('📇 Encrypted data sent');
    } catch (err) {
      console.error('❌ Error reading card:', err);
    }
  });
});

server.listen(3002, () => {
  console.log('🔐 Secure Smartcard Agent running on https://localhost:3002');
});