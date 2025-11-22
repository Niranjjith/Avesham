// Razorpay integration
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => resolve(null);
    document.body.appendChild(script);
  });
};

export const openRazorpayCheckout = (options) => {
  return loadRazorpayScript().then((Razorpay) => {
    if (!Razorpay) {
      throw new Error('Razorpay SDK failed to load');
    }
    return new Razorpay(options);
  });
};



