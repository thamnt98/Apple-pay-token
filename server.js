const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const { Client, Config, CheckoutAPI } = require("@adyen/api-library");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // public/index.html

// Cấu hình Adyen SDK
const config = new Config();
config.apiKey = process.env.ADYEN_API_KEY;
config.merchantAccount = process.env.ADYEN_MERCHANT_ACCOUNT;
const client = new Client({ config });
client.setEnvironment("TEST"); // hoặc "LIVE" nếu production
const checkout = new CheckoutAPI(client);

// Endpoint tạo Apple Pay session
app.post("/validate-merchant", async (req, res) => {
  const { validationURL } = req.body;

  if (!validationURL) {
    return res.status(400).json({ error: "Missing validationURL" });
  }

  try {
    const result = await checkout.applePaySessions({
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
      displayName: "Demo Store",
      domainName: process.env.DOMAIN_NAME,
      initiative: "web",
      initiativeContext: process.env.DOMAIN_NAME,
      validationUrl: validationURL,
    });

    res.json(result);
  } catch (err) {
    console.error("❌ Apple Pay session error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
