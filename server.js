const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const axios = require("axios");
const { Client, Config, CheckoutAPI } = require("@adyen/api-library");

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Adyen SDK cấu hình
const config = new Config();
config.apiKey = process.env.ADYEN_API_KEY;
config.merchantAccount = process.env.ADYEN_MERCHANT_ACCOUNT;
const client = new Client({ config });
client.setEnvironment("TEST"); // Sử dụng môi trường test
const checkout = new CheckoutAPI(client);

// Gửi client key về frontend
app.get("/config", (req, res) => {
  res.json({ clientKey: process.env.ADYEN_CLIENT_KEY });
});

// Trả về danh sách payment methods (bao gồm Apple Pay)
app.post("/paymentMethods", async (req, res) => {
  const { amount } = req.body;

  try {
    const result = await checkout.paymentMethods({
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
      countryCode: "US",
      amount: amount || { currency: "USD", value: 1000 },
      channel: "Web",
    });
    res.json(result);
  } catch (err) {
    console.error("paymentMethods error:", err);
    res.status(500).json({ error: "Failed to retrieve paymentMethods" });
  }
});

// Gửi Apple Pay paymentData lên webhook
app.post("/submit-payment", async (req, res) => {
  const { paymentData } = req.body;

  try {
    const result = await axios.post("https://webhook.site/c37ecbc0-d876-4b23-99b8-27d428d713e6", {
      receivedAt: new Date().toISOString(),
      paymentData,
    });

    res.json({ status: "Sent to webhook", response: result.data });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({ error: "Failed to send to webhook" });
  }
});

// Khởi động server
app.listen(3000, () => console.log("✅ Server chạy tại http://localhost:3000"));
