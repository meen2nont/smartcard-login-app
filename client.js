// client.js
const WebSocket = require('ws');
const { Reader } = require('thaismartcardreader.js');
const os = require('os');
const interfaces = os.networkInterfaces();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

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

// Get External IP address
async function getExternalIp() {
    try {
        const response = await axios.get('https://api.ipify.org?format=json');
        if (response.status !== 200) {
            throw new Error(`Failed to fetch external IP, status code: ${response.status}`);
        }
        return response.data.ip || 'Unknown External IP';
        
    } catch (error) {
        console.error('Error fetching external IP:', error);
        return 'Unknown External IP';
    }
}

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
        externalIp: await getExternalIp(),
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

        // Convert uuid to number 16digit
        const uuidToNumber = (uuid) => {
            return parseInt(uuid.replace(/-/g, '').slice(0, 16), 16);
        };

        const payload = {
            reqId: uuidToNumber(uuidv4()),
            cid,
            THName: `${thName.prefix} ${thName.firstname} ${thName.lastname}`,
            ENName: `${enName.prefix} ${enName.firstname} ${enName.lastname}`,
            clientInfo: await getClientInfo()
        };

        console.log('📇 Sending to Server:', payload);

        // Check if WebSocket is open before sending
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