require('dotenv').config();
const express = require('express');
const { Client, Config } = require('@adyen/api-library');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const config = new Config();
config.apiKey = process.env.ADYEN_API_KEY;
const client = new Client({ config });
client.setEnvironment("TEST"); // Use "LIVE" for production

// Add Apple Pay domain verification endpoint
app.get('/.well-known/apple-developer-merchantid-domain-association', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', '.well-known', 'apple-developer-merchantid-domain-association'));
});

app.post('/api/getClientKey', (req, res) => {
  res.json({ clientKey: process.env.ADYEN_CLIENT_KEY });
});

app.post('/api/sendTokenToWebhook', async (req, res) => {
  try {
    const { token } = req.body;
    
    // Send the Apple Pay token to the webhook
    const response = await fetch(process.env.WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        applePayToken: token,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send token to webhook');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 