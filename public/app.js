document.addEventListener('DOMContentLoaded', async () => {
    // DOM elements
    const paymentStatus = document.getElementById('payment-status');
    const applePayButton = document.getElementById('apple-pay-button');
    const adyenContainer = document.getElementById('adyen-payment-container');
    const logContainer = document.getElementById('log-container');
    const amountInput = document.getElementById('amount');
    
    // Configuration
    let config = {
        clientKey: '',
        environment: '',
        paymentMethodsResponse: null
    };
    
    // Logger function
    function log(message, type = 'info') {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        console.log(`[${type}] ${message}`);
    }
    
    // Show status message
    function showStatus(message, type = 'info') {
        paymentStatus.textContent = message;
        paymentStatus.className = `payment-status ${type}`;
    }
    
    // Initialize Adyen and get payment methods
    async function initializeAdyen() {
        try {
            log('Initializing Adyen...');
            showStatus('Initializing payment system...', 'info');
            
            const response = await fetch('/api/getPaymentMethods', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get payment methods: ${response.status} ${errorText}`);
            }
            
            const data = await response.json();
            config = data;
            
            log('Adyen initialized successfully', 'success');
            showStatus('Payment system ready', 'success');
            
            // Check if Apple Pay is available
            initializeApplePay();
        } catch (error) {
            log(`Error initializing Adyen: ${error.message}`, 'error');
            showStatus(`Error: ${error.message}`, 'error');
        }
    }
    
    // Initialize Apple Pay
    async function initializeApplePay() {
        try {
            // Check if Apple Pay is available in the payment methods
            log('Checking for Apple Pay in payment methods...', 'info');
            console.log('Payment methods response:', config.paymentMethodsResponse);
            
            const applePayMethod = config.paymentMethodsResponse.paymentMethods?.find(
                method => method.type === 'applepay'
            );
            
            if (!applePayMethod) {
                log('Apple Pay is not available in the payment methods', 'info');
                applePayButton.style.display = 'none';
                return;
            }
            
            log('Found Apple Pay method:', 'info');
            console.log('Apple Pay method details:', applePayMethod);
            
            // Check if the device supports Apple Pay
            log('Checking if device supports Apple Pay...', 'info');
            if (!window.ApplePaySession) {
                log('ApplePaySession is not available on this device', 'info');
                applePayButton.style.display = 'none';
                return;
            }
            
            // Check if the browser supports Apple Pay
            if (!ApplePaySession.canMakePayments()) {
                log('This device cannot make Apple Pay payments', 'info');
                applePayButton.style.display = 'none';
                return;
            }
            
            log('Apple Pay is available', 'success');
            
            // Get Apple Pay session data from server
            log('Fetching Apple Pay session data...', 'info');
            let applePayConfig = {};
            try {
                const sessionResponse = await fetch('/api/getApplePaySession', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!sessionResponse.ok) {
                    const errorText = await sessionResponse.text();
                    throw new Error(`Failed to get Apple Pay session: ${sessionResponse.status} ${errorText}`);
                }
                
                applePayConfig = await sessionResponse.json();
                log('Apple Pay session data received', 'success');
                console.log('Apple Pay session data:', applePayConfig);
            } catch (sessionError) {
                log(`Error fetching Apple Pay session: ${sessionError.message}`, 'error');
                console.error('Session error details:', sessionError);
                // Continue with default configuration from Adyen
            }
            
            // Make sure AdyenCheckout is available
            log('Checking if AdyenCheckout is available...', 'info');
            if (typeof AdyenCheckout !== 'function') {
                throw new Error('AdyenCheckout is not loaded properly');
            }
            
            // Initialize Adyen Web with proper async handling
            try {
                log('Creating AdyenCheckout instance...', 'info');
                console.log('Checkout configuration:', {
                    clientKey: config.clientKey,
                    environment: config.environment,
                    paymentMethodsResponse: config.paymentMethodsResponse
                });
                
                // Create the AdyenCheckout instance
                const checkout = await AdyenCheckout({
                    clientKey: config.clientKey,
                    environment: config.environment,
                    paymentMethodsResponse: config.paymentMethodsResponse,
                    onError: (error) => {
                        log(`Adyen error: ${error.message}`, 'error');
                        console.error('Adyen error details:', error);
                        showStatus(`Error: ${error.message}`, 'error');
                    }
                });
                
                log('AdyenCheckout created successfully', 'success');
                
                // Create Apple Pay component
                log('Creating Apple Pay component...', 'info');
                
                // Use the merchant identifier from the server or fallback to the one from Adyen
                const merchantIdentifier = applePayConfig.merchantIdentifier || 
                                          applePayMethod.configuration?.merchantIdentifier;
                
                if (!merchantIdentifier) {
                    throw new Error('No merchant identifier available for Apple Pay');
                }
                
                log(`Using merchant identifier: ${merchantIdentifier}`, 'info');
                
                // Merge configuration from server with default values
                const applePayComponentConfig = {
                    amount: {
                        currency: 'USD',
                        value: getAmountInCents()
                    },
                    countryCode: 'US',
                    configuration: {
                        merchantName: applePayConfig.displayName || 'Adyen Apple Pay Demo',
                        merchantIdentifier: merchantIdentifier
                    },
                    paymentRequest: {
                        version: 3,
                        countryCode: 'US',
                        currencyCode: 'USD',
                        merchantCapabilities: [
                            'supports3DS'
                        ],
                        supportedNetworks: ['visa', 'masterCard', 'amex'],
                        total: {
                            label: applePayConfig.displayName || 'Adyen Apple Pay Demo',
                            type: 'final',
                            amount: (getAmountInCents() / 100).toString()
                        },
                        requiredBillingContactFields: ['name', 'phoneNumber', 'email', 'postalAddress'],
                        requiredShippingContactFields: []
                    },
                    onValidateMerchant: async (resolve, reject, validationURL) => {
                        try {
                            log(`Validating merchant with URL: ${validationURL}`, 'info');
                            console.log('Validation URL:', validationURL);
                            
                            const response = await fetch('/api/validateApplePayMerchant', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ 
                                    validationURL,
                                    domain: window.location.hostname
                                })
                            });
                            
                            if (!response.ok) {
                                const errorText = await response.text();
                                console.error('Validation error response:', errorText);
                                throw new Error(`Merchant validation failed: ${response.status} ${errorText}`);
                            }
                            
                            const data = await response.json();
                            log('Merchant validation successful', 'success');
                            console.log('Validation response:', data);
                            log('About to show Apple Pay sheet...', 'info');
                            resolve(data);
                            log('Apple Pay sheet should appear now', 'info');
                        } catch (error) {
                            log(`Merchant validation error: ${error.message}`, 'error');
                            console.error('Validation error:', error);
                            reject(error);
                        }
                    },
                    onPaymentMethodSelected: (resolve, reject, event) => {
                        log('Payment method selected by user', 'info');
                        console.log('Payment method event:', event);
                        try {
                            const total = {
                                label: applePayConfig.displayName || 'Adyen Apple Pay Demo',
                                type: 'final',
                                amount: (getAmountInCents() / 100).toString()
                            };
                            log(`Updating total amount: ${total.amount}`, 'info');
                            resolve({
                                newTotal: total
                            });
                        } catch (error) {
                            log(`Error in payment method selection: ${error.message}`, 'error');
                            console.error('Payment method selection error:', error);
                            reject(error);
                        }
                    },
                    onPaymentAuthorized: async (resolve, reject, event) => {
                        try {
                            log('Payment authorized by user - processing payment...', 'success');
                            console.log('Full payment data:', event.payment);
                            
                            // Process the payment
                            log('Sending payment data to server...', 'info');
                            const response = await handleApplePaySubmit(event.payment);
                            
                            if (response && response.resultCode === "Authorised") {
                                log('Payment processed successfully', 'success');
                                resolve(event.payment);
                            } else {
                                const errorMsg = response ? `Payment failed: ${response.resultCode}` : 'Payment processing failed';
                                log(errorMsg, 'error');
                                throw new Error(errorMsg);
                            }
                        } catch (error) {
                            log(`Payment processing error: ${error.message}`, 'error');
                            console.error('Processing error details:', error);
                            reject(error);
                        }
                    },
                    onCancel: () => {
                        log('Apple Pay payment cancelled by user', 'info');
                        console.log('Payment sheet was dismissed by user');
                    },
                    onError: (error) => {
                        log(`Apple Pay error: ${error.message}`, 'error');
                        log(`Apple Pay error details: ${JSON.stringify(error)}`, 'error');
                        console.error('Full Apple Pay error:', error);
                        showStatus(`Error: ${error.message}`, 'error');
                    }
                };
                
                console.log('Apple Pay component configuration:', applePayComponentConfig);
                
                const applePayComponent = checkout.create('applepay', applePayComponentConfig);
                
                // Mount Apple Pay button
                log('Mounting Apple Pay component...', 'info');
                applePayComponent.mount(applePayButton);
                
                // Update amount when input changes
                amountInput.addEventListener('change', () => {
                    const newAmount = getAmountInCents();
                    applePayComponent.update({
                        amount: {
                            currency: 'USD',
                            value: newAmount
                        },
                        paymentRequest: {
                            total: {
                                label: applePayConfig.displayName || 'Adyen Apple Pay Demo',
                                type: 'final',
                                amount: (newAmount / 100).toString()
                            }
                        }
                    });
                });
                
                log('Apple Pay initialized successfully', 'success');
            } catch (checkoutError) {
                log(`Error creating AdyenCheckout: ${checkoutError.message}`, 'error');
                console.error('Checkout error details:', checkoutError);
                throw checkoutError;
            }
        } catch (error) {
            log(`Error initializing Apple Pay: ${error.message}`, 'error');
            console.error('Apple Pay initialization error:', error);
            showStatus(`Error: ${error.message}`, 'error');
        }
    }
    
    // Handle Apple Pay submission
    async function handleApplePaySubmit(data) {
        try {
            log('Apple Pay payment authorized, processing token...', 'info');
            showStatus('Processing payment...', 'info');
            
            const response = await fetch('/api/submitApplePayToken', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: data
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to process payment: ${response.status} ${errorText}`);
            }
            
            const result = await response.json();
            
            log('Payment data sent to webhook successfully', 'success');
            showStatus('Payment data sent successfully!', 'success');
            
            // Log the webhook response
            log(`Webhook response: ${JSON.stringify(result)}`, 'info');
            return result;
        } catch (error) {
            log(`Error processing payment: ${error.message}`, 'error');
            showStatus(`Error: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // Get amount in cents from the input
    function getAmountInCents() {
        const amount = parseFloat(amountInput.value || '0');
        return Math.round(amount * 100);
    }
    
    // Initialize
    initializeAdyen();
}); 