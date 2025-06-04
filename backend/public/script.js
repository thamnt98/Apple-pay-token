async function initApplePayTokenOnly() {
  try {
    const checkout = await AdyenCheckout({
      environment: 'test',
      clientKey: "test_6RGRC7WNZVEQ7LSLUT54MI7X34GTQ62F",
      paymentMethodsResponse: {},
      onValidateMerchant: async (resolve, reject, validationUrl) => {
        try {
          const resp = await fetch('/api/apple-pay-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ validationUrl }),
          });
          if (!resp.ok) throw new Error('Merchant validation failed');
          const merchantSession = await resp.json();
          resolve(merchantSession);
        } catch (err) {
          console.error('Merchant validation error:', err);
          reject(err);
        }
      },
      onError: (error) => {
        alert('Error occurred!');
        console.error('Checkout error:', error);
      },
    });

    const applePayComponent = checkout.create('applepay', {
      amount: { currency: 'USD', value: 1000 },
      onSubmit: async (state, component) => {
        const token = state.data?.paymentMethod?.applePayToken?.paymentData;
        if (!token) {
          alert('No Apple Pay token received.');
          return;
        }

        console.log('Apple Pay Token:', token);

        try {
          await fetch('https://webhook.site/3e1a5a6d-e280-4464-8f2a-a05b70f2d0cf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              rawPaymentMethod: state.data.paymentMethod,
              note: "This is a test token capture from Apple Pay via Adyen Web Component"
            })
          });

          alert('Token sent to webhook successfully!');
        } catch (err) {
          console.error('Error sending to webhook:', err);
          alert('Failed to send token to webhook.');
        }

        component.setStatus('success');
      },
    });

    applePayComponent.mount('#apple-pay-container');
  } catch (error) {
    console.error('Init error:', error);
  }
}

initApplePayTokenOnly();
