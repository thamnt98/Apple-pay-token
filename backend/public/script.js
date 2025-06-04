async function initAdyenApplePay() {
  try {
    // 1. Tạo session payment từ backend
    // Mình dùng demo: tạo payment session chung cho tất cả payment methods
    const sessionResp = await fetch('/api/apple-pay-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validationUrl: null }) // sẽ gửi validationUrl sau trong onValidateMerchant
    });
    // Nhưng session chính xác sẽ được tạo trong onValidateMerchant với validationUrl

    // Thực ra ta sẽ tạo AdyenCheckout với session = null, rồi cài đặt onValidateMerchant để call backend lấy merchant session

    const checkout = await AdyenCheckout({
      environment: 'test',
      clientKey: process.env.ADYEN_CLIENT_KEY, // Thay bằng clientKey Adyen của bạn
      paymentMethodsResponse: {}, // có thể lấy paymentMethods từ backend nếu muốn
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
          console.error(err);
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

    // 2. Tạo component Apple Pay và mount vào DOM
    const applePayComponent = checkout.create('applepay', {
      amount: { currency: 'USD', value: 1000 },
      onSubmit: async (state, component) => {
        try {
          const response = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentMethod: state.data.paymentMethod,
              amount: state.data.amount || { currency: 'USD', value: 1000 },
              reference: 'ORDER-12345',
            }),
          });

          const paymentResult = await response.json();

          if (paymentResult.action) {
            // Nếu trả về action (3DS, redirect...), xử lý bằng checkout.handleAction
            checkout.handleAction(paymentResult.action);
          } else if (paymentResult.resultCode === 'Authorised') {
            alert('Payment authorized!');
          } else {
            alert('Payment failed or refused!');
          }
        } catch (error) {
          alert('Payment error!');
          console.error(error);
        }
      },
    });

    applePayComponent.mount('#apple-pay-container');
  } catch (error) {
    console.error('Init error:', error);
  }
}

initAdyenApplePay();
