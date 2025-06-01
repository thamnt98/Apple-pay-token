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
    const response = await checkout.sessions({
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
      applePaySessionRequest: {
        displayName: 'My Demo Store',
        domainName: process.env.DOMAIN_NAME,
        merchantIdentifier: process.env.ADYEN_MERCHANT_IDENTIFIER,
      },
    });

    res.json(response);
  } catch (e) {
    console.error('Error in Adyen Apple Pay session:', e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
