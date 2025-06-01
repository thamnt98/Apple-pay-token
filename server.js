const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (like index.html) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

console.log('Environment variables check:');
console.log('- ADYEN_API_KEY:', process.env.ADYEN_API_KEY ? 'SET' : 'NOT SET');

// Endpoint để xử lý Apple Pay merchant validation
app.post('/validate-merchant', async (req, res) => {
  const { validationURL } = req.body;
  if (!validationURL) {
    return res.status(400).json({ error: 'Missing validationURL from request body' });
  }

  try {
    const requestBody = {
      displayName: 'My Demo Store',
      domainName: process.env.DOMAIN_NAME,
      merchantIdentifier: process.env.ADYEN_MERCHANT_IDENTIFIER,
    };

    console.log('Sending merchant validation to:', validationURL);
    console.log('Request body:', requestBody);

    const response = await fetch(validationURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.ADYEN_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    const text = await response.text();
    if (!response.ok) {
      console.error('Apple/Adyen response error:', text);
      return res.status(response.status).json({ error: text });
    }

    const merchantSession = JSON.parse(text);
    console.log('✅ Merchant session received successfully');
    res.json(merchantSession);
  } catch (e) {
    console.error('Error validating merchant session:', e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
