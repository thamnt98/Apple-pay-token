require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const adyenService = require('./services/adyen');
const webhookService = require('./services/webhook');
const applePayService = require('./services/applePay');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Serve the Apple Pay merchant validation file
app.get('/.well-known/apple-developer-merchantid-domain-association', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/.well-known/apple-developer-merchantid-domain-association'));
});

// API endpoints
app.post('/api/getPaymentMethods', async (req, res) => {
  try {
    logger.info('Getting payment methods from Adyen');
    const response = await adyenService.getPaymentMethods();
    res.json(response);
  } catch (error) {
    logger.error('Error getting payment methods:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Adyen session
app.post('/api/getSession', async (req, res) => {
  try {
    logger.info('Getting Adyen session');
    const session = await applePayService.getSession();
    res.json(session);
  } catch (error) {
    logger.error('Error getting session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Validate Apple Pay merchant
app.post('/api/validateApplePayMerchant', async (req, res) => {
  try {
    const { validationURL } = req.body;
    
    if (!validationURL) {
      logger.error('No validation URL provided');
      return res.status(400).json({ error: 'No validation URL provided' });
    }
    
    logger.info('Validating Apple Pay merchant');
    const validationData = await applePayService.validateMerchant(validationURL);
    res.json(validationData);
  } catch (error) {
    logger.error('Error validating merchant:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process Apple Pay payment
app.post('/api/processApplePayment', async (req, res) => {
  try {
    const payment = req.body;
    
    if (!payment || !payment.token) {
      logger.error('Invalid payment data received');
      return res.status(400).json({ error: 'Invalid payment data' });
    }
    
    logger.info('Processing Apple Pay payment');
    const result = await applePayService.processPayment(payment);
    res.json(result);
  } catch (error) {
    logger.error('Error processing payment:', error);
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