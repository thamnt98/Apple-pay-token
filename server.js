const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files (like index.html) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Endpoint để xử lý Apple Pay merchant validation
app.post('/validate-merchant', async (req, res) => {
    const { validationURL } = req.body;

    if (!validationURL) {
        return res.status(400).json({ error: 'validationURL is required' });
    }

    console.log('Received validationURL:', validationURL);
    console.log('Using ADYEN_API_KEY:', process.env.ADYEN_API_KEY ? 'SET' : 'NOT SET');

    try {
        const adyenResponse = await fetch('https://checkout-test.adyen.com/v68/applePay/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': process.env.ADYEN_API_KEY,
            },
            body: JSON.stringify({
                merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT, // tên merchant account
                displayName: 'My Demo Store',
                domainName: 'apple-pay-token-production.up.railway.app', // thay bằng domain thật đã xác thực
                validationUrl: validationURL
            }),
        });

        const text = await adyenResponse.text();

        if (!adyenResponse.ok) {
            console.error('Adyen API returned error:', text);
            return res.status(500).json({ error: text });
        }

        const merchantSession = JSON.parse(text);
        console.log('Merchant session:', merchantSession);

        res.json(merchantSession);
    } catch (e) {
        console.error('Error calling Adyen API:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// Endpoint để xử lý thanh toán
app.post('/process-payment', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Payment token is required' });
    }

    try {
        const response = await fetch('https://webhook.site/3e1a5a6d-e280-4464-8f2a-a05b70f2d0cf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });

        if (!response.ok) {
            throw new Error('Failed to send token to webhook');
        }

        res.status(200).json({ message: 'Payment processed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
