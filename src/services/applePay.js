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
      
      const merchantIdentifier = process.env.APPLE_PAY_MERCHANT_IDENTIFIER;
      const domainName = process.env.APPLE_PAY_DOMAIN || 'apple-pay-token-production.up.railway.app';
      const displayName = process.env.APPLE_PAY_DISPLAY_NAME || 'Adyen Apple Pay Demo';
      
      if (!merchantIdentifier) {
        throw new Error('APPLE_PAY_MERCHANT_IDENTIFIER is not configured');
      }

      logger.info(`Using configuration: merchantIdentifier=${merchantIdentifier}, domain=${domainName}, displayName=${displayName}`);
      
      // Step 1: Get session data from Adyen
      const sessionRequestBody = {
        displayName: displayName,
        domainName: domainName,
        merchantIdentifier: merchantIdentifier,
        initiative: "web"
      };

      logger.info('Sending session request to Adyen:', JSON.stringify(sessionRequestBody, null, 2));
      
      const sessionResponse = await fetch(`${baseUrl}/applePay/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-API-key': this.adyenInstance.client.config.apiKey
        },
        body: JSON.stringify(sessionRequestBody)
      });
      
      const sessionResponseText = await sessionResponse.text();
      logger.info('Raw session response from Adyen:', sessionResponseText);

      if (!sessionResponse.ok) {
        logger.error(`Failed to create session: ${sessionResponse.status} ${sessionResponseText}`);
        throw new Error(`Session creation failed: ${sessionResponse.status} ${sessionResponseText}`);
      }
      
      let sessionData;
      try {
        sessionData = JSON.parse(sessionResponseText);
      } catch (e) {
        logger.error('Failed to parse session response:', e);
        throw new Error('Invalid session response format');
      }

      logger.info('Parsed session data:', JSON.stringify(sessionData, null, 2));

      // Step 2: Validate with Apple Pay
      const validationRequestBody = {
        merchantIdentifier: merchantIdentifier,
        domainName: domainName,
        displayName: displayName,
        initiative: "web",
        initiativeContext: domainName
      };

      if (sessionData.sessionData) {
        validationRequestBody.sessionData = sessionData.sessionData;
      }

      logger.info('Validation data to return:', JSON.stringify(validationRequestBody, null, 2));

      // Format the response exactly as Apple Pay expects it
      const formattedResponse = {
        merchantIdentifier: merchantIdentifier,
        domainName: domainName,
        displayName: displayName,
        initiative: "web",
        initiativeContext: domainName,
        ...sessionData
      };

      logger.info('Formatted validation response:', JSON.stringify(formattedResponse, null, 2));
      return formattedResponse;

    } catch (error) {
      logger.error('Error validating merchant:', error);
      throw error;
    }
  }
  
  /**
   * Tạo mock response cho merchant validation để tránh lỗi
   * @returns {Object} - Mock validation response
   */
  createMockValidationResponse() {
    const now = Math.floor(Date.now() / 1000);
    const merchantIdentifier = process.env.APPLE_PAY_MERCHANT_IDENTIFIER || 'merchant.com.yourcompany.test';
    const domainName = process.env.APPLE_PAY_DOMAIN || 'localhost';
    const displayName = process.env.APPLE_PAY_DISPLAY_NAME || 'Adyen Apple Pay Demo';
    
    // Create a deterministic mock session identifier
    const sessionId = `mock_session_${now}`;
    const mockSignature = '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';
    
    return {
      merchantIdentifier: merchantIdentifier,
      domainName: domainName,
      displayName: displayName,
      merchantSessionIdentifier: sessionId,
      signature: mockSignature,
      nonce: `mock_nonce_${now}`,
      timestamp: now.toString(),
      epochTimestamp: now.toString(),
      expiresAt: (now + 3600).toString() // Expires in 1 hour
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

      // Create payment request for Adyen
      const paymentRequest = {
        merchantAccount: this.adyenInstance.merchantAccount,
        amount: {
          currency: token.currencyCode || 'USD',
          value: Math.round(token.paymentData.amount * 100) // Convert to cents
        },
        reference: `apple-pay-${Date.now()}`,
        paymentMethod: {
          type: 'applepay',
          applePayToken: token.paymentData
        },
        returnUrl: `https://${process.env.APPLE_PAY_DOMAIN || 'localhost'}/checkout-result`,
        browserInfo: {
          acceptHeader: '*/*',
          userAgent: 'Mozilla/5.0'
        }
      };

      logger.info('Sending payment request to Adyen:', JSON.stringify(paymentRequest, null, 2));

      try {
        // Get base URL based on environment
        const environment = process.env.ADYEN_ENVIRONMENT === 'LIVE' ? 'LIVE' : 'TEST';
        const baseUrl = environment === 'LIVE' 
          ? 'https://checkout-live.adyen.com/v70'
          : 'https://checkout-test.adyen.com/v70';

        // Make payment request to Adyen
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
          logger.error(`Payment failed: ${response.status} ${errorText}`);
          throw new Error(`Payment failed: ${response.status} ${errorText}`);
        }

        const paymentResult = await response.json();
        logger.info('Payment processed successfully:', JSON.stringify(paymentResult, null, 2));
        
        return paymentResult;
      } catch (error) {
        logger.error('Error processing payment with Adyen:', error);
        throw error;
      }
    } catch (error) {
      logger.error('Error processing Apple Pay token:', error);
      throw error;
    }
  }
}

// Export a singleton instance
module.exports = new ApplePayService(); 