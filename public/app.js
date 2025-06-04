async function initializeApplePay() {
    try {
        const response = await fetch('/api/getClientKey', {
            method: 'POST'
        });
        const { clientKey } = await response.json();

        const configuration = {
            environment: 'test',
            clientKey: clientKey,
            analytics: {
                enabled: false
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
                        merchantIdentifier: "000000000304291",
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

        const checkout = await AdyenCheckout(configuration);
        
        const applePayComponent = checkout.create('applepay', {
            onAuthorized: async (response, actions) => {
                try {
                    console.log('Apple Pay response:', response);
                    
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
                    console.error('Error:', error);
                    document.getElementById('status-message').textContent = 'Error: ' + error.message;
                    actions.reject();
                }
            },
            onClick: (resolve, reject) => {
                console.log('Apple Pay button clicked');
                resolve();
            },
            onError: (error) => {
                console.error('Apple Pay error:', error);
                document.getElementById('status-message').textContent = 'Error: ' + error.message;
            }
        });

        const isAvailable = await applePayComponent.isAvailable();
        if (isAvailable) {
            console.log('Apple Pay is available');
            applePayComponent.mount('#apple-pay-button');
        } else {
            console.error('Apple Pay is not available');
            document.getElementById('apple-pay-button').innerHTML = 'Apple Pay is not available';
        }

    } catch (error) {
        console.error('Initialization error:', error);
        document.getElementById('apple-pay-button').innerHTML = 'Error initializing Apple Pay';
        document.getElementById('status-message').textContent = 'Error: ' + error.message;
    }
}

if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    console.error('Apple Pay requires HTTPS except on localhost');
    document.getElementById('apple-pay-button').innerHTML = 'Apple Pay requires HTTPS';
} else {
    initializeApplePay();
} 