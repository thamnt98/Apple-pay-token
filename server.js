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
  'APPLE_PAY_MERCHANT_ID'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Warning: ${envVar} is not set in environment variables`);
  }
}

const app = express();

// Configure CORS
app.use(cors({
  origin: '*',  // Allow all origins in development
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
  const domain = process.env.RAILWAY_STATIC_URL || process.env.DOMAIN_NAME || req.get('host');
  console.log('Config request from domain:', domain);
  
  res.json({
    clientKey: process.env.ADYEN_CLIENT_KEY,
    merchantIdentifier: process.env.APPLE_PAY_MERCHANT_ID,
    merchantName: process.env.MERCHANT_NAME || 'Adyen Test Merchant',
    domain: domain
  });
});

app.post('/api/initiate-apple-pay', async (req, res) => {
  try {
    const domain = process.env.RAILWAY_STATIC_URL || process.env.DOMAIN_NAME || req.get('host');
    console.log('Initiating Apple Pay session for domain:', domain);

    const response = await checkout.applePaySessions({
      displayName: process.env.MERCHANT_NAME || 'Adyen Test Merchant',
      domainName: domain,
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
    console.log('Received Apple Pay submission');
    const { token, paymentData } = req.body;

    if (!token || !paymentData) {
      throw new Error('Missing payment data');
    }

    console.log('Processing payment with data:', {
      token: 'present',
      paymentData: 'present'
    });

    // Create payment with Adyen
    const payment = await checkout.payments({
      amount: {
        currency: 'USD',
        value: 1000 // $10.00
      },
      reference: `apple-pay-${Date.now()}`,
      paymentMethod: {
        type: 'applepay',
        applePayToken: paymentData
      },
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
      returnUrl: process.env.RAILWAY_STATIC_URL || process.env.DOMAIN_NAME || req.get('host'),
      channel: 'Web',
      additionalData: {
        allow3DS2: true
      }
    });

    console.log('Payment response:', payment);

    if (payment.resultCode === 'Authorised') {
      res.json({
        status: 'success',
        message: 'Payment authorized successfully',
        paymentId: payment.pspReference
      });
    } else {
      throw new Error(`Payment not authorized: ${payment.resultCode}`);
    }
  } catch (error) {
    console.error('Payment submission error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : 'No response data'
    });
    res.status(500).json({
      status: 'error',
      message: error.message,
      details: error.response ? error.response.data : null
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment:', {
    nodeEnv: process.env.NODE_ENV,
    port: PORT,
    domain: process.env.RAILWAY_STATIC_URL || process.env.DOMAIN_NAME,
    hasApiKey: !!process.env.ADYEN_API_KEY,
    hasClientKey: !!process.env.ADYEN_CLIENT_KEY,
    hasMerchantAccount: !!process.env.ADYEN_MERCHANT_ACCOUNT,
    hasAppleMerchantId: !!process.env.APPLE_PAY_MERCHANT_ID
  });
}); 