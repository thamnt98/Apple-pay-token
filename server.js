const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const { Client, CheckoutAPI } = require('@adyen/api-library');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Khởi tạo Adyen client và Checkout API
const client = new Client({
  apiKey: process.env.ADYEN_API_KEY,
  environment: 'TEST',
});
const checkout = new CheckoutAPI(client);

app.post('/validate-merchant', async (req, res) => {
  try {
    if (!process.env.DOMAIN_NAME || !process.env.ADYEN_MERCHANT_IDENTIFIER) {
      return res.status(500).json({ error: 'Missing DOMAIN_NAME or ADYEN_MERCHANT_IDENTIFIER env variable' });
    }

    const request = {
      merchantIdentifier: process.env.ADYEN_MERCHANT_IDENTIFIER,
      domainName: process.env.DOMAIN_NAME,
      displayName: 'My Demo Store',
    };

    // Gọi SDK Adyen để tạo merchant session Apple Pay
    const response = await checkout.applePaySessions(request);

    res.json(response);
  } catch (error) {
    console.error('Error in Adyen Apple Pay session:', error);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
