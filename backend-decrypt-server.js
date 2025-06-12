// 📦 backend-decrypt-server.js

const express = require('express');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const ENCRYPT_KEY = Buffer.from(process.env.ENCRYPT_KEY, 'hex'); // 32 bytes

function decrypt(encrypted) {
  const [ivHex, dataHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPT_KEY, iv);
  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final()
  ]);
  return decrypted.toString();
}

app.post('/decrypt', (req, res) => {
  try {
    const { encrypted } = req.body;
    const decryptedJson = decrypt(encrypted);
    const data = JSON.parse(decryptedJson);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Decrypt failed', error: err.message });
  }
});

const httpsServer = https.createServer({
  key: fs.readFileSync('./certs/key.pem'),
  cert: fs.readFileSync('./certs/cert.pem')
}, app);

httpsServer.listen(3443, () => {
  console.log('🔐 Backend Decrypt Server running at https://api.localhost.lan:3443');
});