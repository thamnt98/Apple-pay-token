const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Client, Config, CheckoutAPI } = require("@adyen/api-library");
require("dotenv").config();

const app = express();
app.use(express.static("public"));

// Configure CORS to allow requests to the webhook URL
app.use(cors({
  origin: ['http://localhost:3000', 'https://webhook.site'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

const config = new Config();
// Using hardcoded values instead of environment variables
config.apiKey = process.env.ADYEN_API_KEY; // Replace with actual API key
config.merchantAccount = process.env.ADYEN_MERCHANT_ACCOUNT; // Replace with actual merchant account
config.domainName = process.env.DOMAIN_NAME; // For development

const client = new Client({ config });
client.setEnvironment("TEST");

const checkout = new CheckoutAPI(client);

app.post("/validate-merchant", async (req, res) => {
  const { validationUrl } = req.body;
  if (!validationUrl) {
    return res.status(400).json({ error: "Missing validationUrl" });
  }

  try {
    const response = await checkout.PaymentsApi.sessions({
      merchantAccount: config.merchantAccount,
      displayName: "Demo Store",
      domainName: config.domainName,
      initiative: "web",
      initiativeContext: config.domainName,
      validationUrl,
    });

    res.json(response);
  } catch (err) {
    console.error("Apple Pay session error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Simple endpoint to receive and log the Apple Pay token
app.post("/get-apple-pay-token", async (req, res) => {
  const { paymentData } = req.body;
  
  if (!paymentData) {
    return res.status(400).json({ error: "Missing paymentData" });
  }

  console.log("Apple Pay Token received:", JSON.stringify(paymentData, null, 2));
  
  // Just return success without processing payment
  res.json({ 
    success: true, 
    message: "Apple Pay token received successfully",
    token: paymentData
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
