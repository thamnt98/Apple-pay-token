const fetch = require('node-fetch');
const logger = require('../utils/logger');
const adyenService = require('./adyen');

/**
 * Service to handle sending data to webhook
 */
class WebhookService {
  constructor() {
    this.webhookUrl = process.env.WEBHOOK_URL;
    if (!this.webhookUrl) {
      logger.warn('WEBHOOK_URL is not configured');
    }
    logger.info('Webhook service initialized');
  }
  
  /**
   * Send Apple Pay token data to webhook
   * @param {Object} token - Apple Pay token received from client
   * @returns {Promise<Object>} - Response from webhook
   */
  async sendToWebhook(token) {
    try {
      logger.info('Processing Apple Pay token before sending to webhook');
      
      // Process the token using Adyen service to extract payment data
      const paymentData = await adyenService.processApplePayToken(token);
      
      logger.info(`Sending payment data to webhook: ${this.webhookUrl}`);
      
      // Send data to webhook
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'adyen-apple-pay',
          timestamp: new Date().toISOString(),
          paymentData
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Webhook responded with error: ${response.status} ${errorText}`);
        throw new Error(`Webhook error: ${response.status} ${errorText}`);
      }
      
      const responseData = await response.text();
      logger.info('Successfully sent data to webhook');
      
      return {
        success: true,
        statusCode: response.status,
        response: responseData
      };
    } catch (error) {
      logger.error('Error sending data to webhook:', error);
      throw error;
    }
  }
}

// Export a singleton instance
module.exports = new WebhookService(); 