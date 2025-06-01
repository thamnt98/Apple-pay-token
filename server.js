const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const { Client, Config, CheckoutAPI } = require('@adyen/api-library');

const app = express();
const PORT = process.env.PORT || 3000;

// Adyen config
const config = new Config();
config.apiKey = process.env.ADYEN_API_KEY;
const client = new Client({ config });
client.setEnvironment('TEST');
const checkout = new CheckoutAPI(client);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Log env check
console.log('Env variables check:');
console.log('- ADYEN_API_KEY:', process.env.ADYEN_API_KEY ? 'SET' : 'NOT SET');
console.log('- ADYEN_MERCHANT_ACCOUNT:', process.env.ADYEN_MERCHANT_ACCOUNT ? 'SET' : 'NOT SET');

app.post('/validate-merchant', async (req, res) => {
  const { validationUrl } = req.body;

  if (!validationUrl) {
    return res.status(400).json({ error: 'Missing validationUrl in request body' });
  }
  if (!process.env.ADYEN_API_KEY || !process.env.ADYEN_MERCHANT_ACCOUNT) {
    return res.status(500).json({ error: 'Missing ADYEN_API_KEY or ADYEN_MERCHANT_ACCOUNT environment variable' });
  }

  try {
    const response = await client.httpClient.request(
      'POST',
      '/applePay/sessions',
      {
        merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
        validationUrl: validationUrl
      }
    );
    res.json(response);
  } catch (error) {
    console.error('Error in Adyen Apple Pay session:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
