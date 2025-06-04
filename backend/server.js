require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();

app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// API tạo session cho Adyen
app.post('/api/create-session', async (req, res) => {
  try {
    const response = await axios.post(
      'https://checkout-test.adyen.com/v71/sessions',
      {
        amount: { currency: 'USD', value: 1000 },
        merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
        reference: 'ORDER-12345',
        returnUrl: process.env.DOMAIN_NAME, // domain này phải đúng với domain deploy
        countryCode: 'US',
        channel: 'Web',
      },
      {
        headers: {
          'X-API-Key': process.env.ADYEN_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Create session error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// API xử lý payment khi Apple Pay gửi token lên backend
app.post('/api/pay', async (req, res) => {
  try {
    const paymentResponse = await axios.post(
      'https://checkout-test.adyen.com/v71/payments',
      {
        amount: { currency: 'USD', value: 1000 },
        paymentMethod: req.body.paymentMethod,
        merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
        reference: 'ORDER-12345',
        returnUrl: process.env.DOMAIN_NAME,
      },
      {
        headers: {
          'X-API-Key': process.env.ADYEN_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    res.json(paymentResponse.data);
  } catch (error) {
    console.error('Payment error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Fallback route serve index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
