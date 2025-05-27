const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files (like index.html) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Endpoint để xử lý Apple Pay merchant validation
app.post('/validate-merchant', async (req, res) => {
    const { validationURL } = req.body;

    if (!validationURL) {
        return res.status(400).json({ error: 'Validation URL is required' });
    }

    // Trả về merchant session giả lập
    const merchantSession = {
        merchantIdentifier: "merchant.com.example",
        displayName: "Example Store",
        initiative: "web",
        initiativeContext: "example.com"
    };

    res.json(merchantSession);
});

// Endpoint để xử lý thanh toán
app.post('/process-payment', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Payment token is required' });
    }

    try {
        const response = await fetch('https://webhook.site/3e1a5a6d-e280-4464-8f2a-a05b70f2d0cf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });

        if (!response.ok) {
            throw new Error('Failed to send token to webhook');
        }

        res.status(200).json({ message: 'Payment processed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
