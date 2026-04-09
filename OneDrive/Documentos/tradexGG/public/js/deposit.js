document.addEventListener('DOMContentLoaded', () => {
  if (!isLoggedIn()) {
    window.location.href = '/login.html';
    return;
  }

  let selectedAmount = 0;

  // Amount buttons
  document.querySelectorAll('.deposit-amount-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.deposit-amount-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedAmount = parseInt(btn.dataset.amount);
      document.getElementById('custom-amount').value = '';
    });
  });

  // Custom amount
  document.getElementById('custom-amount').addEventListener('input', (e) => {
    document.querySelectorAll('.deposit-amount-btn').forEach(b => b.classList.remove('active'));
    selectedAmount = Math.round(parseFloat(e.target.value) * 100) || 0;
  });

  // Generate PIX
  document.getElementById('btn-deposit').addEventListener('click', async () => {
    if (selectedAmount < 500) {
      showToast('Valor mínimo de R$5,00', 'error');
      return;
    }

    const btn = document.getElementById('btn-deposit');
    btn.disabled = true;
    btn.textContent = 'Gerando PIX...';

    try {
      const result = await apiFetch('/payments/pix', {
        method: 'POST',
        body: JSON.stringify({ amount: selectedAmount }),
      });

      // Show QR code
      document.getElementById('step-amount').style.display = 'none';
      document.getElementById('step-qr').style.display = 'block';

      if (result.qr_code_base64) {
        document.getElementById('qr-image').src = `data:image/png;base64,${result.qr_code_base64}`;
      }

      if (result.qr_code) {
        const pixCopy = document.getElementById('pix-copy');
        pixCopy.textContent = result.qr_code;
        pixCopy.addEventListener('click', () => {
          navigator.clipboard.writeText(result.qr_code);
          showToast('Código PIX copiado!');
        });
      }

      // Poll for payment status
      pollPaymentStatus(result.payment_id);

    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Gerar PIX';
    }
  });
});

function pollPaymentStatus(paymentId) {
  const statusEl = document.getElementById('pix-status');
  let attempts = 0;
  const maxAttempts = 120; // 10 minutes at 5s intervals

  const interval = setInterval(async () => {
    attempts++;
    if (attempts > maxAttempts) {
      clearInterval(interval);
      statusEl.textContent = 'Tempo expirado. Gere um novo PIX.';
      statusEl.style.color = 'var(--danger)';
      return;
    }

    try {
      const result = await apiFetch(`/payments/status/${paymentId}`);

      if (result.status === 'approved') {
        clearInterval(interval);
        statusEl.textContent = 'Pagamento aprovado! Saldo adicionado.';
        statusEl.style.color = 'var(--accent)';
        showToast('Depósito confirmado!');

        // Update balance
        const userData = await apiFetch('/users/me');
        const balEl = document.getElementById('nav-balance');
        if (balEl) balEl.textContent = formatPrice(userData.balance);
      }
    } catch {
      // Silently retry
    }
  }, 5000);
}
