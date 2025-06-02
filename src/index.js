require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const { setupAdyen } = require('./services/adyen');
const webhookService = require('./services/webhook');
const applePayService = require('./services/applePay');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Initialize Adyen
const adyenInstance = setupAdyen();

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API endpoints
app.post('/api/getPaymentMethods', async (req, res) => {
  try {
    logger.info('Getting payment methods from Adyen');
    const response = await adyenInstance.getPaymentMethods();
    res.json(response);
  } catch (error) {
    logger.error('Error getting payment methods:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/getApplePaySession', async (req, res) => {
  try {
    logger.info('Getting Apple Pay session');
    const session = await applePayService.getSession();
    res.json(session);
  } catch (error) {
    logger.error('Error getting Apple Pay session:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/validateApplePayMerchant', async (req, res) => {
  try {
    const { validationURL } = req.body;
    
    if (!validationURL) {
      logger.error('No validation URL provided');
      return res.status(400).json({ error: 'No validation URL provided' });
    }
    
    logger.info(`Validating Apple Pay merchant with URL: ${validationURL}`);
    const validationData = await applePayService.validateMerchant(validationURL);
    
    res.json(validationData);
  } catch (error) {
    logger.error('Error validating Apple Pay merchant:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/submitApplePayToken', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      logger.error('No Apple Pay token provided');
      return res.status(400).json({ error: 'No Apple Pay token provided' });
    }
    
    logger.info('Received Apple Pay token, processing...');
    
    // Process the token with the Apple Pay service
    const processedData = await applePayService.processToken(token);
    
    // Send the payment data to webhook
    const result = await webhookService.sendToWebhook(processedData);
    
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Error processing Apple Pay token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`Adyen environment: ${process.env.ADYEN_ENVIRONMENT}`);
  logger.info(`Webhook URL: ${process.env.WEBHOOK_URL}`);
}); 