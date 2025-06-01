const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { Client, CheckoutAPI } = require('@adyen/api-library');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (like index.html) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Khởi tạo Adyen client và Checkout API
const client = new Client({
  apiKey: process.env.ADYEN_API_KEY,
  environment: 'TEST',  // hoặc 'LIVE' nếu bạn chạy production
});
const checkout = new CheckoutAPI(client);

// Log env variables
console.log('Env variables:');
console.log('ADYEN_API_KEY:', process.env.ADYEN_API_KEY ? 'SET' : 'NOT SET');
console.log('ADYEN_MERCHANT_ACCOUNT:', process.env.ADYEN_MERCHANT_ACCOUNT ? 'SET' : 'NOT SET');

app.post('/validate-merchant', async (req, res) => {
  const { validationUrl } = req.body;

  if (!validationUrl) {
    return res.status(400).json({ error: 'Missing validationUrl in request body' });
  }

  if (!process.env.ADYEN_API_KEY || !process.env.ADYEN_MERCHANT_ACCOUNT) {
    return res.status(500).json({ error: 'Missing ADYEN_API_KEY or ADYEN_MERCHANT_ACCOUNT environment variable' });
  }

  try {
    const response = await checkout.applePay.sessions({
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
      validationUrl: validationUrl,
    });
    res.json(response);
  } catch (error) {
    console.error('Error in Adyen Apple Pay session:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Remember to set in your .env file:');
  console.log('- ADYEN_API_KEY');
  console.log('- ADYEN_MERCHANT_ACCOUNT');
});
