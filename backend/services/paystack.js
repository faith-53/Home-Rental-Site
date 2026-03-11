const axios = require('axios');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';
const PAYSTACK_DEFAULT_CURRENCY = process.env.PAYSTACK_CURRENCY || 'KES';
const PAYSTACK_CALLBACK_URL = process.env.PAYSTACK_CALLBACK_URL;

if (!PAYSTACK_SECRET_KEY) {
  // eslint-disable-next-line no-console
  console.warn('PAYSTACK_SECRET_KEY is not set. Paystack payments will not work until it is configured.');
}

if (!PAYSTACK_CALLBACK_URL) {
  // eslint-disable-next-line no-console
  console.warn('PAYSTACK_CALLBACK_URL is not set. Paystack callback will not work until it is configured.');
}

async function initializePayment({ amount, email, name, bookingId }) {
  if (!PAYSTACK_SECRET_KEY || !PAYSTACK_CALLBACK_URL) {
    throw new Error('Payment configuration incomplete. Please contact support.');
  }

  // Convert amount to kobo (Paystack expects amount in smallest currency unit)
  const amountInKobo = Math.round(amount * 100);

  const payload = {
    amount: amountInKobo,
    email,
    currency: PAYSTACK_DEFAULT_CURRENCY,
    callback_url: PAYSTACK_CALLBACK_URL,
    metadata: {
      name,
      bookingId,
      custom_fields: [
        {
          display_name: "Booking ID",
          variable_name: "booking_id",
          value: bookingId
        },
        {
          display_name: "Customer Name",
          variable_name: "customer_name",
          value: name
        }
      ]
    },
  };

  const res = await axios.post(`${PAYSTACK_BASE_URL}/transaction/initialize`, payload, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const data = res.data;
  if (!data.status || !data.data?.authorization_url) {
    throw new Error('Unable to initialize payment. Please try again.');
  }

  return {
    paymentLink: data.data.authorization_url,
    reference: data.data.reference,
  };
}

async function verifyTransaction(reference) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Payment configuration incomplete. Please contact support.');
  }

  const res = await axios.get(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  const data = res.data;

  if (!data.status) {
    throw new Error('Unable to verify payment at this time.');
  }

  const transaction = data.data;

  if (transaction.status !== 'success') {
    throw new Error('Payment not successful.');
  }

  return data; // Return full response as it contains the metadata needed
}

module.exports = {
  initializePayment,
  verifyTransaction,
};