const { Client, Config } = require('@adyen/api-library');
const fetch = require('node-fetch');
const logger = require('../utils/logger');

// Adyen service
class AdyenService {
  constructor() {
    // Get configuration from environment variables
    this.merchantAccount = process.env.ADYEN_MERCHANT_ACCOUNT;
    this.clientKey = process.env.ADYEN_CLIENT_KEY;
    this.apiKey = process.env.ADYEN_API_KEY;
    this.environment = process.env.ADYEN_ENVIRONMENT || 'TEST';

    if (!this.merchantAccount || !this.clientKey || !this.apiKey) {
      throw new Error('Missing required Adyen configuration. Please check your environment variables.');
    }

    // Initialize Adyen client
    const config = new Config();
    config.apiKey = this.apiKey;
    config.merchantAccount = this.merchantAccount;
    this.client = new Client({ config });

    // Set base URL based on environment
    this.baseUrl = this.environment === 'LIVE'
      ? 'https://checkout-live.adyen.com/v70'
      : 'https://checkout-test.adyen.com/v70';

    logger.info('Adyen service initialized');
  }

  getConfig() {
    return {
      clientKey: this.clientKey,
      environment: this.environment.toLowerCase(),
      merchantAccount: this.merchantAccount
    };
  }

  async getPaymentMethods() {
    try {
      logger.info('Requesting payment methods from Adyen');
      
      const response = await fetch(`${this.baseUrl}/paymentMethods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-API-key': this.apiKey
        },
        body: JSON.stringify({
          merchantAccount: this.merchantAccount,
          countryCode: 'US',
          amount: { currency: 'USD', value: 1000 },
          channel: 'Web',
          shopperLocale: 'en-US'
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Adyen API error: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      logger.info('Successfully retrieved payment methods');
      
      return {
        clientKey: this.clientKey,
        environment: this.environment.toLowerCase(),
        paymentMethodsResponse: data
      };
    } catch (error) {
      logger.error('Error retrieving payment methods:', error);
      throw error;
    }
  }

  async processApplePayToken(token) {
    try {
      logger.info('Processing Apple Pay token');
      
      // Extract payment data from the token
      const paymentData = {
        token: token,
        merchantAccount: this.merchantAccount,
        timestamp: new Date().toISOString()
      };
      
      logger.info('Apple Pay token processed successfully');
      return paymentData;
    } catch (error) {
      logger.error('Error processing Apple Pay token:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
let adyenInstance;

function setupAdyen() {
  if (!adyenInstance) {
    adyenInstance = new AdyenService();
  }
  return adyenInstance;
}

module.exports = { setupAdyen }; 