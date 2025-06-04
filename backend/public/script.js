async function initAdyenApplePay() {
  try {
    // Tạo AdyenCheckout, không cần tạo session lúc này
    const checkout = await AdyenCheckout({
      environment: 'test',
      clientKey: "test_6RGRC7WNZVEQ7LSLUT54MI7X34GTQ62F", // Thay bằng Client Key Adyen của bạn
      paymentMethodsResponse: {}, // hoặc lấy từ backend nếu cần
      onValidateMerchant: async (resolve, reject, validationUrl) => {
        try {
          // Gửi validationUrl đến backend để tạo merchant session Apple Pay
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
      onPaymentCompleted: (result) => {
        alert('Payment successful!');
        console.log('Payment completed:', result);
      },
      onError: (error) => {
        alert('Payment failed!');
        console.error('Payment error:', error);
      },
    });

    // Tạo component Apple Pay và mount
    const applePayComponent = checkout.create('applepay', {
      amount: { currency: 'USD', value: 1000 }, // $10.00
      onSubmit: async (state, component) => {
        try {
          const response = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentMethod: state.data.paymentMethod,
              amount: state.data.amount, // lấy trực tiếp từ state.data.amount
              reference: 'ORDER-12345',
            }),
          });

          const paymentResult = await response.json();

          if (paymentResult.action) {
            checkout.handleAction(paymentResult.action);
          } else if (paymentResult.resultCode === 'Authorised') {
            alert('Payment authorized!');
          } else {
            alert('Payment failed or refused!');
          }
        } catch (error) {
          alert('Payment processing error!');
          console.error(error);
        }
      },
    });

    applePayComponent.mount('#apple-pay-container');
  } catch (error) {
    console.error('Init Adyen Apple Pay error:', error);
  }
}

initAdyenApplePay();
