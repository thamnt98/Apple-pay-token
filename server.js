const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Client, Config } = require('@adyen/api-library');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

const config = new Config();
config.apiKey = process.env.ADYEN_API_KEY;
const client = new Client({ config });
client.setEnvironment("TEST"); // Use "LIVE" for production

app.post('/api/getClientKey', async (req, res) => {
    try {
        res.json({ clientKey: process.env.ADYEN_CLIENT_KEY });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to get client key' });
    }
});

app.post('/api/sendTokenToWebhook', async (req, res) => {
    try {
        const { token, paymentData } = req.body;
        
        // Send to webhook.site
        const webhookResponse = await fetch('https://webhook.site/c37ecbc0-d876-4b23-99b8-27d428d713e6', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                applePayToken: token,
                paymentData: paymentData,
                timestamp: new Date().toISOString()
            })
        });

        if (!webhookResponse.ok) {
            throw new Error('Webhook request failed');
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Failed to send to webhook' });
    }
});

// Create certificates directory if it doesn't exist
const certsDir = path.join(__dirname, 'certificates');
if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir);
}

const PORT = process.env.PORT || 3000;

// Check if certificates exist
const certPath = path.join(certsDir, 'cert.pem');
const keyPath = path.join(certsDir, 'key.pem');

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.log('SSL certificates not found. Please run the following commands to generate them:');
    console.log('\nmkdir certificates');
    console.log('openssl req -x509 -newkey rsa:2048 -keyout certificates/key.pem -out certificates/cert.pem -days 365 -nodes -subj "/CN=localhost"\n');
    process.exit(1);
}

const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
};

https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
}); 