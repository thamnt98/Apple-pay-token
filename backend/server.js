require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// API tạo Apple Pay merchant session
app.post('/api/apple-pay-session', async (req, res) => {
  try {
    const response = await axios.post(
      'https://checkout-test.adyen.com/v71/applePay/sessions',
      {
        merchantIdentifier: process.env.ADYEN_MERCHANT_IDENTIFIER,
        domainName: process.env.DOMAIN_NAME,    // domain frontend (phải khớp)
        displayName: 'Demo Store'
      },
      {
        headers: {
          'X-API-Key': process.env.ADYEN_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Apple Pay session error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create Apple Pay session' });
  }
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
