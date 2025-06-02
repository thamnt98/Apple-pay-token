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
                
                // Merge configuration from server with default values
                const applePayComponentConfig = {
                    amount: {
                        currency: 'USD',
                        value: getAmountInCents()
                    },
                    countryCode: 'US',
                    configuration: {
                        merchantName: applePayConfig.displayName || 'Adyen Apple Pay Demo',
                        merchantIdentifier: applePayConfig.merchantIdentifier || applePayMethod.configuration?.merchantIdentifier
                    },
                    onSubmit: (state, component) => {
                        if (state.isValid) {
                            handleApplePaySubmit(state.data);
                        } else {
                            log('Invalid Apple Pay state', 'error');
                            console.error('Invalid state:', state);
                        }
                    },
                    onError: (error) => {
                        log(`Apple Pay error: ${error.message}`, 'error');
                        console.error('Apple Pay error details:', error);
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
                    applePayComponent.update({
                        amount: {
                            currency: 'USD',
                            value: getAmountInCents()
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
        } catch (error) {
            log(`Error processing payment: ${error.message}`, 'error');
            showStatus(`Error: ${error.message}`, 'error');
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