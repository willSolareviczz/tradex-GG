/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
// =====================================================
// tradexGG Email Service (Brevo / Sendinblue API)
// Gratuito: 300 emails/dia, 9.000/mes
// Envia para qualquer email sem precisar de dominio proprio
// Cadastro: brevo.com — so precisa de uma API key
// =====================================================

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

function isConfigured() {
  return !!process.env.BREVO_API_KEY;
}

async function sendPasswordReset(to, username, resetUrl) {
  if (!isConfigured()) {
    throw new Error('BREVO_API_KEY nao configurada no .env');
  }

  const senderName  = process.env.EMAIL_FROM_NAME  || 'tradexGG';
  const senderEmail = process.env.EMAIL_FROM_ADDR  || process.env.BREVO_SENDER_EMAIL;

  if (!senderEmail) {
    throw new Error('EMAIL_FROM_ADDR nao configurado no .env');
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #0d1117; color: #e6edf3; margin: 0; padding: 0; }
    .wrap { max-width: 520px; margin: 40px auto; background: #1c2333; border: 1px solid #30363d; border-radius: 16px; overflow: hidden; }
    .header { padding: 32px 40px; border-bottom: 1px solid #30363d; text-align: center; }
    .logo { font-size: 2rem; font-weight: 800; color: #00ff88; letter-spacing: -1px; }
    .logo span { color: #00d4ff; }
    .body { padding: 32px 40px; }
    h2 { font-size: 1.3rem; margin: 0 0 0.8rem; color: #e6edf3; }
    p { color: #8b949e; font-size: 0.9rem; line-height: 1.6; margin: 0 0 1.2rem; }
    .btn { display: inline-block; background: #00ff88; color: #0d1117 !important; font-weight: 700; font-size: 0.95rem; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin: 8px 0 20px; }
    .url-box { background: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 10px 14px; font-size: 0.75rem; color: #8b949e; word-break: break-all; margin-bottom: 20px; }
    .footer { border-top: 1px solid #30363d; padding: 20px 40px; text-align: center; font-size: 0.75rem; color: #484f58; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="logo">tradex<span>GG</span></div>
    </div>
    <div class="body">
      <h2>Redefinir sua senha</h2>
      <p>Olá <strong style="color:#e6edf3">${username}</strong>,</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:</p>
      <div style="text-align:center">
        <a href="${resetUrl}" class="btn">Redefinir Senha</a>
      </div>
      <p>Ou copie e cole este link no navegador:</p>
      <div class="url-box">${resetUrl}</div>
      <p>Este link expira em <strong style="color:#e6edf3">1 hora</strong>. Se você não solicitou a redefinição de senha, ignore este email — sua conta está segura.</p>
    </div>
    <div class="footer">
      tradexGG &bull; Este email foi enviado automaticamente, não responda.
    </div>
  </div>
</body>
</html>`;

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to, name: username }],
    subject: 'Redefinir senha — tradexGG',
    htmlContent: html,
    textContent: `Olá ${username},\n\nClique no link abaixo para redefinir sua senha:\n${resetUrl}\n\nEste link expira em 1 hora.\n\nSe não foi você, ignore este email.`,
  };

  const res = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'accept':       'application/json',
      'api-key':      process.env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error('Brevo: ' + (err.message || res.status));
  }
}

async function sendEmailVerification(to, username, verifyUrl) {
  if (!isConfigured()) {
    throw new Error('BREVO_API_KEY nao configurada no .env');
  }

  const senderName  = process.env.EMAIL_FROM_NAME  || 'tradexGG';
  const senderEmail = process.env.EMAIL_FROM_ADDR  || process.env.BREVO_SENDER_EMAIL;

  if (!senderEmail) {
    throw new Error('EMAIL_FROM_ADDR nao configurado no .env');
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #0d1117; color: #e6edf3; margin: 0; padding: 0; }
    .wrap { max-width: 520px; margin: 40px auto; background: #1c2333; border: 1px solid #30363d; border-radius: 16px; overflow: hidden; }
    .header { padding: 32px 40px; border-bottom: 1px solid #30363d; text-align: center; }
    .logo { font-size: 2rem; font-weight: 800; color: #c9a86a; letter-spacing: -1px; }
    .body { padding: 32px 40px; }
    h2 { font-size: 1.3rem; margin: 0 0 0.8rem; color: #e6edf3; }
    p { color: #8b949e; font-size: 0.9rem; line-height: 1.6; margin: 0 0 1.2rem; }
    .btn { display: inline-block; background: #c9a86a; color: #1a1408 !important; font-weight: 700; font-size: 0.95rem; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin: 8px 0 20px; }
    .url-box { background: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 10px 14px; font-size: 0.75rem; color: #8b949e; word-break: break-all; margin-bottom: 20px; }
    .footer { border-top: 1px solid #30363d; padding: 20px 40px; text-align: center; font-size: 0.75rem; color: #484f58; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header"><div class="logo">tradexGG</div></div>
    <div class="body">
      <h2>Confirme seu email</h2>
      <p>Olá <strong style="color:#e6edf3">${username}</strong>,</p>
      <p>Clique no botão abaixo para verificar seu endereço de email e ativar sua conta:</p>
      <div style="text-align:center">
        <a href="${verifyUrl}" class="btn">Verificar Email</a>
      </div>
      <p>Ou copie e cole este link no navegador:</p>
      <div class="url-box">${verifyUrl}</div>
      <p>Este link expira em <strong style="color:#e6edf3">24 horas</strong>. Se você não criou uma conta no tradexGG, ignore este email.</p>
    </div>
    <div class="footer">tradexGG &bull; Este email foi enviado automaticamente, não responda.</div>
  </div>
</body>
</html>`;

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to, name: username }],
    subject: 'Confirme seu email — tradexGG',
    htmlContent: html,
    textContent: `Olá ${username},\n\nAcesse o link abaixo para verificar seu email:\n${verifyUrl}\n\nEste link expira em 24 horas.`,
  };

  const res = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'accept':       'application/json',
      'api-key':      process.env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error('Brevo: ' + (err.message || res.status));
  }
}

module.exports = { isConfigured, sendPasswordReset, sendEmailVerification };
