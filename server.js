const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Client, Config, CheckoutAPI } = require("@adyen/api-library");
require("dotenv").config();

const app = express();

// 👉 Sử dụng thư mục "public" để phục vụ frontend
app.use(express.static("public"));

app.use(cors());
app.use(bodyParser.json());

// 🔧 Cấu hình Adyen SDK
const config = new Config();
config.apiKey = process.env.ADYEN_API_KEY;
config.domainName = process.env.DOMAIN_NAME;
config.merchantAccount = process.env.ADYEN_MERCHANT_ACCOUNT;

const client = new Client({ config });
client.setEnvironment("TEST");

const checkout = new CheckoutAPI(client);

// 📦 Endpoint Apple Pay session
app.post("/validate-merchant", async (req, res) => {
    const { validationURL } = req.body;

    if (!validationURL) {
        return res.status(400).json({ error: "Missing validationURL" });
    }

    try {
        const response = await checkout.applePaySessions({
            merchantAccount: config.merchantAccount,
            displayName: "Demo Store",
            domainName: config.domainName,
            initiative: "web",
            initiativeContext: config.domainName,
            validationUrl: validationURL
        });

        res.json(response);
    } catch (err) {
        console.error("❌ Apple Pay session error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Apple Pay session server running at http://localhost:${PORT}`);
});
