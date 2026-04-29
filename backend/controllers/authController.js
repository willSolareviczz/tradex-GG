/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const emailService = require('../services/emailService');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Preencha todos os campos' });
    }

    if (username.length < 3 || username.length > 32) {
      return res.status(400).json({ error: 'Username deve ter entre 3 e 32 caracteres' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email ou username já cadastrado' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // Gerar token de verificação de email (24h)
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, email_verify_token, email_verify_expires)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, balance, email_verified`,
      [username, email, password_hash, verifyToken, verifyExpires]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    // Enviar email de verificação (silencioso se não configurado)
    if (emailService.isConfigured()) {
      const baseUrl = process.env.SITE_URL || `http://localhost:${process.env.PORT || 3000}`;
      const verifyUrl = `${baseUrl}/verify-email.html?token=${verifyToken}`;
      emailService.sendEmailVerification(user.email, user.username, verifyUrl).catch(err => {
        console.error('[email] Falha ao enviar verificação:', err.message);
      });
    }

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Erro no registro:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token não informado' });

    const result = await pool.query(
      'SELECT id FROM users WHERE email_verify_token = $1 AND email_verify_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    await pool.query(
      'UPDATE users SET email_verified = TRUE, email_verify_token = NULL, email_verify_expires = NULL WHERE id = $1',
      [result.rows[0].id]
    );

    res.json({ message: 'Email verificado com sucesso!' });
  } catch (err) {
    console.error('Erro ao verificar email:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Informe o email' });

    const result = await pool.query(
      'SELECT id, username, email, email_verified FROM users WHERE email = $1',
      [email]
    );

    // Sempre responde com sucesso — não revela se email existe
    if (result.rows.length === 0 || result.rows[0].email_verified) {
      return res.json({ message: 'Se este email estiver cadastrado e não verificado, você receberá um novo link.' });
    }

    const user = result.rows[0];
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      'UPDATE users SET email_verify_token = $1, email_verify_expires = $2 WHERE id = $3',
      [verifyToken, verifyExpires, user.id]
    );

    if (emailService.isConfigured()) {
      const baseUrl = process.env.SITE_URL || `http://localhost:${process.env.PORT || 3000}`;
      const verifyUrl = `${baseUrl}/verify-email.html?token=${verifyToken}`;
      await emailService.sendEmailVerification(user.email, user.username, verifyUrl);
    }

    res.json({ message: 'Se este email estiver cadastrado e não verificado, você receberá um novo link.' });
  } catch (err) {
    console.error('Erro ao reenviar verificação:', err);
    res.status(500).json({ error: 'Erro ao enviar email.' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Informe o email' });

    const result = await pool.query(
      'SELECT id, username, email FROM users WHERE email = $1',
      [email]
    );

    // Sempre responde com sucesso — não revela se email existe
    if (result.rows.length === 0) {
      return res.json({ message: 'Se este email estiver cadastrado, você receberá as instruções em instantes.' });
    }

    const user = result.rows[0];

    // Gerar token seguro (64 hex chars = 32 bytes)
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [token, expires, user.id]
    );

    const baseUrl = process.env.SITE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const resetUrl = `${baseUrl}/reset-password.html?token=${token}`;

    await emailService.sendPasswordReset(user.email, user.username, resetUrl);

    res.json({ message: 'Se este email estiver cadastrado, você receberá as instruções em instantes.' });
  } catch (err) {
    console.error('Erro no forgotPassword:', err);
    // Não expõe detalhes do erro para não vazar se email existe
    res.status(500).json({ error: 'Erro ao enviar email. Verifique as configurações do servidor.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const result = await pool.query(
      'SELECT id, username FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido ou expirado. Solicite um novo link.' });
    }

    const user = result.rows[0];
    const password_hash = await bcrypt.hash(password, 10);

    // Atualiza senha e remove token
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [password_hash, user.id]
    );

    res.json({ message: 'Senha redefinida com sucesso! Você já pode fazer login.' });
  } catch (err) {
    console.error('Erro no resetPassword:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Preencha todos os campos' });
    }

    const result = await pool.query(
      'SELECT id, username, email, password_hash, balance FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({
      user: { id: user.id, username: user.username, email: user.email, balance: user.balance },
      token,
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
