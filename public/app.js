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
    function initializeApplePay() {
        try {
            // Check if Apple Pay is available in the payment methods
            const applePayMethod = config.paymentMethodsResponse.paymentMethods?.find(
                method => method.type === 'applepay'
            );
            
            if (!applePayMethod) {
                log('Apple Pay is not available in the payment methods', 'info');
                applePayButton.style.display = 'none';
                return;
            }
            
            // Check if the device supports Apple Pay
            if (!window.ApplePaySession || !ApplePaySession.canMakePayments()) {
                log('This device does not support Apple Pay', 'info');
                applePayButton.style.display = 'none';
                return;
            }
            
            log('Apple Pay is available', 'success');
            
            // Initialize Adyen Web
            const checkout = new AdyenCheckout({
                clientKey: config.clientKey,
                environment: config.environment,
                paymentMethodsResponse: config.paymentMethodsResponse,
                onError: (error) => {
                    log(`Adyen error: ${error.message}`, 'error');
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
                    merchantIdentifier: applePayMethod.configuration?.merchantIdentifier
                },
                onSubmit: (state, component) => {
                    if (state.isValid) {
                        handleApplePaySubmit(state.data);
                    }
                },
                onError: (error) => {
                    log(`Apple Pay error: ${error.message}`, 'error');
                    showStatus(`Error: ${error.message}`, 'error');
                }
            });
            
            // Mount Apple Pay button
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
        } catch (error) {
            log(`Error initializing Apple Pay: ${error.message}`, 'error');
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