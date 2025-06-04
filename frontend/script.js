async function initCheckout() {
    try {
      const response = await fetch("https://apple-pay-token-production.up.railway.app/api/sessions", {
        method: "POST",
      });
      const session = await response.json();
  
      const checkout = await AdyenCheckout({
        environment: "test",
        clientKey: process.env.ADYEN_CLIENT_KEY,
        session,
        paymentMethodsConfiguration: {
          applepay: {
            amount: {
              value: 1000,
              currency: "USD"
            },
            countryCode: "US",
            buttonType: "buy",
            buttonColor: "black"
          }
        }
      });
  
      checkout.create("applepay").mount("#applepay-container");
    } catch (err) {
      console.error("Checkout error:", err);
    }
  }
  
  initCheckout();
  