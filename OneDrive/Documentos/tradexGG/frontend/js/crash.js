/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section frontend
 */
// ===== Crash Game =====

let crashState = null;
let myBet = null;
let pollTimer = null;
let animFrame = null;

const GROWTH_MS = 5000;

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  loadHistory();
  startPoll();
});

// ── Polling ──────────────────────────────────────────
function startPoll() {
  poll();
  pollTimer = setInterval(poll, 800);
}

async function poll() {
  try {
    const data = await apiFetch('/crash/current');
    handleState(data);
  } catch (e) { /* silent */ }
}

function handleState(data) {
  crashState = data;
  myBet = data.my_bet || null;

  // Update status badge
  const badge = document.getElementById('crash-status-badge');
  badge.className = `status-badge ${data.status}`;
  badge.textContent = statusLabel(data.status);

  // Update multiplier display
  const multEl   = document.getElementById('crash-mult');
  const multVal  = document.getElementById('crash-mult-val');
  const statusLbl = document.getElementById('crash-status-label');

  if (data.status === 'waiting') {
    cancelAnimationFrame(animFrame);
    multEl.className = 'crash-multiplier waiting';
    multVal.textContent = '1.00x';
    statusLbl.textContent = 'PRÓXIMO ROUND...';
    document.getElementById('crash-glow').style.background = '';
    showCashoutBtn(false);
    enableBetBtn(true);
  } else if (data.status === 'running') {
    multEl.className = 'crash-multiplier';
    statusLbl.textContent = 'EM JOGO';
    animateMultiplier(data.started_at);
    document.getElementById('crash-glow').style.background =
      'radial-gradient(ellipse at 50% 50%, rgba(76,175,80,0.15) 0%, transparent 70%)';
    enableBetBtn(false);
    if (myBet && !myBet.cashout_at) showCashoutBtn(true);
    else showCashoutBtn(false);
  } else if (data.status === 'crashed') {
    cancelAnimationFrame(animFrame);
    const cp = parseFloat(data.crash_point).toFixed(2);
    multEl.className = 'crash-multiplier crashed';
    multVal.textContent = `${cp}x`;
    statusLbl.textContent = 'CRASHOU!';
    document.getElementById('crash-glow').style.background =
      'radial-gradient(ellipse at 50% 50%, rgba(244,67,54,0.2) 0%, transparent 70%)';
    showCashoutBtn(false);
    enableBetBtn(false);
    // Reset myBet so we can bet next round
    if (data.status === 'crashed') myBet = null;
    loadHistory();
  }

  renderBets(data.bets || []);
}

function animateMultiplier(startedAt) {
  const multVal = document.getElementById('crash-mult-val');
  const cashoutPreview = document.getElementById('cashout-preview');

  function frame() {
    const elapsed = Date.now() - new Date(startedAt).getTime();
    const mult = Math.max(1.00, Math.pow(2, elapsed / GROWTH_MS));
    const display = mult.toFixed(2);
    multVal.textContent = `${display}x`;

    if (myBet && !myBet.cashout_at) {
      const amountBrl = myBet.amount / 100;
      const payout = (amountBrl * mult).toFixed(2).replace('.', ',');
      cashoutPreview.textContent = `R$${payout}`;
    }

    animFrame = requestAnimationFrame(frame);
  }
  cancelAnimationFrame(animFrame);
  animFrame = requestAnimationFrame(frame);
}

function renderBets(bets) {
  const list = document.getElementById('crash-bets-list');
  if (!bets.length) {
    list.innerHTML = '<div style="color:var(--text-secondary);font-size:0.85rem;text-align:center;padding:20px">Nenhuma aposta ainda</div>';
    document.getElementById('crash-total-bet').textContent = 'R$0,00';
    return;
  }

  let total = 0;
  list.innerHTML = bets.map(b => {
    total += b.amount;
    const name = b.is_bot ? `🤖 ${b.bot_name}` : (b.username || 'Jogador');
    let statusHtml = '';
    let cls = 'bet-item';
    if (b.cashout_at != null) {
      statusHtml = `<span class="bstatus won">✓ ${parseFloat(b.cashout_at).toFixed(2)}x</span>`;
      cls += ' won';
    } else if (crashState?.status === 'crashed') {
      statusHtml = `<span class="bstatus lost">✗ perdeu</span>`;
      cls += ' lost';
    } else {
      statusHtml = `<span class="bstatus">em jogo</span>`;
    }
    return `<div class="${cls}">
      <span class="bname">${name}</span>
      <span class="bamount">${formatPrice(b.amount)}</span>
      ${statusHtml}
    </div>`;
  }).join('');

  document.getElementById('crash-total-bet').textContent = formatPrice(total);
}

async function loadHistory() {
  try {
    const history = await apiFetch('/crash/history');
    const bar = document.getElementById('crash-history');
    bar.innerHTML = history.slice(0, 12).map(g => {
      const cp = parseFloat(g.crash_point);
      const cls = cp >= 5 ? 'high' : cp >= 2 ? 'mid' : 'low';
      return `<span class="crash-history-chip ${cls}">${cp.toFixed(2)}x</span>`;
    }).join('');
  } catch (e) { /* silent */ }
}

// ── Actions ──────────────────────────────────────────
async function placeBet() {
  if (!isLoggedIn()) { window.location.href = '/login.html'; return; }

  const raw = parseFloat(document.getElementById('crash-amount').value) || 0;
  const amount = Math.round(raw * 100);
  if (amount < 100) { showToast('Aposta mínima: R$1,00', 'error'); return; }

  try {
    const res = await apiFetch('/crash/bet', { method: 'POST', body: JSON.stringify({ amount }) });
    myBet = { amount, cashout_at: null };
    showToast('Aposta registrada!');
    const balEl = document.getElementById('nav-balance');
    if (balEl) balEl.textContent = formatPrice(res.new_balance);
    enableBetBtn(false);
    document.getElementById('crash-bet-msg').textContent = `Apostou ${formatPrice(amount)}`;
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function doCashout() {
  try {
    const res = await apiFetch('/crash/cashout', { method: 'POST' });
    showToast(`Saque de ${formatPrice(res.payout)} em ${res.multiplier}x!`);
    myBet = null;
    showCashoutBtn(false);
    const balEl = document.getElementById('nav-balance');
    if (balEl) balEl.textContent = formatPrice(res.new_balance);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Helpers ──────────────────────────────────────────
function showCashoutBtn(show) {
  document.getElementById('crash-cashout-btn').style.display = show ? 'block' : 'none';
}

function enableBetBtn(enable) {
  const btn = document.getElementById('crash-bet-btn');
  btn.disabled = !enable;
  btn.textContent = enable ? 'APOSTAR' : (crashState?.status === 'running' ? 'EM JOGO' : 'AGUARDANDO');
}

function statusLabel(s) {
  return { waiting: 'AGUARDANDO', running: 'EM JOGO', crashed: 'CRASHOU' }[s] || s.toUpperCase();
}

function setAmount(v) {
  document.getElementById('crash-amount').value = (v / 100).toFixed(2);
}
function doubleAmount() {
  const el = document.getElementById('crash-amount');
  el.value = (parseFloat(el.value || 0) * 2).toFixed(2);
}
function halfAmount() {
  const el = document.getElementById('crash-amount');
  el.value = Math.max(0.01, parseFloat(el.value || 0) / 2).toFixed(2);
}
