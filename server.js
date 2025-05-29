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
    console.log('Using ADYEN_API_KEY:', process.env.ADYEN_API_KEY ? 'SET' : 'NOT SET');

    try {
        const adyenResponse = await fetch('https://checkout-test.adyen.com/v68/applePay/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': process.env.ADYEN_API_KEY,
            },
            body: JSON.stringify({
                displayName: 'My Demo Store',
                domainName: process.env.DOMAIN_NAME, // thay bằng domain thật đã xác thực
                merchantIdentifier: process.env.ADYEN_MERCHANT_IDENTIFIER, // Apple Merchant ID
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

// Start the server
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
