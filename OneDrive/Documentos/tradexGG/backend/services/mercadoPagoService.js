/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const { MercadoPagoConfig, Payment } = require('mercadopago');

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const paymentClient = new Payment(client);

async function createPixPayment(amount, email, description) {
  const result = await paymentClient.create({
    body: {
      transaction_amount: amount / 100, // Convert centavos to reais
      payment_method_id: 'pix',
      payer: { email },
      description: description || 'tradexGG - Depósito de saldo',
    },
  });

  return {
    payment_id: result.id,
    status: result.status,
    qr_code: result.point_of_interaction?.transaction_data?.qr_code,
    qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
  };
}

async function getPaymentStatus(paymentId) {
  const result = await paymentClient.get({ id: paymentId });
  return {
    status: result.status,
    amount: Math.round(result.transaction_amount * 100),
  };
}

module.exports = { createPixPayment, getPaymentStatus };
