const logger = require('../utils/logger');
const { setupAdyen } = require('./adyen');

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
   * This would typically involve a call to Adyen's Apple Pay session endpoint
   * @returns {Promise<Object>} - Session data for Apple Pay
   */
  async getSession() {
    try {
      logger.info('Getting Apple Pay session data');
      
      // For a real implementation, you would call Adyen's API
      // For now, we'll return a basic configuration
      return {
        merchantIdentifier: process.env.APPLE_PAY_MERCHANT_IDENTIFIER || 'merchant.com.adyen.applepay.test',
        domainName: process.env.APPLE_PAY_DOMAIN || 'localhost',
        displayName: process.env.APPLE_PAY_DISPLAY_NAME || 'Adyen Apple Pay Demo'
      };
    } catch (error) {
      logger.error('Error getting Apple Pay session:', error);
      throw error;
    }
  }
  
  /**
   * Process Apple Pay token
   * @param {Object} token - The Apple Pay token
   * @returns {Promise<Object>} - Processed payment data
   */
  async processToken(token) {
    try {
      logger.info('Processing Apple Pay token in ApplePayService');
      
      // Use the Adyen instance to process the token
      const paymentData = await this.adyenInstance.processApplePayToken(token);
      
      logger.info('Apple Pay token processed successfully in ApplePayService');
      return paymentData;
    } catch (error) {
      logger.error('Error processing Apple Pay token in ApplePayService:', error);
      throw error;
    }
  }
}

// Export a singleton instance
module.exports = new ApplePayService(); 