async function initAdyen() {
  try {
    // 1. Tạo session từ backend
    const sessionResponse = await fetch('/api/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!sessionResponse.ok) throw new Error('Failed to create session');

    const sessionData = await sessionResponse.json();

    // 2. Khởi tạo Adyen Checkout
    const checkout = await AdyenCheckout({
      environment: 'test',
      clientKey: 'test_CLIENT_KEY', // Thay bằng clientKey của bạn từ Adyen Customer Area
      session: sessionData,
      paymentMethodsConfiguration: {
        applepay: {
          buttonType: 'plain',
          onClick: (resolve, reject) => {
            console.log('Apple Pay button clicked');
            resolve();
          },
        },
      },
      onPaymentCompleted: (result, component) => {
        alert('Payment success!');
        console.log('Payment completed:', result);
      },
      onError: (error, component) => {
        alert('Payment failed!');
        console.error('Error:', error);
      },
    });

    // 3. Mount component Apple Pay
    checkout.create('applepay').mount('#apple-pay-container');
  } catch (error) {
    console.error('Error initializing Adyen:', error);
  }
}

initAdyen();
