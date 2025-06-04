const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

const ADYEN_API_KEY = process.env.ADYEN_API_KEY;
const MERCHANT_ACCOUNT = process.env.ADYEN_MERCHANT_ACCOUNT;
const DOMAIN = process.env.DOMAIN_NAME;

// API để tạo Apple Pay session
app.post("/api/apple-pay-session", async (req, res) => {
  try {
    const sessionResp = await axios.post(
      "https://checkout-test.adyen.com/v71/applePay/sessions",
      {
        displayName: "Demo Store",
        domainName: process.env.DOMAIN_NAME, // phải khớp domain frontend
        merchantIdentifier: process.env.ADYEN_MERCHANT_IDENTIFIER,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": ADYEN_API_KEY
        }
      }
    );

    res.json({ session: sessionResp.data });
  } catch (err) {
    console.error("Error generating Apple Pay session:", err?.response?.data || err);
    res.status(500).json({ error: "Failed to generate Apple Pay session" });
  }
});

// Gửi token về webhook
app.post("/api/forward-token", async (req, res) => {
  const { token } = req.body;

  try {
    await axios.post(
      "https://webhook.site/3e1a5a6d-e280-4464-8f2a-a05b70f2d0cf",
      { token }
    );
    res.sendStatus(200);
  } catch (err) {
    console.error("Error forwarding token:", err);
    res.status(500).json({ error: "Failed to forward token" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
