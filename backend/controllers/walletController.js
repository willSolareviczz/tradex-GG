/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const pool = require('../config/db');
const { createNotification } = require('../services/notificationService');

const DAILY_DEPOSIT_LIMIT = 50000 * 100; // R$50.000 por dia
const REFERRER_BONUS      = 1000;        // centavos (R$10)

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

      // Trigger referrer bonus on first deposit — SELECT FOR UPDATE previne double-credit
      const refCheck = await client.query(
        'SELECT referred_by, referral_bonus_paid FROM users WHERE id = $1 FOR UPDATE', [req.userId]
      );
      const refRow = refCheck.rows[0];
      if (refRow?.referred_by && !refRow.referral_bonus_paid) {
        await client.query(
          'UPDATE users SET referral_bonus_paid = TRUE WHERE id = $1', [req.userId]
        );
        await client.query(
          'UPDATE users SET balance = balance + $1 WHERE id = $2',
          [REFERRER_BONUS, refRow.referred_by]
        );
        await client.query(
          `INSERT INTO transactions (user_id, type, amount, description)
           VALUES ($1, 'deposit', $2, 'Bônus de indicação')`,
          [refRow.referred_by, REFERRER_BONUS]
        );
        setImmediate(() => createNotification(
          refRow.referred_by, 'referral',
          `Bônus de indicação recebido! 💰`,
          `Seu amigo fez o primeiro depósito. Você ganhou R$10,00!`,
          '/profile.html'
        ));
      }

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

exports.withdraw = async (req, res) => {
  try {
    const { amount, pix_key } = req.body;
    const amountCents = Math.round(Number(amount));

    if (!Number.isFinite(amountCents) || amountCents < 1000 || amountCents > 10000000) {
      return res.status(400).json({ error: 'Valor inválido (mínimo R$10,00, máximo R$100.000,00)' });
    }

    if (!pix_key || pix_key.toString().trim().length < 5) {
      return res.status(400).json({ error: 'Chave PIX inválida' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userRes = await client.query(
        'SELECT balance FROM users WHERE id = $1 FOR UPDATE', [req.userId]
      );
      const { balance } = userRes.rows[0];

      if (balance < amountCents) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Saldo insuficiente' });
      }

      await client.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2',
        [amountCents, req.userId]
      );

      const pixMasked = pix_key.toString().trim().slice(0, 50);
      await client.query(
        `INSERT INTO transactions (user_id, type, amount, description, status, pix_key)
         VALUES ($1, 'withdrawal', $2, $3, 'pending', $4)`,
        [req.userId, amountCents, `Saque PIX para ${pixMasked}`, pixMasked]
      );

      const newBalRes = await client.query(
        'SELECT balance FROM users WHERE id = $1', [req.userId]
      );

      await client.query('COMMIT');

      res.json({
        message: 'Solicitação de saque registrada. Processamento em até 24h.',
        withdrawn: amountCents,
        new_balance: newBalRes.rows[0].balance,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Erro ao sacar:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const type  = req.query.type || null; // 'deposit' | 'withdrawal' | 'case_open'
    const offset = (page - 1) * limit;

    const conditions = ['user_id = $1'];
    const params     = [req.userId];
    if (type) { conditions.push(`type = $${params.push(type)}`); }

    const where = conditions.join(' AND ');

    const [rows, countRes] = await Promise.all([
      pool.query(
        `SELECT id, type, amount, description, status, created_at
         FROM transactions
         WHERE ${where}
         ORDER BY created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        params
      ),
      pool.query(`SELECT COUNT(*)::int AS total FROM transactions WHERE ${where}`, params),
    ]);

    res.json({
      transactions: rows.rows,
      total: countRes.rows[0].total,
      page,
      pages: Math.ceil(countRes.rows[0].total / limit),
    });
  } catch (err) {
    console.error('Erro ao buscar transações:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Admin: lista saques pendentes
exports.adminListWithdrawals = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const result = await pool.query(
      `SELECT t.id, t.user_id, u.username, u.email,
              t.amount, t.pix_key, t.description, t.status, t.created_at
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.type = 'withdrawal' AND t.status = $1
       ORDER BY t.created_at ASC
       LIMIT 100`,
      [status]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar saques:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Admin: aprovar ou rejeitar saque
exports.adminUpdateWithdrawal = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'completed' | 'rejected'

  if (!['completed', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido (completed | rejected)' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const txRes = await client.query(
      `SELECT t.id, t.user_id, t.amount, t.status
       FROM transactions t WHERE t.id = $1 AND t.type = 'withdrawal' FOR UPDATE`,
      [id]
    );

    if (!txRes.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Saque não encontrado' });
    }

    const tx = txRes.rows[0];
    if (tx.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Este saque já foi processado' });
    }

    await client.query('UPDATE transactions SET status = $1 WHERE id = $2', [status, id]);

    // Rejeitar → devolve saldo ao usuário
    if (status === 'rejected') {
      await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [tx.amount, tx.user_id]);
      await client.query(
        `INSERT INTO transactions (user_id, type, amount, description, status)
         VALUES ($1, 'deposit', $2, 'Saque rejeitado — saldo devolvido', 'completed')`,
        [tx.user_id, tx.amount]
      );
    }

    await client.query('COMMIT');

    res.json({ message: `Saque ${status === 'completed' ? 'aprovado' : 'rejeitado'} com sucesso` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar saque:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};
