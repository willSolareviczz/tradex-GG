/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section frontend
 */
// ===== Roulette Game =====

let selectedColor = null;
let currentRound  = null;
let pollTimer     = null;
let lastRoundId   = null;
let isRolling     = false;

// Roulette cell sequence (0=green, 1-7=red, 8-14=black, repeating)
const CELL_COLORS = ['green','red','black','red','black','red','black','red','black','red','black','red','black','red','black'];
const CELL_LABELS = ['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14'];
const CELL_WIDTH  = 64; // px

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  buildRouletteTrack();
  loadHistory();
  startPoll();
});

function buildRouletteTrack() {
  const cells = document.getElementById('roulette-cells');
  // 60 cells total (4 full cycles) for animation room
  let html = '';
  for (let i = 0; i < 60; i++) {
    const v = i % 15;
    html += `<div class="roulette-cell ${CELL_COLORS[v]}">${CELL_LABELS[v]}</div>`;
  }
  cells.innerHTML = html;
  cells.style.transform = 'translateX(0px)';
  cells.style.transition = 'none';
}

function startPoll() {
  poll();
  pollTimer = setInterval(poll, 800);
}

async function poll() {
  try {
    const data = await apiFetch('/roulette-game/current');
    handleRound(data);
  } catch (e) { /* silent */ }
}

function handleRound(data) {
  currentRound = data;
  const status = data.status;

  // Detect new round
  if (data.round_id !== lastRoundId && lastRoundId !== null) {
    resetTrack();
  }
  lastRoundId = data.round_id;

  // Status badge
  const badge = document.getElementById('rl-status-badge');
  badge.className = `status-badge ${status}`;
  badge.textContent = status === 'betting' ? 'APOSTAS ABERTAS' : status === 'rolling' ? 'ROLANDO...' : 'COMPLETADO';

  // Countdown
  if (status === 'betting') {
    const total  = 20000;
    const left   = Math.max(0, data.time_left_ms);
    const pct    = (left / total * 100).toFixed(1);
    const secs   = Math.ceil(left / 1000);
    document.getElementById('rl-timer').textContent = `${secs}s`;
    document.getElementById('rl-countdown-bar').style.width = `${pct}%`;
    document.getElementById('rl-bet-btn').disabled = false;
    isRolling = false;
  } else {
    document.getElementById('rl-timer').textContent = '—';
    document.getElementById('rl-countdown-bar').style.width = '0%';
    document.getElementById('rl-bet-btn').disabled = true;
    if (status === 'rolling' && !isRolling) {
      isRolling = true;
      spinTrack(data.roll_value);
    }
  }

  renderBets(data.bets || []);
}

function spinTrack(rollValue) {
  const cells  = document.getElementById('roulette-cells');
  const track  = document.querySelector('.roulette-track');
  const center = track.offsetWidth / 2;

  // Reset to start (no transition)
  cells.style.transition = 'none';
  cells.style.transform  = 'translateX(0px)';
  cells.offsetHeight; // force reflow

  // Target: land cell 30 + rollValue (middle of track) at center
  const targetCell  = 30 + (rollValue % 15);
  const targetOffset = targetCell * CELL_WIDTH - center + CELL_WIDTH / 2;

  // Add slight random within cell
  const jitter = (Math.random() - 0.5) * 30;

  requestAnimationFrame(() => {
    cells.style.transition = 'transform 5s cubic-bezier(0.05, 0.8, 0.4, 1)';
    cells.style.transform  = `translateX(-${targetOffset + jitter}px)`;
  });
}

function resetTrack() {
  const cells = document.getElementById('roulette-cells');
  cells.style.transition = 'none';
  cells.style.transform  = 'translateX(0px)';
  isRolling = false;
}

function renderBets(bets) {
  const list  = document.getElementById('rl-bets-list');
  let totRed = 0, totBlack = 0, totGreen = 0;

  if (!bets.length) {
    list.innerHTML = '<div style="color:var(--text-secondary);font-size:0.85rem;text-align:center;padding:16px">Nenhuma aposta ainda</div>';
  } else {
    list.innerHTML = bets.map(b => {
      const name   = b.is_bot ? `🤖 ${b.bot_name}` : (b.username || 'Jogador');
      const dotClr = { red: '#e74c3c', black: '#aaa', green: '#2ecc71' }[b.bet_on] || '#aaa';
      return `<div class="bet-item">
        <span style="width:10px;height:10px;border-radius:50%;background:${dotClr};flex-shrink:0;display:inline-block"></span>
        <span class="bname">${name}</span>
        <span class="bamount">${formatPrice(b.amount)}</span>
      </div>`;
    }).join('');
  }

  bets.forEach(b => {
    if (b.bet_on === 'red')   totRed   += b.amount;
    if (b.bet_on === 'black') totBlack += b.amount;
    if (b.bet_on === 'green') totGreen += b.amount;
  });
  document.getElementById('rl-total-red').textContent   = formatPrice(totRed);
  document.getElementById('rl-total-black').textContent = formatPrice(totBlack);
  document.getElementById('rl-total-green').textContent = formatPrice(totGreen);
}

async function loadHistory() {
  try {
    const history = await apiFetch('/roulette-game/history');
    const el = document.getElementById('rl-history');
    el.innerHTML = history.slice(0, 20).map(r => `
      <div class="roulette-dot ${r.color}" title="${r.roll_value}">${r.roll_value}</div>
    `).join('');
  } catch (e) { /* silent */ }
}

// ── Actions ──────────────────────────────────────────
function selectColor(color) {
  selectedColor = color;
  document.querySelectorAll('.color-bet-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.color === color);
  });
}

async function placeBet() {
  if (!isLoggedIn()) { window.location.href = '/login.html'; return; }
  if (!selectedColor) { showToast('Escolha uma cor', 'error'); return; }

  const raw    = parseFloat(document.getElementById('rl-amount').value) || 0;
  const amount = Math.round(raw * 100);
  if (amount < 100) { showToast('Aposta mínima: R$1,00', 'error'); return; }

  try {
    const res = await apiFetch('/roulette-game/bet', {
      method: 'POST',
      body: JSON.stringify({ amount, bet_on: selectedColor })
    });
    showToast(`Aposta de ${formatPrice(amount)} em ${selectedColor === 'red' ? 'vermelho' : selectedColor === 'black' ? 'preto' : 'verde'}!`);
    const balEl = document.getElementById('nav-balance');
    if (balEl) balEl.textContent = formatPrice(res.new_balance);
    document.getElementById('rl-bet-msg').textContent = `Apostou ${formatPrice(amount)} em ${selectedColor}`;
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function setRlAmount(v)  { document.getElementById('rl-amount').value = (v / 100).toFixed(2); }
function doubleRlAmount() {
  const el = document.getElementById('rl-amount');
  el.value = (parseFloat(el.value || 0) * 2).toFixed(2);
}
function halfRlAmount() {
  const el = document.getElementById('rl-amount');
  el.value = Math.max(0.01, parseFloat(el.value || 0) / 2).toFixed(2);
}
