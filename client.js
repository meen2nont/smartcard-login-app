// client.js
const WebSocket = require('ws');
const { Reader } = require('thaismartcardreader.js');

const reader = new Reader();
const ws = new WebSocket('ws://192.168.1.157:3001');

ws.on('open', () => {
    console.log('Connected to Server');
});

reader.on('device-activated', (event) => {
    console.log('✅ Device Activated:', event.name);
});

reader.on('device-deactivated', (event) => {
    console.log('❌ Device Deactivated:', event.name);
}
);

reader.on('card-inserted', async (card) => {
    try {
        console.log('📇 Card Inserted:', card);

        const cid = await card.getCid();
        const thName = await card.getNameTH();
        const enName = await card.getNameEN();

        const payload = {
            cid,
            THName: `${thName.prefix} ${thName.firstname} ${thName.lastname}`,
            ENName: `${enName.prefix} ${enName.firstname} ${enName.lastname}`
        };

        console.log('📇 Sending to Server:', payload);
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(payload));
        }
    } catch (err) {
        console.error('Error reading card:', err);
    }
});

reader.on('card-removed', (card) => {
    console.log('❌ Card Removed:', card);
}
);