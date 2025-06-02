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
        paymentMethodsResponse: null,
        sessionId: null,
        sessionData: null
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
    
    // Initialize Adyen and get session data
    async function initializeAdyen() {
        try {
            log('Initializing Adyen...');
            showStatus('Initializing payment system...', 'info');
            
            // Get session data from server
            const response = await fetch('/api/getSession', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get session: ${response.status} ${errorText}`);
            }
            
            const data = await response.json();
            config = {
                clientKey: data.clientKey,
                environment: data.environment,
                sessionId: data.id,
                sessionData: data.sessionData
            };
            
            log('Session data received successfully', 'success');
            showStatus('Payment system ready', 'success');
            
            // Initialize Apple Pay
            initializeApplePay();
        } catch (error) {
            log(`Error initializing Adyen: ${error.message}`, 'error');
            showStatus(`Error: ${error.message}`, 'error');
        }
    }
    
    // Initialize Apple Pay
    async function initializeApplePay() {
        try {
            // Check if Apple Pay is available
            if (!window.ApplePaySession || !ApplePaySession.canMakePayments()) {
                log('Apple Pay is not available on this device', 'info');
                applePayButton.style.display = 'none';
                return;
            }
            
            // Create Adyen Checkout instance
            const checkout = await AdyenCheckout({
                clientKey: config.clientKey,
                environment: config.environment,
                session: {
                    id: config.sessionId,
                    sessionData: config.sessionData
                },
                onPaymentCompleted: (result) => {
                    log('Payment completed:', 'success');
                    showStatus('Payment successful!', 'success');
                },
                onError: (error) => {
                    log(`Error: ${error.message}`, 'error');
                    showStatus(`Error: ${error.message}`, 'error');
                }
            });
            
            // Create Apple Pay component
            const applePayComponent = checkout.create('applepay', {
                amount: {
                    currency: 'USD',
                    value: getAmountInCents()
                },
                countryCode: 'US',
                configuration: {
                    merchantName: 'Adyen Apple Pay Demo',
                    merchantIdentifier: config.merchantIdentifier
                },
                onClick: (resolve, reject) => {
                    log('Apple Pay button clicked', 'info');
                    resolve();
                },
                onValidateMerchant: async (resolve, reject, validationURL) => {
                    try {
                        log('Validating merchant...', 'info');
                        
                        const response = await fetch('/api/validateApplePayMerchant', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ validationURL })
                        });
                        
                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`Merchant validation failed: ${response.status} ${errorText}`);
                        }
                        
                        const validationData = await response.json();
                        log('Merchant validation successful', 'success');
                        resolve(validationData);
                    } catch (error) {
                        log(`Merchant validation error: ${error.message}`, 'error');
                        reject(error);
                    }
                },
                onAuthorized: async (resolve, reject, event) => {
                    try {
                        log('Payment authorized by user', 'success');
                        
                        const response = await fetch('/api/processApplePayment', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(event.payment)
                        });
                        
                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`Payment processing failed: ${response.status} ${errorText}`);
                        }
                        
                        const result = await response.json();
                        log('Payment processed successfully', 'success');
                        resolve(result);
                    } catch (error) {
                        log(`Payment processing error: ${error.message}`, 'error');
                        reject(error);
                    }
                },
                onCancel: () => {
                    log('Payment cancelled by user', 'info');
                    showStatus('Payment cancelled', 'info');
                }
            });
            
            // Mount Apple Pay button
            applePayComponent.mount(applePayButton);
            
            // Update amount when input changes
            amountInput.addEventListener('change', () => {
                const newAmount = getAmountInCents();
                applePayComponent.update({
                    amount: {
                        currency: 'USD',
                        value: newAmount
                    }
                });
            });
            
            log('Apple Pay initialized successfully', 'success');
        } catch (error) {
            log(`Error initializing Apple Pay: ${error.message}`, 'error');
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