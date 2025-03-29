import crypto from 'crypto';

export function generatePaymentReference(studentId) {
  const timestamp = Date.now().toString();
  const randomString = crypto.randomBytes(4).toString('hex');
  return `HUPS-${timestamp.slice(-6)}-${randomString.toUpperCase()}`;
}

export function validatePaymentReference(reference) {
  const pattern = /^HUPS-\d{6}-[A-F0-9]{8}$/;
  return pattern.test(reference);
}

export function formatAmount(amount) {
  return amount.toLocaleString('en-ET', {
    style: 'currency',
    currency: 'ETB'
  });
}

export function generatePaymentInstructions(paymentReference) {
  return `
🔵 Payment Instructions:

1. Amount: ${formatAmount(100)} (One Hundred Birr)
2. Payment Reference: ${paymentReference}
3. Payment Methods:
   - CBE Birr
   - TeleBirr

Please make sure to:
1. Use the exact payment reference
2. Take a screenshot of the payment confirmation
3. Send the screenshot back to this bot

Your payment reference is: ${paymentReference}
`;
} 