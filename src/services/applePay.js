const logger = require('../utils/logger');
const { setupAdyen } = require('./adyen');
const fetch = require('node-fetch');

/**
 * Service to handle Apple Pay-specific functionality
 */
class ApplePayService {
  constructor() {
    this.adyenInstance = setupAdyen();
    logger.info('Apple Pay service initialized');
  }
  
  /**
   * Get Apple Pay session data
   * @returns {Promise<Object>} - Session data for Apple Pay
   */
  async getSession() {
    try {
      logger.info('Getting Apple Pay session data');
      
      // Get configuration from environment
      const merchantIdentifier = process.env.APPLE_PAY_MERCHANT_IDENTIFIER;
      const domainName = process.env.APPLE_PAY_DOMAIN || 'apple-pay-token-production.up.railway.app';
      const displayName = process.env.APPLE_PAY_DISPLAY_NAME || 'Adyen Apple Pay Demo';
      
      if (!merchantIdentifier) {
        throw new Error('APPLE_PAY_MERCHANT_IDENTIFIER is not configured');
      }
      
      logger.info(`Apple Pay configuration: merchantIdentifier=${merchantIdentifier}, domain=${domainName}, displayName=${displayName}`);
      
      // Get base URL based on environment
      const environment = process.env.ADYEN_ENVIRONMENT === 'LIVE' ? 'LIVE' : 'TEST';
      const baseUrl = environment === 'LIVE' 
        ? 'https://checkout-live.adyen.com/v70'
        : 'https://checkout-test.adyen.com/v70';
      
      // Get session data from Adyen
      const sessionResponse = await fetch(`${baseUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-API-key': this.adyenInstance.client.config.apiKey
        },
        body: JSON.stringify({
          merchantAccount: this.adyenInstance.merchantAccount,
          amount: {
            currency: "USD",
            value: 1000
          },
          returnUrl: `https://${domainName}/checkout-result`,
          reference: `apple-pay-${Date.now()}`,
          countryCode: "US",
          channel: "web",
          additionalData: {
            allow3DS2: true
          }
        })
      });
      
      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        throw new Error(`Failed to create session: ${sessionResponse.status} ${errorText}`);
      }
      
      const sessionData = await sessionResponse.json();
      logger.info('Successfully retrieved session data from Adyen');
      
      return {
        id: sessionData.id,
        sessionData: sessionData.sessionData,
        merchantIdentifier,
        domainName,
        displayName
      };
    } catch (error) {
      logger.error('Error getting Apple Pay session:', error);
      throw error;
    }
  }
  
  /**
   * Validate the Apple Pay merchant
   * @param {string} validationURL - The validation URL provided by Apple
   * @returns {Promise<Object>} - Merchant validation result
   */
  async validateMerchant(validationURL) {
    try {
      logger.info(`Validating Apple Pay merchant with URL: ${validationURL}`);
      
      if (!validationURL) {
        throw new Error('No validation URL provided');
      }
      
      // Get environment and configuration
      const environment = process.env.ADYEN_ENVIRONMENT === 'LIVE' ? 'LIVE' : 'TEST';
      const baseUrl = environment === 'LIVE' 
        ? 'https://checkout-live.adyen.com/v70'
        : 'https://checkout-test.adyen.com/v70';
      
      const merchantIdentifier = process.env.APPLE_PAY_MERCHANT_IDENTIFIER;
      const domainName = process.env.APPLE_PAY_DOMAIN || 'apple-pay-token-production.up.railway.app';
      const displayName = process.env.APPLE_PAY_DISPLAY_NAME || 'Adyen Apple Pay Demo';
      
      if (!merchantIdentifier) {
        throw new Error('APPLE_PAY_MERCHANT_IDENTIFIER is not configured');
      }
      
      // Step 1: Create Apple Pay session
      const applePaySession = await fetch(`${baseUrl}/applePay/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-API-key': this.adyenInstance.client.config.apiKey
        },
        body: JSON.stringify({
          displayName,
          domainName,
          merchantIdentifier,
          initiative: "web",
          validationUrl: validationURL
        })
      });
      
      if (!applePaySession.ok) {
        const errorText = await applePaySession.text();
        throw new Error(`Failed to create Apple Pay session: ${applePaySession.status} ${errorText}`);
      }
      
      const validationData = await applePaySession.json();
      logger.info('Successfully validated with Apple Pay');
      
      return validationData;
    } catch (error) {
      logger.error('Error validating merchant:', error);
      throw error;
    }
  }
  
  /**
   * Process Apple Pay payment
   * @param {Object} payment - The payment data from Apple Pay
   * @returns {Promise<Object>} - Payment result
   */
  async processPayment(payment) {
    try {
      logger.info('Processing Apple Pay payment');
      
      if (!payment || !payment.token || !payment.token.paymentData) {
        throw new Error('Invalid payment data received');
      }
      
      // Get environment configuration
      const environment = process.env.ADYEN_ENVIRONMENT === 'LIVE' ? 'LIVE' : 'TEST';
      const baseUrl = environment === 'LIVE' 
        ? 'https://checkout-live.adyen.com/v70'
        : 'https://checkout-test.adyen.com/v70';
      
      // Create payment request
      const paymentRequest = {
        merchantAccount: this.adyenInstance.merchantAccount,
        amount: {
          currency: payment.currencyCode || 'USD',
          value: Math.round(payment.token.paymentData.amount * 100)
        },
        reference: `apple-pay-${Date.now()}`,
        returnUrl: `https://${process.env.APPLE_PAY_DOMAIN}/checkout-result`,
        paymentMethod: {
          type: 'applepay',
          applePayToken: payment.token.paymentData
        },
        channel: 'web',
        additionalData: {
          allow3DS2: true
        },
        browserInfo: {
          acceptHeader: '*/*',
          userAgent: 'Mozilla/5.0'
        }
      };
      
      // Make payment request
      const response = await fetch(`${baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-API-key': this.adyenInstance.client.config.apiKey
        },
        body: JSON.stringify(paymentRequest)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Payment failed: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      logger.info('Payment processed successfully');
      
      return result;
    } catch (error) {
      logger.error('Error processing payment:', error);
      throw error;
    }
  }
}

// Export a singleton instance
module.exports = new ApplePayService(); 