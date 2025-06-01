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
config.domainName = process.env.DOMAIN_NAME || "localhost"; // For development

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
      // Required fields
      merchantAccount: config.merchantAccount,
      amount: {
        currency: "CAD",
        value: 100 // 1.00 in minor units (cents)
      },
      returnUrl: `https://${config.domainName}/checkout-result`,
      reference: `apple-pay-${Date.now()}`, // Unique reference for the payment
      countryCode: "CA", // Country code (Canada)
      
      // Apple Pay specific fields
      channel: "Web", // Channel through which the payment is processed
      displayName: "Demo Store",
      domainName: config.domainName,
      initiative: "web",
      initiativeContext: config.domainName,
      validationUrl,
      
      // Additional optional fields that might help
      shopperLocale: "en-CA",
      shopperReference: `shopper-${Date.now()}`,
      shopperEmail: "shopper@example.com",
      shopperIP: "192.0.2.1", // Example IP
      lineItems: [
        {
          quantity: 1,
          amountIncludingTax: 100,
          description: "Apple Pay Token Test"
        }
      ]
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
