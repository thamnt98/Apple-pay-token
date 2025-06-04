require('dotenv').config();
const express = require('express');
const { Client, Config, CheckoutAPI } = require('@adyen/api-library');
const fetch = require('node-fetch');
const cors = require('cors');

// Validate required environment variables
const requiredEnvVars = [
  'ADYEN_API_KEY',
  'ADYEN_CLIENT_KEY',
  'ADYEN_MERCHANT_ACCOUNT',
  'APPLE_PAY_MERCHANT_ID',
  'DOMAIN_NAME'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} is not set in environment variables`);
    process.exit(1);
  }
}

const app = express();

// Configure CORS
app.use(cors({
  origin: process.env.DOMAIN_NAME.startsWith('localhost') ? 'http://localhost:3000' : process.env.DOMAIN_NAME,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
}));

app.use(express.json());
app.use(express.static('public'));

// Initialize Adyen client
const config = new Config();
config.apiKey = process.env.ADYEN_API_KEY;
config.environment = "TEST";
const client = new Client({ config });
const checkout = new CheckoutAPI(client);

app.get('/api/config', (req, res) => {
  res.json({
    clientKey: process.env.ADYEN_CLIENT_KEY,
    merchantIdentifier: process.env.APPLE_PAY_MERCHANT_ID,
    merchantName: process.env.MERCHANT_NAME || 'Your Store Name'
  });
});

app.post('/api/initiate-apple-pay', async (req, res) => {
  try {
    const response = await checkout.applePaySessions({
      displayName: process.env.MERCHANT_NAME || "Your Store Name",
      domainName: process.env.DOMAIN_NAME,
      merchantIdentifier: process.env.APPLE_PAY_MERCHANT_ID
    });
    
    console.log('Apple Pay Session Response:', response);
    res.json(response);
  } catch (error) {
    console.error('Apple Pay Session Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add validation URL endpoint
app.post('/.well-known/apple-developer-merchantid-domain-association', async (req, res) => {
  try {
    const response = await checkout.applePaySessions({
      displayName: process.env.MERCHANT_NAME || "Your Store Name",
      domainName: process.env.DOMAIN_NAME,
      merchantIdentifier: process.env.APPLE_PAY_MERCHANT_ID
    });
    res.send(response);
  } catch (error) {
    console.error('Domain Association Error:', error);
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