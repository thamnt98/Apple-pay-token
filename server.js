const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Client, Config, CheckoutAPI } = require("@adyen/api-library");
require("dotenv").config();

const app = express();
app.use(express.static("public"));
app.use(cors());
app.use(bodyParser.json());

const config = new Config();
config.apiKey = process.env.ADYEN_API_KEY;
config.merchantAccount = process.env.ADYEN_MERCHANT_ACCOUNT;
config.domainName = process.env.DOMAIN_NAME;

const client = new Client({ config });
client.setEnvironment("TEST");

const checkout = new CheckoutAPI(client);

app.post("/validate-merchant", async (req, res) => {
  const { validationUrl } = req.body;
  if (!validationUrl) {
    return res.status(400).json({ error: "Missing validationUrl" });
  }

  try {
    const response = await checkout.sessions({
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
