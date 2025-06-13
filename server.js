// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const crypto = require('crypto');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const ENCRYPT_KEY = Buffer.from(process.env.ENCRYPT_KEY, 'hex');
function decrypt(encrypted) {
    try {

        if (!encrypted || typeof encrypted !== 'string') {
            throw new Error('Encrypted payload is invalid or not a string');
        }

        const parts = encrypted.split(':');
        if (parts.length !== 2) {
            throw new Error('Encrypted payload format invalid (missing :)');
        }

        const [ivHex, dataHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const encryptedText = Buffer.from(dataHex, 'hex');

        if (iv.length !== 16) throw new Error('Invalid IV length');

        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPT_KEY, iv);
        const decrypted = Buffer.concat([
            decipher.update(encryptedText),
            decipher.final()
        ]);
        return decrypted.toString();
    } catch (err) {
        console.error('❌ Decryption error:', err.message);
        throw err;
    }
}

app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', (socket) => {
    console.log('✅ Client connected');

    socket.on('message', (data) => {
        // convert data to string if it's a Buffer
        if (Buffer.isBuffer(data)) {
            data = data.toString();
        }
        // log the data to the console
        // console.log('📩 Data:', data)

        const decryptedJson = decrypt(data);
        const dataJSON = JSON.parse(decryptedJson);

        console.log('📥 Decrypted JSON:', dataJSON);
        ;
        // broadcast to all frontend clients if needed
        wss.clients.forEach((client) => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    status: 'success',
                    message: 'Decrypted data received'
                }));
            }
        });
    });
});

server.listen(3001, () => {
    console.log('🚀 Server listening on port 3001');
});

