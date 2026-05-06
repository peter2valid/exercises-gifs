const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API_URL = 'https://api.paystack.co';

export async function initializeTransaction(email: string, amount: number, metadata: any) {
  const response = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: amount * 100, // Paystack expects amount in kobo/cents
      metadata,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paystack/callback`,
    }),
  });

  const data = await response.json();
  if (!data.status) {
    throw new Error(data.message || 'Failed to initialize Paystack transaction');
  }

  return data.data;
}

export async function verifyTransaction(reference: string) {
  const response = await fetch(`${PAYSTACK_API_URL}/transaction/verify/${reference}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  const data = await response.json();
  if (!data.status) {
    throw new Error(data.message || 'Failed to verify Paystack transaction');
  }

  return data.data;
}

export function verifyWebhookSignature(payload: string, signature: string) {
  const crypto = require('crypto');
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(payload).digest('hex');
  return hash === signature;
}
