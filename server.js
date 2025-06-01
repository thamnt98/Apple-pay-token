const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const https = require('https');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/validate-merchant', async (req, res) => {
    const validationURL = req.body.validationURL;

    // Nếu bạn có certificate của Apple Merchant (dạng .pem hoặc .p12), sử dụng nó tại đây.
    const options = {
        method: 'POST',
        hostname: new URL(validationURL).hostname,
        path: new URL(validationURL).pathname,
        headers: {
            'Content-Type': 'application/json'
        }
        // key: fs.readFileSync('cert.key'),
        // cert: fs.readFileSync('cert.pem')
    };

    const postData = JSON.stringify({
        merchantIdentifier: process.env.ADYEN_MERCHANT_IDENTIFIER, // <-- Thay bằng ID thật
        displayName: 'My Demo Store',
        initiative: 'web',
        initiativeContext: process.env.DOMAIN_NAME // <-- Thay bằng domain frontend
    });

    const request = https.request(validationURL, options, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
            try {
                res.json(JSON.parse(data));
            } catch (err) {
                res.status(500).send({ error: 'Invalid merchant validation response' });
            }
        });
    });

    request.on('error', (e) => {
        console.error(e);
        res.status(500).send({ error: 'Merchant validation failed' });
    });

    request.write(postData);
    request.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Apple Pay demo server running at http://localhost:${PORT}`));
