/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section frontend
 */
// ===== Case Battle =====

let selectedSlots = 2;
let cases = [];
let pollTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  loadCases();
  loadBattles();
  loadHistory();
  pollTimer = setInterval(loadBattles, 4000);
});

async function loadCases() {
  try {
    cases = await apiFetch('/cases');
    const sel = document.getElementById('battle-case-select');
    sel.innerHTML = cases.map(c => `<option value="${c.id}" data-price="${c.price}">${c.name} — ${formatPrice(c.price)}</option>`).join('');
    sel.addEventListener('change', updatePreview);
    updatePreview();
  } catch (e) { /* silent */ }
}

function updatePreview() {
  const sel    = document.getElementById('battle-case-select');
  const opt    = sel.options[sel.selectedIndex];
  if (!opt) return;
  const price  = parseInt(opt.dataset.price);
  const prize  = Math.round(price * selectedSlots * 0.95);
  document.getElementById('battle-entry-fee').textContent  = formatPrice(price);
  document.getElementById('battle-prize-preview').textContent = formatPrice(prize);
  document.getElementById('battle-preview').style.display  = 'block';
}

function selectSlots(n) {
  selectedSlots = n;
  [2,3,4].forEach(i => {
    const btn = document.getElementById(`slots-${i}`);
    if (btn) btn.classList.toggle('active', i === n);
  });
  updatePreview();
}

async function loadBattles() {
  try {
    const battles = await apiFetch('/battle/list');
    const grid    = document.getElementById('battles-grid');
    if (!battles.length) {
      grid.innerHTML = '<div style="color:var(--text-secondary);font-size:0.9rem;padding:24px;text-align:center;grid-column:1/-1">Nenhuma battle aberta. Crie uma!</div>';
      return;
    }
    grid.innerHTML = battles.map(b => renderBattleCard(b)).join('');
  } catch (e) { /* silent */ }
}

function renderBattleCard(b) {
  const count = parseInt(b.player_count) || 1;
  let slots = '';
  for (let i = 1; i <= b.max_players; i++) {
    slots += `<div class="battle-slot ${i <= count ? 'filled' : ''}">${i <= count ? '✓' : i}</div>`;
  }
  const prize = Math.round(b.entry_fee * b.max_players * 0.95);
  return `
    <div class="battle-card">
      <img class="battle-case-img" src="${b.case_image}" alt="${b.case_name}" onerror="this.style.display='none'">
      <div class="battle-case-name">${b.case_name}</div>
      <div class="battle-meta">
        <span>por ${b.creator_username || 'Anônimo'}</span>
        <span>${b.max_players}v${b.max_players === 2 ? '1' : b.max_players === 3 ? '2' : '3'}</span>
      </div>
      <div class="battle-slots">${slots}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:0.78rem;color:var(--text-secondary)">Entry</div>
        <div style="font-weight:800;color:var(--accent)">${formatPrice(b.entry_fee)}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="font-size:0.78rem;color:var(--text-secondary)">Prize Pool</div>
        <div style="font-weight:700;color:#4caf50">${formatPrice(prize)}</div>
      </div>
      ${count < b.max_players
        ? `<button class="btn btn-primary" style="width:100%;padding:10px;font-size:0.85rem" onclick="joinBattle(${b.id})">ENTRAR — ${formatPrice(b.entry_fee)}</button>`
        : `<button class="btn btn-secondary" style="width:100%;padding:10px;font-size:0.85rem" disabled>AGUARDANDO INÍCIO</button>`
      }
    </div>
  `;
}

async function loadHistory() {
  try {
    const history = await apiFetch('/battle/history');
    const el      = document.getElementById('battles-history');
    if (!history.length) {
      el.innerHTML = '<div style="color:var(--text-secondary);font-size:0.85rem">Nenhuma battle finalizada ainda</div>';
      return;
    }
    el.innerHTML = history.slice(0, 10).map(b => `
      <div class="bet-item">
        <span class="bname">${b.case_name}</span>
        <span style="color:var(--text-secondary);font-size:0.78rem">${b.max_players} jogadores</span>
        <span class="bamount">${formatPrice(b.prize_pool)}</span>
        <span class="status-badge completed" style="font-size:0.7rem;padding:2px 8px">COMPLETO</span>
      </div>
    `).join('');
  } catch (e) { /* silent */ }
}

async function createBattle() {
  if (!isLoggedIn()) { window.location.href = '/login.html'; return; }

  const caseId = document.getElementById('battle-case-select').value;
  if (!caseId) { showToast('Selecione uma caixa', 'error'); return; }

  try {
    const res = await apiFetch('/battle/create', {
      method: 'POST',
      body: JSON.stringify({ case_id: parseInt(caseId), max_players: selectedSlots })
    });
    showToast('Battle criada! Aguardando jogadores...');
    const balEl = document.getElementById('nav-balance');
    if (balEl) balEl.textContent = formatPrice(res.new_balance);
    await loadBattles();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function joinBattle(battleId) {
  if (!isLoggedIn()) { window.location.href = '/login.html'; return; }

  try {
    const res = await apiFetch(`/battle/${battleId}/join`, { method: 'POST' });
    showToast('Entrou na battle! Aguardando início...');
    const balEl = document.getElementById('nav-balance');
    if (balEl) balEl.textContent = formatPrice(res.new_balance);
    await loadBattles();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
