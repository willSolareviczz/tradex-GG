/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section frontend
 */
// ===== Coinflip =====

let selectedSide = 'T';
let pollTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  loadFlips();
  loadHistory();
  pollTimer = setInterval(() => { loadFlips(); }, 3000);
});

function selectSide(side) {
  selectedSide = side;
  document.querySelectorAll('.side-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.side === side);
  });
}

async function loadFlips() {
  try {
    const flips = await apiFetch('/coinflip/list');
    const grid  = document.getElementById('coinflips-grid');
    document.getElementById('flips-count').textContent = `${flips.length} ativo${flips.length !== 1 ? 's' : ''}`;

    if (!flips.length) {
      grid.innerHTML = '<div style="color:var(--text-secondary);font-size:0.9rem;padding:24px;text-align:center;grid-column:1/-1">Nenhum coinflip aberto. Seja o primeiro!</div>';
      return;
    }

    grid.innerHTML = flips.map(f => `
      <div class="coinflip-card">
        <div class="coinflip-sides">
          <div class="coinflip-side">
            <div class="coinflip-avatar t-side">${f.creator_is_bot ? '🤖' : (f.creator_username || '?').slice(0,2).toUpperCase()}</div>
            <div style="font-size:0.78rem;font-weight:700;color:#ff6600">T</div>
            <div style="font-size:0.75rem;color:var(--text-secondary)">${f.creator_is_bot ? f.bot_creator_name || 'Bot' : (f.creator_username || '?')}</div>
          </div>
          <div class="coinflip-vs">VS</div>
          <div class="coinflip-side">
            <div class="coinflip-avatar ct-side empty">?</div>
            <div style="font-size:0.78rem;font-weight:700;color:#2196f3">CT</div>
            <div style="font-size:0.75rem;color:var(--text-secondary)">Aguardando...</div>
          </div>
        </div>
        <div class="coinflip-amount">${formatPrice(f.amount)}</div>
        <button class="btn btn-primary" style="width:100%;padding:10px;font-size:0.85rem" onclick="joinFlip(${f.id}, ${f.amount})">
          ENTRAR (CT) — ${formatPrice(f.amount)}
        </button>
      </div>
    `).join('');
  } catch (e) { /* silent */ }
}

async function loadHistory() {
  try {
    const history = await apiFetch('/coinflip/history');
    const el = document.getElementById('coinflip-history');
    if (!history.length) { el.innerHTML = '<div style="color:var(--text-secondary);font-size:0.85rem">Nenhum histórico ainda</div>'; return; }

    el.innerHTML = history.slice(0, 10).map(f => {
      const winner = f.winner_id === f.creator_id
        ? (f.creator_username || 'Criador')
        : (f.joiner_is_bot ? (f.bot_joiner_name || 'Bot') : (f.joiner_username || 'Jogador'));
      const side = f.winner_side;
      const sideColor = side === 'T' ? '#ff6600' : '#2196f3';
      return `<div class="bet-item">
        <span class="bname">🏆 ${winner}</span>
        <span style="color:${sideColor};font-weight:700">${side}</span>
        <span class="bamount">${formatPrice(Math.round(f.amount * 2 * 0.95))}</span>
      </div>`;
    }).join('');
  } catch (e) { /* silent */ }
}

async function createFlip() {
  if (!isLoggedIn()) { window.location.href = '/login.html'; return; }

  const raw = parseFloat(document.getElementById('flip-amount').value) || 0;
  const amount = Math.round(raw * 100);
  if (amount < 100) { showToast('Aposta mínima: R$1,00', 'error'); return; }

  try {
    const res = await apiFetch('/coinflip/create', {
      method: 'POST',
      body: JSON.stringify({ amount, side: selectedSide })
    });
    showToast(`Coinflip criado! Aguardando oponente...`);
    const balEl = document.getElementById('nav-balance');
    if (balEl) balEl.textContent = formatPrice(res.new_balance);
    await loadFlips();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function joinFlip(flipId, amount) {
  if (!isLoggedIn()) { window.location.href = '/login.html'; return; }

  try {
    const res = await apiFetch(`/coinflip/${flipId}/join`, { method: 'POST' });

    // Animate coin
    const coinEl = document.getElementById('coin-display');
    coinEl.style.animation = 'none';
    coinEl.offsetHeight; // reflow
    coinEl.style.animation = 'coinSpin 0.5s ease-in-out';
    coinEl.textContent = res.winner_side === 'T' ? '🔶' : '🔷';

    const banner = document.getElementById('flip-result-banner');
    banner.style.display = 'block';
    if (res.you_won) {
      banner.className = 'flip-result-banner won';
      banner.textContent = `🏆 Você ganhou ${formatPrice(res.prize)}!`;
    } else {
      banner.className = 'flip-result-banner lost';
      banner.textContent = `💸 Perdeu ${formatPrice(amount)}`;
    }
    setTimeout(() => { banner.style.display = 'none'; }, 5000);

    const balEl = document.getElementById('nav-balance');
    if (balEl) balEl.textContent = formatPrice(res.new_balance);
    await loadFlips();
    await loadHistory();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function setFlipAmount(v) {
  document.getElementById('flip-amount').value = (v / 100).toFixed(2);
}
