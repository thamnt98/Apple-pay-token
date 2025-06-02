# Adyen Apple Pay Integration

A Node.js application that integrates with Adyen SDK to process Apple Pay payments and send payment data to a webhook.

## Features

- Apple Pay integration using Adyen SDK
- Secure handling of payment tokens
- Forwarding payment data to webhook
- Detailed logging for troubleshooting
- Ready for Railway deployment

## Prerequisites

- Node.js 18 or higher
- Adyen account with Apple Pay enabled
- Apple Pay certificate from Adyen
- Railway account for deployment

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   # Adyen API credentials
   ADYEN_API_KEY=your_api_key_here
   ADYEN_MERCHANT_ACCOUNT=your_merchant_account_here
   ADYEN_CLIENT_KEY=your_client_key_here
   ADYEN_ENVIRONMENT=TEST
   
   # Webhook URL
   WEBHOOK_URL=https://webhook.site/c37ecbc0-d876-4b23-99b8-27d428d713e6
   
   # Server configuration
   PORT=3000
   NODE_ENV=development
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## Deployment on Railway

1. Create a new project on [Railway](https://railway.app/)
2. Connect your GitHub repository
3. Configure the environment variables in Railway dashboard:
   - `ADYEN_API_KEY`
   - `ADYEN_MERCHANT_ACCOUNT`
   - `ADYEN_CLIENT_KEY`
   - `ADYEN_ENVIRONMENT` (TEST or LIVE)
   - `WEBHOOK_URL`
   - `NODE_ENV` (production)
4. Deploy the application

## Apple Pay Certificate Setup

1. Obtain the Apple Pay certificate from your Adyen dashboard
2. Follow Adyen's documentation to set up the certificate
3. Make sure the domain is properly configured for Apple Pay

## Testing

To test the Apple Pay integration:
1. Access the application on a compatible device (iPhone, iPad, or Mac)
2. Enter an amount
3. Click the Apple Pay button
4. Complete the payment flow
5. Check the webhook site for the received payment data

## Troubleshooting

The application includes detailed logging:
- Client-side logs are displayed in the browser console and on the UI
- Server-side logs are available in the console and Railway logs
- Check the logs for any errors or issues during the payment process

## License

MIT 