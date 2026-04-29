/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const pool = require('../config/db');

const DAILY_DEPOSIT_LIMIT = 50000 * 100; // R$50.000 por dia

exports.addBalance = async (req, res) => {
  try {
    const { amount } = req.body;
    const amountCents = Math.round(Number(amount));

    if (!Number.isFinite(amountCents) || amountCents < 100 || amountCents > 10000000) {
      return res.status(400).json({ error: 'Valor inválido (mínimo R$1,00, máximo R$100.000,00)' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar total depositado hoje
      const todayTotal = await client.query(
        `SELECT COALESCE(SUM(amount), 0)::bigint AS total
         FROM transactions
         WHERE user_id = $1
           AND type = 'deposit'
           AND created_at >= CURRENT_DATE`,
        [req.userId]
      );
      const depositedToday = Number(todayTotal.rows[0].total);

      if (depositedToday + amountCents > DAILY_DEPOSIT_LIMIT) {
        await client.query('ROLLBACK');
        return res.status(429).json({
          error: `Limite diário de depósito atingido (R$${(DAILY_DEPOSIT_LIMIT / 100).toFixed(0)}/dia).`,
        });
      }

      await client.query(
        'UPDATE users SET balance = balance + $1 WHERE id = $2',
        [amountCents, req.userId]
      );

      await client.query(
        `INSERT INTO transactions (user_id, type, amount, description)
         VALUES ($1, 'deposit', $2, 'Depósito de saldo virtual')`,
        [req.userId, amountCents]
      );

      const result = await client.query(
        'SELECT balance FROM users WHERE id = $1',
        [req.userId]
      );

      await client.query('COMMIT');

      res.json({
        message: 'Saldo adicionado com sucesso',
        added: amountCents,
        new_balance: result.rows[0].balance,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Erro ao adicionar saldo:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, type, amount, description, created_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar transações:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
