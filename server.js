require('dotenv').config();
const express = require('express');
const { Client, Config, CheckoutAPI } = require('@adyen/api-library');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Validate required environment variables
const requiredEnvVars = [
  'ADYEN_API_KEY',
  'ADYEN_CLIENT_KEY',
  'ADYEN_MERCHANT_ACCOUNT',
  'APPLE_PAY_MERCHANT_ID',
  'DOMAIN_NAME',
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

// Serve Apple Pay domain association file
app.get('/.well-known/apple-developer-merchantid-domain-association', (req, res) => {
  console.log('Serving Apple Pay domain association file');
  const filePath = path.join(__dirname, 'public', '.well-known', 'apple-developer-merchantid-domain-association');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    console.error('Apple Pay domain association file not found at:', filePath);
    res.status(404).send('Domain association file not found');
  }
});

app.get('/api/config', (req, res) => {
  console.log('Sending configuration to client');
  res.json({
    clientKey: process.env.ADYEN_CLIENT_KEY,
    merchantIdentifier: process.env.APPLE_PAY_MERCHANT_ID,
    merchantName: process.env.MERCHANT_NAME ? process.env.MERCHANT_NAME : 'Adyen Test Merchant'
  });
});

app.post('/api/initiate-apple-pay', async (req, res) => {
  try {
    console.log('Initiating Apple Pay session with config:', {
      displayName: process.env.MERCHANT_NAME,
      domainName: process.env.DOMAIN_NAME,
      merchantIdentifier: process.env.APPLE_PAY_MERCHANT_ID
    });

    const response = await checkout.applePaySessions({
      displayName: process.env.MERCHANT_NAME,
      domainName: process.env.DOMAIN_NAME,
      merchantIdentifier: process.env.APPLE_PAY_MERCHANT_ID
    });
    
    console.log('Apple Pay Session Response:', response);
    res.json(response);
  } catch (error) {
    console.error('Apple Pay Session Error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : 'No response data'
    });
    res.status(500).json({ 
      error: error.message,
      details: error.response ? error.response.data : null
    });
  }
});

app.post('/api/submit-apple-pay', async (req, res) => {
  try {
    console.log('Received Apple Pay token submission');
    const { token } = req.body;
    
    if (!token) {
      throw new Error('No token provided');
    }

    console.log('Token received:', JSON.stringify(token, null, 2));

    // Create a payment session with Adyen
    const paymentResponse = await checkout.payments({
      amount: {
        currency: 'USD',
        value: 1000 // $10.00
      },
      reference: `apple-pay-${Date.now()}`,
      paymentMethod: token,
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
      channel: 'Web',
      returnUrl: process.env.DOMAIN_NAME.startsWith('localhost') 
        ? 'http://localhost:3000' 
        : process.env.DOMAIN_NAME
    });

    console.log('Payment Response:', paymentResponse);
    res.json(paymentResponse);
  } catch (error) {
    console.error('Payment Error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : 'No response data'
    });
    res.status(500).json({ 
      error: error.message,
      details: error.response ? error.response.data : null
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment:', {
    nodeEnv: process.env.NODE_ENV,
    domain: process.env.DOMAIN_NAME,
    merchantName: process.env.MERCHANT_NAME,
    hasApiKey: !!process.env.ADYEN_API_KEY,
    hasClientKey: !!process.env.ADYEN_CLIENT_KEY,
    hasMerchantAccount: !!process.env.ADYEN_MERCHANT_ACCOUNT,
    hasAppleMerchantId: !!process.env.APPLE_PAY_MERCHANT_ID
  });
}); 