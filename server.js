require('dotenv').config();
const express = require('express');
const { Client, Config } = require('@adyen/api-library');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Initialize Adyen client
const config = new Config();
config.apiKey = process.env.ADYEN_API_KEY;
const client = new Client({ config });
client.setEnvironment("TEST");

app.get('/api/config', (req, res) => {
  res.json({
    clientKey: process.env.ADYEN_CLIENT_KEY
  });
});

app.get('/api/initiate-apple-pay', async (req, res) => {
  try {
    const session = {
      merchantIdentifier: process.env.APPLE_PAY_MERCHANT_ID || '000000000304291',
      displayName: 'Adyen Test merchant',
      initiative: 'web',
      initiativeContext: 'localhost:3000',
      merchantCapabilities: ['supports3DS', 'supportsCredit', 'supportsDebit'],
      supportedNetworks: ['visa', 'masterCard', 'amex'],
      countryCode: 'US',
      currencyCode: 'USD',
      total: {
        label: 'Demo Payment',
        type: 'final',
        amount: '10.00'
      }
    };
    
    res.json(session);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/submit-apple-pay', async (req, res) => {
  try {
    const { token } = req.body;
    
    // Send token to webhook
    const webhookResponse = await fetch(process.env.WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ applePayToken: token })
    });

    res.json({ success: true, webhookResponse: await webhookResponse.json() });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 