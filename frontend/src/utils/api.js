// API Configuration
// In development, use localhost. In production, use the deployed URL
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const defaultApiUrl = isDevelopment ? 'http://localhost:5000/api' : 'https://avesham.onrender.com/api';
export const API_BASE_URL = import.meta.env.VITE_API_URL || defaultApiUrl;

// Log API configuration (helpful for debugging)
console.log('API Configuration:', {
  isDevelopment,
  API_BASE_URL,
  hostname: window.location.hostname,
  env: import.meta.env.MODE
});
export const PUBLIC_API_URL = `${API_BASE_URL}/public`;
export const PAYMENT_API_URL = `${API_BASE_URL}/payment`;
export const ADMIN_API_URL = `${API_BASE_URL}/admin`;
export const ADMIN_AUTH_URL = `${API_BASE_URL}/admin/auth`;

// Razorpay Key
export const RAZORPAY_KEY_ID = "rzp_test_RigiSw2saEwTtc";

// Fetch prices
export const fetchPrices = async () => {
  try {
    const res = await fetch(`${PUBLIC_API_URL}/prices`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.dayPass === 'number' && typeof data.seasonPass === 'number') {
        return data;
      }
    }
  } catch (err) {
    console.error('Price fetch error:', err);
  }
  return { dayPass: 199, seasonPass: 699 }; // Default prices
};

// Create Razorpay order
export const createOrder = async (amount) => {
  const res = await fetch(`${PAYMENT_API_URL}/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount })
  });
  return res.json();
};

// Verify payment
export const verifyPayment = async (paymentData) => {
  const res = await fetch(`${PAYMENT_API_URL}/verify-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData)
  });
  return res.json();
};

