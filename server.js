const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Tạo Apple Pay session (Adyen handle certificate)
app.post("/api/apple-pay-session", async (req, res) => {
  const { amount } = req.body;

  try {
    const response = await axios.post(
      "https://checkout-test.adyen.com/v71/paymentMethods",
      {
        merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
        amount: { value: Math.round(Number(amount) * 100), currency: "USD" },
        channel: "Web",
        countryCode: "US",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.ADYEN_API_KEY,
        },
      }
    );

    // Get Apple Pay session
    const merchantValidationUrl = "https://apple-pay-gateway.apple.com/paymentservices/startSession";

    const sessionResp = await axios.post(
      "https://checkout-test.adyen.com/v71/applePay/sessions",
      {
        displayName: "Demo Store",
        domainName: process.env.DOMAIN_NAME, // phải khớp domain frontend
        initiative: "web",
        merchantIdentifier: process.env.ADYEN_MERCHANT_IDENTIFIER,
        initiativeContext: process.env.DOMAIN_NAME
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.ADYEN_API_KEY,
        },
      }
    );

    res.json({ session: sessionResp.data });
  } catch (err) {
    console.error("Error generating session:", err?.response?.data || err);
    res.status(500).json({ error: "Failed to generate Apple Pay session" });
  }
});

// Nhận token từ frontend và forward đến webhook
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
