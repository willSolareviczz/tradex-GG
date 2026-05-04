/**
 * tradex-GG
 * @author willSolareviczz
 * @section frontend — Battle Mode
 */

let allCasesCache   = [];
let selectedCaseId  = null;
let myWaitingBattle = null; // battle created by this user that is still waiting

document.addEventListener('DOMContentLoaded', async () => {
  await loadBattles();
  initSSE();
  bindCreateFlow();

  document.getElementById('btn-result-close').onclick = closeResultOverlay;
});

// ===== Load battles =====
async function loadBattles() {
  try {
    const data = await apiFetch('/battles');
    renderWaiting(data.waiting);
    renderRecent(data.recent);
  } catch {
    document.getElementById('waiting-list').innerHTML = '<div class="battle-empty">Erro ao carregar batalhas.</div>';
  }
}

// ===== SSE real-time updates =====
function initSSE() {
  const es = new EventSource('/api/events/live-drops');
  window.__liveDropsSSE = es;

  es.addEventListener('new-battle', (e) => {
    try {
      const battle = JSON.parse(e.data);
      prependWaiting(battle);
    } catch { /* ignore */ }
  });

  es.addEventListener('battle-completed', (e) => {
    try {
      const result = JSON.parse(e.data);
      removeWaiting(result.battle_id);
      prependRecent(result);
    } catch { /* ignore */ }
  });

  es.addEventListener('battle-cancelled', (e) => {
    try {
      const { battle_id } = JSON.parse(e.data);
      removeWaiting(battle_id);
    } catch { /* ignore */ }
  });
}

// ===== Render waiting list =====
function renderWaiting(battles) {
  const list    = document.getElementById('waiting-list');
  const counter = document.getElementById('waiting-count');
  counter.textContent = battles.length ? `${battles.length} aberta${battles.length > 1 ? 's' : ''}` : '';

  if (battles.length === 0) {
    list.innerHTML = '<div class="battle-empty">Nenhuma batalha aberta. Seja o primeiro a criar!</div>';
    return;
  }

  list.innerHTML = battles.map(b => buildWaitingCard(b)).join('');
  bindWaitingActions();
}

function buildWaitingCard(b) {
  const user    = getUser();
  const isMine  = user && user.id === b.creator_id;
  const imgSrc  = b.case_image || '';

  return `
    <div class="battle-card ${isMine ? 'mine' : ''}" data-id="${b.id}">
      <img class="battle-case-img" src="${imgSrc}" alt="${escapeHtml(b.case_name)}" onerror="this.style.opacity='0.2'">
      <div class="battle-card-info">
        <div class="battle-card-case">${escapeHtml(b.case_name)}</div>
        <div class="battle-card-meta">
          <span>${escapeHtml(b.creator_username)}</span>
          <span>·</span>
          <span>${timeAgo(b.created_at)}</span>
          ${isMine ? '<span style="color:var(--brass)">· sua batalha</span>' : ''}
        </div>
      </div>
      <div class="battle-card-price">${formatPrice(b.case_price)}</div>
      <div class="battle-card-actions">
        ${isMine
          ? `<button class="btn-battle-cancel" data-cancel="${b.id}">Cancelar</button>`
          : `<button class="btn-battle-join" data-join="${b.id}" data-price="${b.case_price}" data-case="${escapeHtml(b.case_name)}">Entrar</button>`
        }
      </div>
    </div>
  `;
}

function bindWaitingActions() {
  document.querySelectorAll('[data-join]').forEach(btn => {
    btn.onclick = () => handleJoin(btn.dataset.join, btn.dataset.price, btn.dataset.case);
  });
  document.querySelectorAll('[data-cancel]').forEach(btn => {
    btn.onclick = () => handleCancel(btn.dataset.cancel);
  });
}

function prependWaiting(battle) {
  const list = document.getElementById('waiting-list');
  const empty = list.querySelector('.battle-empty');
  if (empty) empty.remove();

  const div = document.createElement('div');
  div.innerHTML = buildWaitingCard(battle);
  list.prepend(div.firstElementChild);
  bindWaitingActions();

  const counter = document.getElementById('waiting-count');
  const n = list.querySelectorAll('.battle-card').length;
  counter.textContent = `${n} aberta${n > 1 ? 's' : ''}`;
}

function removeWaiting(battleId) {
  const card = document.querySelector(`.battle-card[data-id="${battleId}"]`);
  if (card) card.remove();

  const list    = document.getElementById('waiting-list');
  const counter = document.getElementById('waiting-count');
  const n = list.querySelectorAll('.battle-card').length;
  counter.textContent = n ? `${n} aberta${n > 1 ? 's' : ''}` : '';
  if (n === 0) list.innerHTML = '<div class="battle-empty">Nenhuma batalha aberta. Seja o primeiro a criar!</div>';
}

// ===== Render recent list =====
function renderRecent(battles) {
  const list = document.getElementById('recent-list');
  if (battles.length === 0) {
    list.innerHTML = '<div class="battle-empty">Nenhuma batalha encerrada ainda.</div>';
    return;
  }
  list.innerHTML = battles.map(buildRecentRow).join('');
}

function buildRecentRow(b) {
  const creatorWon = b.winner_id === b.creator_id;
  return `
    <div class="battle-result-row">
      <div class="battle-side ${creatorWon ? 'winner' : 'loser'}">
        <img class="battle-side-img"
             src="${b.creator_image_url || ''}"
             alt="${escapeHtml(b.creator_skin_name || '')}"
             onerror="this.style.opacity='0.2'">
        <div class="battle-side-info">
          <div class="battle-side-user">${escapeHtml(b.creator_username)}</div>
          <div class="battle-side-skin">${escapeHtml(b.creator_weapon || '')} | ${escapeHtml(b.creator_skin_name || '')}</div>
          <div class="battle-side-value">${b.creator_value ? formatPrice(b.creator_value) : '—'}</div>
        </div>
      </div>

      <div class="battle-vs-center">
        ${creatorWon
          ? '<div class="battle-winner-crown">👑</div><div class="battle-vs-text">VS</div>'
          : '<div class="battle-vs-text">VS</div><div class="battle-winner-crown">👑</div>'
        }
      </div>

      <div class="battle-side right ${creatorWon ? 'loser' : 'winner'}">
        <img class="battle-side-img"
             src="${b.joiner_image_url || ''}"
             alt="${escapeHtml(b.joiner_skin_name || '')}"
             onerror="this.style.opacity='0.2'">
        <div class="battle-side-info">
          <div class="battle-side-user">${escapeHtml(b.joiner_username || '?')}</div>
          <div class="battle-side-skin">${escapeHtml(b.joiner_weapon || '')} | ${escapeHtml(b.joiner_skin_name || '')}</div>
          <div class="battle-side-value">${b.joiner_value ? formatPrice(b.joiner_value) : '—'}</div>
        </div>
      </div>
    </div>
  `;
}

function prependRecent(result) {
  const list = document.getElementById('recent-list');
  const empty = list.querySelector('.battle-empty');
  if (empty) empty.remove();

  const row = {
    winner_id:           result.winner_id,
    creator_id:          result.creator_id,
    creator_username:    result.creator_username,
    joiner_id:           result.joiner_id,
    joiner_username:     result.joiner_username,
    creator_weapon:      result.creator_skin?.weapon,
    creator_skin_name:   result.creator_skin?.skin_name,
    creator_image_url:   result.creator_skin?.image_url,
    creator_value:       result.creator_skin?.value,
    joiner_weapon:       result.joiner_skin?.weapon,
    joiner_skin_name:    result.joiner_skin?.skin_name,
    joiner_image_url:    result.joiner_skin?.image_url,
    joiner_value:        result.joiner_skin?.value,
  };

  const div = document.createElement('div');
  div.innerHTML = buildRecentRow(row);
  list.prepend(div.firstElementChild);

  // Keep list at max 20 items
  const rows = list.querySelectorAll('.battle-result-row');
  if (rows.length > 20) rows[rows.length - 1].remove();
}

// ===== Create battle flow =====
function bindCreateFlow() {
  const modal        = document.getElementById('create-modal');
  const btnOpen      = document.getElementById('btn-open-create');
  const btnClose     = document.getElementById('btn-close-modal');
  const btnCancel    = document.getElementById('btn-cancel-modal');
  const btnConfirm   = document.getElementById('btn-confirm-create');

  btnOpen.onclick = async () => {
    if (!isLoggedIn()) { window.location.href = '/login.html'; return; }
    await loadCasesForModal();
    selectedCaseId = null;
    btnConfirm.disabled = true;
    modal.classList.add('open');
  };

  const closeModal = () => modal.classList.remove('open');
  btnClose.onclick  = closeModal;
  btnCancel.onclick = closeModal;
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  btnConfirm.onclick = async () => {
    if (!selectedCaseId) return;
    closeModal();
    await doCreateBattle(selectedCaseId);
  };
}

async function loadCasesForModal() {
  if (allCasesCache.length) { renderCasesForModal(allCasesCache); return; }
  try {
    allCasesCache = await apiFetch('/cases');
    renderCasesForModal(allCasesCache);
  } catch {
    document.getElementById('case-grid').innerHTML = '<div class="battle-empty">Erro ao carregar caixas.</div>';
  }
}

function renderCasesForModal(cases) {
  const grid = document.getElementById('case-grid');
  grid.innerHTML = cases.map(c => `
    <div class="battle-case-option" data-case-id="${c.id}" data-price="${c.price}">
      <img class="battle-case-opt-img" src="${c.image_url || c.best_skin_image || ''}"
           alt="${escapeHtml(c.name)}" onerror="this.style.opacity='0.2'">
      <div class="battle-case-opt-name">${escapeHtml(c.name)}</div>
      <div class="battle-case-opt-price">${formatPrice(c.price)}</div>
    </div>
  `).join('');

  grid.querySelectorAll('.battle-case-option').forEach(opt => {
    opt.onclick = () => {
      grid.querySelectorAll('.battle-case-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedCaseId = opt.dataset.caseId;
      document.getElementById('btn-confirm-create').disabled = false;
    };
  });
}

async function doCreateBattle(caseId) {
  try {
    const result = await apiFetch('/battles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ case_id: parseInt(caseId) }),
    });

    const balEl = document.getElementById('nav-balance');
    if (balEl) balEl.textContent = formatPrice(result.new_balance);
    updateStoredBalance(result.new_balance);

    showToast(`Batalha criada! Aguardando oponente...`);
    myWaitingBattle = result.battle.id;
  } catch (err) {
    showToast(err.message || 'Erro ao criar batalha', 'error');
  }
}

// ===== Join battle =====
async function handleJoin(battleId, price, caseName) {
  if (!isLoggedIn()) { window.location.href = '/login.html'; return; }

  const confirmed = confirm(`Entrar na batalha?\n\nCaixa: ${caseName}\nCusto: ${formatPrice(parseInt(price))}\n\nO vencedor leva as duas skins!`);
  if (!confirmed) return;

  try {
    const result = await apiFetch(`/battles/${battleId}/join`, { method: 'POST' });

    const balEl = document.getElementById('nav-balance');
    if (balEl) balEl.textContent = formatPrice(result.new_balance);
    updateStoredBalance(result.new_balance);

    showBattleResult(result);
  } catch (err) {
    showToast(err.message || 'Erro ao entrar na batalha', 'error');
  }
}

// ===== Cancel battle =====
async function handleCancel(battleId) {
  if (!confirm('Cancelar batalha e receber reembolso?')) return;
  try {
    const result = await apiFetch(`/battles/${battleId}/cancel`, { method: 'POST' });

    const balEl = document.getElementById('nav-balance');
    if (balEl) balEl.textContent = formatPrice(result.new_balance);
    updateStoredBalance(result.new_balance);

    showToast('Batalha cancelada. Saldo reembolsado.');
    myWaitingBattle = null;
  } catch (err) {
    showToast(err.message || 'Erro ao cancelar', 'error');
  }
}

// ===== Result overlay =====
function showBattleResult(result) {
  const user        = getUser();
  const isCreator   = user && user.id === result.creator_id;
  const iWon        = user && user.id === result.winner_id;

  const title    = document.getElementById('result-title');
  title.textContent = iWon ? '🏆 VOCÊ VENCEU!' : '💀 VOCÊ PERDEU';
  title.className   = `battle-result-title ${iWon ? 'win' : 'lose'}`;

  const creatorWon = result.winner_id === result.creator_id;

  // Creator side
  document.getElementById('result-creator-name').textContent  = result.creator_username;
  document.getElementById('result-creator-img').src           = result.creator_skin.image_url || '';
  document.getElementById('result-creator-skin').textContent  = `${result.creator_skin.weapon} | ${result.creator_skin.skin_name}`;
  document.getElementById('result-creator-value').textContent = formatPrice(result.creator_skin.value);
  const creatorCard  = document.getElementById('result-creator-card');
  const creatorBadge = document.getElementById('result-creator-badge');
  creatorCard.className  = `battle-result-skin-card ${creatorWon ? 'winner-card' : 'loser-card'}`;
  creatorBadge.textContent  = creatorWon ? 'VENCEDOR' : 'PERDEDOR';
  creatorBadge.className    = `battle-result-badge ${creatorWon ? 'badge-winner' : 'badge-loser'}`;

  // Joiner side
  document.getElementById('result-joiner-name').textContent  = result.joiner_username;
  document.getElementById('result-joiner-img').src           = result.joiner_skin.image_url || '';
  document.getElementById('result-joiner-skin').textContent  = `${result.joiner_skin.weapon} | ${result.joiner_skin.skin_name}`;
  document.getElementById('result-joiner-value').textContent = formatPrice(result.joiner_skin.value);
  const joinerCard  = document.getElementById('result-joiner-card');
  const joinerBadge = document.getElementById('result-joiner-badge');
  joinerCard.className  = `battle-result-skin-card ${!creatorWon ? 'winner-card' : 'loser-card'}`;
  joinerBadge.textContent  = !creatorWon ? 'VENCEDOR' : 'PERDEDOR';
  joinerBadge.className    = `battle-result-badge ${!creatorWon ? 'badge-winner' : 'badge-loser'}`;

  document.getElementById('result-overlay').classList.add('active');

  if (iWon) {
    setTimeout(() => showToast(`Você ganhou! Ambas as skins no seu inventário.`, 'success'), 400);
  }
}

function closeResultOverlay() {
  document.getElementById('result-overlay').classList.remove('active');
}

// ===== Utils =====
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return `${diff}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  return `${Math.floor(diff / 3600)}h atrás`;
}
