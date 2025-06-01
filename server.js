// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Client, Config, CheckoutAPI } = require("@adyen/api-library");

require("dotenv").config(); // để dùng biến từ .env

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🔧 Cấu hình Adyen SDK
const config = new Config();
config.apiKey = process.env.ADYEN_API_KEY;
config.domainName = process.env.DOMAIN_NAME;
config.merchantAccount = process.env.ADYEN_MERCHANT_ACCOUNT;

const client = new Client({ config });
client.setEnvironment("TEST"); // hoặc "LIVE" khi chạy thật

const checkout = new CheckoutAPI(client);

// 📦 Endpoint tạo Apple Pay session
app.post("/validate-merchant", async (req, res) => {
    const { validationUrl } = req.body;

    if (!validationUrl) {
        return res.status(400).json({ error: "Missing validationUrl" });
    }

    try {
        const response = await checkout.applePaySessions({
            merchantAccount: config.merchantAccount,
            displayName: "Demo Store",
            domainName: domainName, // 🔴 domain frontend bạn dùng (phải đúng & đã verify trong Adyen)
            initiative: "web",
            initiativeContext: domainName, // 🔴 giống domainName
            validationUrl
        });

        res.json(response);
    } catch (err) {
        console.error("❌ Apple Pay session error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ✅ Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Apple Pay session server running at http://localhost:${PORT}`);
});
