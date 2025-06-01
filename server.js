const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

// Serve static files
app.use(express.static("public"));

// Serve Apple Pay verification file
app.get("/.well-known/apple-developer-merchantid-domain-association", (req, res) => {
  // Nội dung này thường được cung cấp bởi Apple khi bạn đăng ký merchant ID
  // Đây chỉ là file giả để phục vụ mục đích thử nghiệm
  res.send("This is a mock Apple Pay domain verification file");
});

// Configure CORS
app.use(cors({
  origin: '*',
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
    // Tạo một đối tượng response theo đúng định dạng mà Apple Pay yêu cầu
    // Tham khảo: https://developer.apple.com/documentation/apple_pay_on_the_web/applepaysession/1778021-completemerchantsessionvalidation
    const mockResponse = {
      merchantIdentifier: "merchant.com.example.demo",
      domainName: "localhost",
      displayName: "Demo Store",
      signature: "mock_signature_" + Date.now(),
      nonce: "mock_nonce_" + Date.now(),
      timestamp: Math.floor(Date.now() / 1000).toString(),
      epochTimestamp: Math.floor(Date.now() / 1000).toString(),
      expiresAt: Math.floor(Date.now() / 1000 + 3600).toString(),
      merchantSessionIdentifier: "merchant_session_" + Date.now()
    };

    console.log("Sending mock merchant session:", JSON.stringify(mockResponse, null, 2));
    
    // Trì hoãn phản hồi một chút để mô phỏng mạng thực tế
    setTimeout(() => {
      res.json(mockResponse);
    }, 500);
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
