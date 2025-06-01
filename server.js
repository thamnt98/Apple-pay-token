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

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

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

  console.log("Received validationUrl:", validationUrl);
  console.log("Using domain:", config.domainName);
  console.log("Using merchant account:", config.merchantAccount);

  try {
    // Create a simpler request with only the essential fields
    const sessionRequest = {
      merchantAccount: config.merchantAccount,
      amount: {
        currency: "CAD",
        value: 100 // 1.00 in minor units (cents)
      },
      returnUrl: `https://${config.domainName}/checkout-result`,
      reference: `apple-pay-${Date.now()}`,
      countryCode: "CA",
      channel: "Web",
      displayName: "Demo Store",
      domainName: config.domainName,
      initiative: "web",
      initiativeContext: config.domainName,
      validationUrl
    };

    console.log("Sending session request:", JSON.stringify(sessionRequest, null, 2));
    
    const response = await checkout.PaymentsApi.sessions(sessionRequest);
    
    console.log("Received session response:", JSON.stringify(response, null, 2));
    
    res.json(response);
  } catch (err) {
    console.error("Apple Pay session error:", err);
    console.error("Error details:", JSON.stringify({
      message: err.message,
      statusCode: err.statusCode,
      errorCode: err.errorCode,
      responseBody: err.responseBody
    }, null, 2));
    
    // Return a more detailed error response
    res.status(500).json({ 
      error: err.message,
      statusCode: err.statusCode,
      errorCode: err.errorCode,
      responseBody: err.responseBody
    });
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
