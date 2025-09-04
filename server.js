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

// Cấu hình Adyen riêng cho từng quốc gia
const countryConfig = {
  CZ: {
    countryCode: "CZ",
    currency: "CZK",
    displayName: "Czech Republic",
    adyen: {
      apiKey: process.env.ADYEN_API_KEY_CZ,
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT_CZ,
      clientKey: process.env.ADYEN_CLIENT_KEY_CZ
    }
  },
  PT: {
    countryCode: "PT", 
    currency: "EUR",
    displayName: "Portugal",
    adyen: {
      apiKey: process.env.ADYEN_API_KEY_PT,
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT_PT,
      clientKey: process.env.ADYEN_CLIENT_KEY_PT
    }
  }
};

// Tạo Adyen client cho từng quốc gia
const createAdyenClient = (countryCode) => {
  const config = new Config();
  config.apiKey = countryConfig[countryCode].adyen.apiKey;
  config.merchantAccount = countryConfig[countryCode].adyen.merchantAccount;
  const client = new Client({ config });
  client.setEnvironment("TEST"); // Sử dụng môi trường test
  return new CheckoutAPI(client);
};

// Gửi client key và cấu hình quốc gia về frontend
app.get("/config", (req, res) => {
  const { country } = req.query;
  
  if (country && countryConfig[country]) {
    res.json({ 
      clientKey: countryConfig[country].adyen.clientKey,
      countryConfig: {
        [country]: {
          countryCode: countryConfig[country].countryCode,
          currency: countryConfig[country].currency,
          displayName: countryConfig[country].displayName
        }
      }
    });
  } else {
    // Trả về tất cả cấu hình nếu không chỉ định quốc gia
    const allCountryConfig = {};
    Object.keys(countryConfig).forEach(key => {
      allCountryConfig[key] = {
        countryCode: countryConfig[key].countryCode,
        currency: countryConfig[key].currency,
        displayName: countryConfig[key].displayName
      };
    });
    
    res.json({ 
      countryConfig: allCountryConfig
    });
  }
});

// Trả về danh sách payment methods (bao gồm Apple Pay)
app.post("/paymentMethods", async (req, res) => {
  const { amount, country } = req.body;
  
  if (!countryConfig[country]) {
    return res.status(400).json({ error: "Invalid country code" });
  }

  try {
    const checkout = createAdyenClient(country);
    const result = await checkout.paymentMethods({
      merchantAccount: countryConfig[country].adyen.merchantAccount,
      countryCode: countryConfig[country].countryCode,
      amount: amount,
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
    const { paymentMethod, riskData, amountValue, currency, country } = req.body;
    const payload = {
        clientStateDataIndicator: true,
        paymentMethod: paymentMethod,
        riskData: riskData
      };
      const paymentData = JSON.stringify(payload);
    try {
    await axios.post(process.env.WEBHOOK_URL, {
        paymentData,
        amountValue,
        currency,
        country: countryConfig[country]?.displayName || country,
        merchantAccount: countryConfig[country]?.adyen.merchantAccount || 'unknown'
    });

    res.json({ status: "Sent to Google Sheet" });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({ error: "Failed to send to Google Sheet" });
  }
});

// Khởi động server
app.listen(3000, () => console.log("✅ Server chạy tại http://localhost:3000"));
