const { Client, Config } = require('@adyen/api-library');
const fetch = require('node-fetch');
const logger = require('../utils/logger');

// Adyen service
class AdyenService {
  constructor() {
    this.initializeAdyen();
  }

  initializeAdyen() {
    try {
      const config = new Config();
      
      // Set environment
      config.apiKey = process.env.ADYEN_API_KEY;
      const environment = process.env.ADYEN_ENVIRONMENT === 'LIVE' ? 'LIVE' : 'TEST';
      
      config.environment = environment;
      
      // Create client
      this.client = new Client({ config });
      
      // Set base URL based on environment
      this.baseUrl = environment === 'LIVE' 
        ? 'https://checkout-live.adyen.com/v70'
        : 'https://checkout-test.adyen.com/v70';
      
      logger.info('Adyen client initialized successfully');
      
      this.merchantAccount = process.env.ADYEN_MERCHANT_ACCOUNT;
      this.clientKey = process.env.ADYEN_CLIENT_KEY;
      
      if (!this.merchantAccount) {
        throw new Error('ADYEN_MERCHANT_ACCOUNT is not defined in environment variables');
      }
      
      logger.info(`Adyen configured with merchant account: ${this.merchantAccount}`);
    } catch (error) {
      logger.error('Failed to initialize Adyen client:', error);
      throw error;
    }
  }

  async getPaymentMethods() {
    try {
      logger.info('Requesting payment methods from Adyen');
      
      // Make a direct HTTP request to the Adyen API
      const response = await fetch(`${this.baseUrl}/paymentMethods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-API-key': this.client.config.apiKey
        },
        body: JSON.stringify({
          merchantAccount: this.merchantAccount,
          countryCode: 'US',
          amount: { currency: 'USD', value: 1000 }, // $10.00
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
        environment: process.env.ADYEN_ENVIRONMENT.toLowerCase(),
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