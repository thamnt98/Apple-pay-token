const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (like index.html) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Log environment variables for debugging (without exposing sensitive values)
console.log('Environment variables check:');
console.log('- ADYEN_API_KEY:', process.env.ADYEN_API_KEY ? 'SET' : 'NOT SET');
console.log('- DOMAIN_NAME:', process.env.DOMAIN_NAME ? 'SET' : 'NOT SET');
console.log('- ADYEN_MERCHANT_IDENTIFIER:', process.env.ADYEN_MERCHANT_IDENTIFIER ? 'SET' : 'NOT SET');

// Endpoint để xử lý Apple Pay merchant validation
app.post('/validate-merchant', async (req, res) => {
    console.log('Received merchant validation request');
    
    // Validate required environment variables
    if (!process.env.ADYEN_API_KEY) {
        console.error('ADYEN_API_KEY is not set');
        return res.status(500).json({ error: 'Missing ADYEN_API_KEY configuration' });
    }
    
    if (!process.env.DOMAIN_NAME) {
        console.error('DOMAIN_NAME is not set');
        return res.status(500).json({ error: 'Missing DOMAIN_NAME configuration' });
    }
    
    if (!process.env.ADYEN_MERCHANT_IDENTIFIER) {
        console.error('ADYEN_MERCHANT_IDENTIFIER is not set');
        return res.status(500).json({ error: 'Missing ADYEN_MERCHANT_IDENTIFIER configuration' });
    }

    try {
        console.log('Sending request to Adyen API...');
        const requestBody = {
            displayName: 'My Demo Store',
            domainName: process.env.DOMAIN_NAME,
            merchantIdentifier: process.env.ADYEN_MERCHANT_IDENTIFIER,
        };
        
        console.log('Request body:', JSON.stringify(requestBody));
        
        const adyenResponse = await fetch('https://checkout-test.adyen.com/v68/applePay/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': process.env.ADYEN_API_KEY,
            },
            body: JSON.stringify(requestBody),
        });

        const text = await adyenResponse.text();
        console.log('Adyen API response status:', adyenResponse.status);
        
        if (!adyenResponse.ok) {
            console.error('Adyen API returned error:', text);
            return res.status(adyenResponse.status).json({ error: `Adyen API error: ${text}` });
        }

        try {
            const merchantSession = JSON.parse(text);
            console.log('Merchant session received successfully');
            res.json(merchantSession);
        } catch (parseError) {
            console.error('Error parsing Adyen API response:', parseError);
            res.status(500).json({ error: 'Invalid JSON response from Adyen API', details: text });
        }
    } catch (e) {
        console.error('Error calling Adyen API:', e);
        res.status(500).json({ error: `Error calling Adyen API: ${e.message}` });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
    console.log(`Make sure to set the required environment variables in a .env file:`);
    console.log(`- ADYEN_API_KEY`);
    console.log(`- DOMAIN_NAME`);
    console.log(`- ADYEN_MERCHANT_IDENTIFIER`);
});
