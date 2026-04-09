const pool = require('../config/db');
const { createPixPayment, getPaymentStatus } = require('../services/mercadoPagoService');

exports.createPix = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 500) {
      return res.status(400).json({ error: 'Valor mínimo de R$5,00' });
    }

    // Get user email
    const userResult = await pool.query(
      'SELECT email FROM users WHERE id = $1',
      [req.userId]
    );

    const pixData = await createPixPayment(amount, userResult.rows[0].email);

    // Save payment record
    await pool.query(
      `INSERT INTO payments (user_id, amount, status, mp_payment_id, mp_qr_code, mp_qr_code_base64)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.userId, amount, pixData.status, pixData.payment_id, pixData.qr_code, pixData.qr_code_base64]
    );

    res.json({
      payment_id: pixData.payment_id,
      qr_code: pixData.qr_code,
      qr_code_base64: pixData.qr_code_base64,
    });
  } catch (err) {
    console.error('Erro ao criar PIX:', err);
    res.status(500).json({ error: 'Erro ao gerar pagamento PIX' });
  }
};

exports.webhook = async (req, res) => {
  try {
    const { action, data } = req.body;

    if (action === 'payment.updated' || action === 'payment.created') {
      const mpPaymentId = String(data.id);

      const paymentStatus = await getPaymentStatus(mpPaymentId);

      if (paymentStatus.status === 'approved') {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          const paymentResult = await client.query(
            'SELECT id, user_id, amount, status FROM payments WHERE mp_payment_id = $1 FOR UPDATE',
            [mpPaymentId]
          );

          if (paymentResult.rows.length > 0 && paymentResult.rows[0].status !== 'approved') {
            const payment = paymentResult.rows[0];

            await client.query(
              "UPDATE payments SET status = 'approved', updated_at = NOW() WHERE id = $1",
              [payment.id]
            );

            await client.query(
              'UPDATE users SET balance = balance + $1 WHERE id = $2',
              [payment.amount, payment.user_id]
            );
          }

          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Erro no webhook:', err);
    res.sendStatus(500);
  }
};

exports.checkStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const result = await pool.query(
      'SELECT status, amount FROM payments WHERE mp_payment_id = $1 AND user_id = $2',
      [paymentId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao verificar status:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.history = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, amount, status, created_at FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [req.userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar histórico:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
