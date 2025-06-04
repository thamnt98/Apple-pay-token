async function initializeApplePay() {
    try {
        console.log('Starting Apple Pay initialization...');
        const response = await fetch('/api/getClientKey', {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error('Failed to get client key from server');
        }
        
        const { clientKey } = await response.json();
        console.log('Received client key from server');

        const configuration = {
            environment: 'test',
            clientKey: clientKey,
            analytics: {
                enabled: false
            },
            amount: {
                value: 1000,
                currency: 'USD'
            },
            paymentMethodsConfiguration: {
                applepay: {
                    amount: {
                        value: 1000,
                        currency: 'USD'
                    },
                    countryCode: 'US',
                    merchantName: 'Test Store',
                    configuration: {
                        merchantDisplayName: 'Test Store',
                        merchantIdentifier: "000000000304291", // Update this with your merchant identifier
                        merchantCapabilities: [
                            "supports3DS",
                            "supportsCredit",
                            "supportsDebit"
                        ],
                        supportedNetworks: [
                            "visa",
                            "masterCard",
                            "amex",
                            "discover"
                        ],
                        lineItems: [
                            {
                                label: 'Test Item',
                                amount: 1000
                            }
                        ],
                        requiredBillingContactFields: ["postalAddress", "name"],
                        requiredShippingContactFields: []
                    }
                }
            }
        };

        console.log('Creating Adyen Checkout instance...');
        const checkout = await AdyenCheckout(configuration);
        console.log('Adyen Checkout instance created');
        
        const applePayComponent = checkout.create('applepay', {
            onAuthorized: async (response, actions) => {
                try {
                    console.log('Apple Pay authorized:', response);
                    
                    const webhookResponse = await fetch('/api/sendTokenToWebhook', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            token: response.applePayToken,
                            paymentData: response.paymentData
                        })
                    });

                    if (!webhookResponse.ok) {
                        throw new Error('Failed to send token to webhook');
                    }

                    document.getElementById('status-message').textContent = 'Token sent successfully!';
                    console.log('Token sent to webhook successfully');
                    actions.resolve();
                } catch (error) {
                    console.error('Error in onAuthorized:', error);
                    document.getElementById('status-message').textContent = 'Error: ' + error.message;
                    actions.reject();
                }
            },
            onClick: (resolve, reject) => {
                console.log('Apple Pay button clicked');
                // Check if Apple Pay is properly initialized
                if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
                    console.log('Apple Pay is available and can make payments');
                    resolve();
                } else {
                    console.error('Apple Pay is not available or cannot make payments');
                    reject(new Error('Apple Pay is not available'));
                }
            },
            onError: (error) => {
                console.error('Apple Pay error:', error);
                document.getElementById('status-message').textContent = 'Error: ' + error.message;
            }
        });

        console.log('Checking Apple Pay availability...');
        const isAvailable = await applePayComponent.isAvailable();
        console.log('Apple Pay availability:', isAvailable);
        
        if (isAvailable) {
            console.log('Mounting Apple Pay button...');
            applePayComponent.mount('#apple-pay-button');
            document.getElementById('status-message').textContent = 'Apple Pay is ready!';
        } else {
            console.error('Apple Pay is not available');
            document.getElementById('apple-pay-button').innerHTML = 'Apple Pay is not available';
            document.getElementById('status-message').textContent = 'Error: Apple Pay is not available on this device/browser';
        }

    } catch (error) {
        console.error('Initialization error:', error);
        document.getElementById('apple-pay-button').innerHTML = 'Error initializing Apple Pay';
        document.getElementById('status-message').textContent = 'Error: ' + error.message;
    }
}

// Check if we're in a secure context
if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    console.error('Apple Pay requires HTTPS except on localhost');
    document.getElementById('apple-pay-button').innerHTML = 'Apple Pay requires HTTPS';
    document.getElementById('status-message').textContent = 'Error: Apple Pay requires HTTPS except on localhost';
} else {
    console.log('Starting initialization...');
    console.log('Protocol:', window.location.protocol);
    console.log('Hostname:', window.location.hostname);
    initializeApplePay();
} 