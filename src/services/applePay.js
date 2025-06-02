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
   * This would typically involve a call to Adyen's Apple Pay session endpoint
   * @returns {Promise<Object>} - Session data for Apple Pay
   */
  async getSession() {
    try {
      logger.info('Getting Apple Pay session data');
      
      // Default configuration
      const merchantIdentifier = process.env.APPLE_PAY_MERCHANT_IDENTIFIER || 'merchant.com.yourcompany.test';
      const domainName = process.env.APPLE_PAY_DOMAIN || 'localhost';
      const displayName = process.env.APPLE_PAY_DISPLAY_NAME || 'Adyen Apple Pay Demo';
      
      logger.info(`Apple Pay configuration: merchantIdentifier=${merchantIdentifier}, domain=${domainName}, displayName=${displayName}`);
      
      // For a real implementation, you would call Adyen's API to get a validated session
      // Try to get Apple Pay session from Adyen if we have an API key
      if (this.adyenInstance.client && this.adyenInstance.client.config && this.adyenInstance.client.config.apiKey) {
        try {
          logger.info('Attempting to get Apple Pay session from Adyen');
          
          // Get base URL based on environment
          const environment = process.env.ADYEN_ENVIRONMENT === 'LIVE' ? 'LIVE' : 'TEST';
          const baseUrl = environment === 'LIVE' 
            ? 'https://checkout-live.adyen.com/v70'
            : 'https://checkout-test.adyen.com/v70';
          
          // Make a direct request to Adyen's Apple Pay session endpoint
          const response = await fetch(`${baseUrl}/applePay/sessions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-API-key': this.adyenInstance.client.config.apiKey
            },
            body: JSON.stringify({
              displayName: displayName,
              domainName: domainName,
              merchantIdentifier: merchantIdentifier
            })
          });
          
          if (response.ok) {
            const sessionData = await response.json();
            logger.info('Successfully retrieved Apple Pay session from Adyen');
            return {
              merchantIdentifier: merchantIdentifier,
              domainName: domainName,
              displayName: displayName,
              sessionData: sessionData
            };
          } else {
            const errorText = await response.text();
            logger.error(`Failed to get Apple Pay session from Adyen: ${response.status} ${errorText}`);
          }
        } catch (adyenError) {
          logger.error('Error getting Apple Pay session from Adyen:', adyenError);
          // Continue with default configuration
        }
      }
      
      // Return default configuration if Adyen call fails
      return {
        merchantIdentifier: merchantIdentifier,
        domainName: domainName,
        displayName: displayName
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
      
      const merchantIdentifier = process.env.APPLE_PAY_MERCHANT_IDENTIFIER || 'merchant.com.yourcompany.test';
      const domainName = process.env.APPLE_PAY_DOMAIN || 'localhost';
      const displayName = process.env.APPLE_PAY_DISPLAY_NAME || 'Adyen Apple Pay Demo';
      
      // Sử dụng endpoint /sessions thay vì /sessions/validate
      // Đây là endpoint chính xác theo tài liệu Adyen mới nhất
      const response = await fetch(`${baseUrl}/applePay/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-API-key': this.adyenInstance.client.config.apiKey
        },
        body: JSON.stringify({
          merchantAccount: this.adyenInstance.merchantAccount,
          displayName: displayName,
          domainName: domainName,
          initiative: "web",
          initiativeContext: domainName,
          validationURL: validationURL,
          // Thêm các trường bắt buộc khác
          amount: {
            currency: "USD",
            value: 100 // 1.00 USD
          },
          countryCode: "US",
          returnUrl: `https://${domainName}/checkout-result`,
          reference: `apple-pay-${Date.now()}`
        })
      });
      
      if (!response.ok) {
        // Log toàn bộ response để debug
        const errorText = await response.text();
        logger.error(`Failed to validate merchant: ${response.status} ${errorText}`);
        
        // Tạo mock response để tránh lỗi
        if (process.env.NODE_ENV !== 'production') {
          logger.info('Using mock validation response for development');
          return this.createMockValidationResponse();
        }
        
        throw new Error(`Merchant validation failed: ${response.status} ${errorText}`);
      }
      
      const validationData = await response.json();
      logger.info('Merchant validation successful');
      logger.info('Validation data:', JSON.stringify(validationData, null, 2));
      
      return validationData;
    } catch (error) {
      logger.error('Error validating merchant:', error);
      
      // Tạo mock response trong môi trường development
      if (process.env.NODE_ENV !== 'production') {
        logger.info('Using mock validation response after error');
        return this.createMockValidationResponse();
      }
      
      throw error;
    }
  }
  
  /**
   * Tạo mock response cho merchant validation để tránh lỗi
   * @returns {Object} - Mock validation response
   */
  createMockValidationResponse() {
    const now = Math.floor(Date.now() / 1000);
    return {
      merchantIdentifier: process.env.APPLE_PAY_MERCHANT_IDENTIFIER || 'merchant.com.yourcompany.test',
      domainName: process.env.APPLE_PAY_DOMAIN || 'localhost',
      displayName: process.env.APPLE_PAY_DISPLAY_NAME || 'Adyen Apple Pay Demo',
      merchantSessionIdentifier: `merchant_session_${Date.now()}`,
      signature: `mock_signature_${Date.now()}`,
      nonce: `mock_nonce_${Date.now()}`,
      timestamp: now.toString(),
      epochTimestamp: now.toString(),
      expiresAt: (now + 3600).toString()
    };
  }
  
  /**
   * Process Apple Pay token
   * @param {Object} token - The Apple Pay token
   * @returns {Promise<Object>} - Processed payment data
   */
  async processToken(token) {
    try {
      logger.info('Processing Apple Pay token in ApplePayService');
      logger.info('Token received:', JSON.stringify(token, null, 2));
      
      if (!token || !token.paymentData) {
        throw new Error('Invalid Apple Pay token: missing paymentData');
      }
      
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