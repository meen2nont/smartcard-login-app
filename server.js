// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', (socket) => {
    console.log('✅ Client connected');

    socket.on('message', (data) => {
        // convert data to string if it's a Buffer
        if (Buffer.isBuffer(data)) {
            data = data.toString();
        }
        // log the data to the console
        console.log('📩 Data:', data)
        ;
        // broadcast to all frontend clients if needed
        wss.clients.forEach((client) => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    });
});

server.listen(3001, () => {
    console.log('🚀 Server listening on port 3001');
});

