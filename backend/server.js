require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// API tạo Apple Pay session (merchant validation)
app.post('/api/apple-pay-session', async (req, res) => {
  try {
    const { validationUrl } = req.body; // Apple gửi validationUrl trong event onValidateMerchant
    if (!validationUrl) {
      return res.status(400).json({ error: 'validationUrl is required' });
    }

    const response = await axios.post(
      'https://checkout-test.adyen.com/v71/applePay/sessions',
      {
        merchantIdentifier: process.env.ADYEN_MERCHANT_IDENTIFIER,
        domainName: process.env.DOMAIN_NAME.replace(/^https?:\/\//, ''), // domain không có https://
        displayName: 'Demo Store',
        validationUrl: validationUrl,
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
    console.error('Apple Pay session error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create Apple Pay session' });
  }
});

// API nhận payment token từ client và gửi thanh toán đến Adyen
app.post('/api/payments', async (req, res) => {
  try {
    const { paymentMethod, amount, reference } = req.body;

    const response = await axios.post(
      'https://checkout-test.adyen.com/v71/payments',
      {
        amount: amount || { currency: 'USD', value: 1000 },
        paymentMethod,
        merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
        reference: reference || 'ORDER-12345',
        returnUrl: process.env.DOMAIN_NAME,
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
    console.error('Payment processing error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Serve index.html cho tất cả các route không khớp API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
