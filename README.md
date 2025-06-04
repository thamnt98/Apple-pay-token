# Apple Pay Token Generator

This application allows users to enter an amount on iPhone Safari, generate an Apple Pay token, and send it to a webhook.

## Prerequisites

1. Apple Developer Account with Apple Pay merchant ID
2. Adyen account with Apple Pay certificate
3. Node.js 16 or higher
4. iPhone with Safari browser

## Setup

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

3. Place your Apple Pay merchant validation file in the `.well-known` directory:
```bash
mkdir -p .well-known
# Copy your apple-developer-merchantid-domain-association file here
```

4. Deploy to Railway:
```bash
railway up
```

## Development

Run the development server:
```bash
npm run dev
```

## Production

The application is configured to deploy on Railway automatically. Push your changes to the main branch to trigger a deployment.

## Important Notes

1. Make sure your domain is registered in your Apple Developer account for Apple Pay
2. The Adyen certificate should be properly configured
3. The application only works on Safari on iOS devices
4. Test the payment flow in development before deploying to production

## Webhook

The application sends Apple Pay tokens to: https://webhook.site/3e1a5a6d-e280-4464-8f2a-a05b70f2d0cf 