// client.js
const WebSocket = require('ws');
const { Reader } = require('thaismartcardreader.js');
const os = require('os');
const interfaces = os.networkInterfaces();

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
});

// Get Client ip address and other info
async function getClientInfo() {
    let ipAddress = 'Unknown IP';
    for (const interfaceName in interfaces) {
        for (const iface of interfaces[interfaceName]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                ipAddress = iface.address;
                break;
            }
        }
    }

    return {
        ipAddress: ipAddress,
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
    };
}


reader.on('card-inserted', async (card) => {
    try {
        console.log('📇 Card Inserted:');

        const cid = await card.getCid();
        const thName = await card.getNameTH();
        const enName = await card.getNameEN();

        const payload = {
            cid,
            THName: `${thName.prefix} ${thName.firstname} ${thName.lastname}`,
            ENName: `${enName.prefix} ${enName.firstname} ${enName.lastname}`,
            clientInfo: await getClientInfo()
        };

        console.log('📇 Sending to Server:', payload);
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(payload));
        }
    } catch (err) {
        console.error('Error reading card:', err);
    }
});

reader.on('card-removed', (event) => {
    console.log('❌ Card Removed:', event.name);
});