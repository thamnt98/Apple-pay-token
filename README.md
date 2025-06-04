# Apple Pay Token Demo

This project demonstrates how to get an Apple Pay token using Adyen's Apple Pay certificate and send it to a webhook URL.

## Prerequisites

- Node.js installed
- An Adyen account with Apple Pay enabled
- Access to Adyen's test environment

## Setup

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
ADYEN_API_KEY=your_api_key_here
ADYEN_MERCHANT_ACCOUNT=your_merchant_account_here
ADYEN_CLIENT_KEY=your_client_key_here
WEBHOOK_URL=https://webhook.site/3e1a5a6d-e280-4464-8f2a-a05b70f2d0cf
```

4. Replace the placeholder values in the `.env` file with your actual Adyen credentials:
   - Get your API key from your Adyen Customer Area
   - Get your merchant account name from your Adyen Customer Area
   - Get your client key from your Adyen Customer Area

## Running the Application

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to `http://localhost:3000`

3. Click the Apple Pay button to initiate the payment flow

4. The Apple Pay token will be sent to the specified webhook URL

## Notes

- This demo uses Adyen's test environment
- The payment amount is set to 0 since we're only interested in getting the token
- Make sure you're using Safari on macOS or iOS to test Apple Pay
- The webhook URL will receive the Apple Pay token in the following format:
```json
{
  "applePayToken": {
    // Token data
  }
}
``` 