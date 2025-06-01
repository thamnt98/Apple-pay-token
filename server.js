const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(express.static("public"));

// Configure CORS to allow requests to the webhook URL
app.use(cors({
  origin: ['http://localhost:3000', 'https://webhook.site'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(bodyParser.json());

// Mock validate-merchant endpoint
app.post("/validate-merchant", async (req, res) => {
  const { validationUrl } = req.body;
  if (!validationUrl) {
    return res.status(400).json({ error: "Missing validationUrl" });
  }

  console.log("Received validationUrl:", validationUrl);
  
  try {
    // Create a mock Apple Pay session response
    // This format matches what Apple expects for merchant validation
    const mockResponse = {
      merchantIdentifier: "merchant.com.example.demo",
      domainName: "localhost",
      displayName: "Demo Store",
      merchantSessionIdentifier: "merchant_session_" + Date.now(),
      signature: "mock_signature_" + Date.now(),
      nonce: "mock_nonce_" + Date.now(),
      timestamp: Math.floor(Date.now() / 1000),
      epochTimestamp: Math.floor(Date.now() / 1000),
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      operationalAnalyticsIdentifier: "mock_analytics_id",
      retries: 0
    };

    console.log("Sending mock merchant session:", JSON.stringify(mockResponse, null, 2));
    res.json(mockResponse);
  } catch (err) {
    console.error("Apple Pay session error:", err);
    console.error("Error details:", JSON.stringify({
      message: err.message,
      stack: err.stack
    }, null, 2));
    
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
