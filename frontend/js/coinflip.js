/**
 * tradex-GG
 * @section frontend — Coinflip Mode
 */

const VALUE_TOLERANCE = 0.40;

let currentUserId    = null;
let selectedCreateId = null; // opening_id selected in create modal
let selectedJoinId   = null; // opening_id selected in join modal
let joinTargetCf     = null; // coinflip being joined { id, creator_value }
let sseSource        = null;

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmtPrice(centavos) {
  return 'R$' + (centavos / 100).toFixed(2).replace('.', ',');
}

function skinLabel(weapon, skinName) {
  return weapon ? `${weapon} | ${skinName}` : skinName;
}

function imgSrc(url) {
  if (!url) return '';
  return url.startsWith('http') ? `/api/image/proxy?url=${encodeURIComponent(url)}` : url;
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)  return `${diff}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
  return `${Math.floor(diff / 3600)}h atrás`;
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const user = getUser?.();
  currentUserId = user?.id ?? null;

  await loadCoinflips();
  initSSE();
  bindUI();
});

// ── Load & render ─────────────────────────────────────────────────────────────
async function loadCoinflips() {
  try {
    const data = await apiFetch('/coinflips');
    renderWaiting(data.waiting || []);
    renderRecent(data.recent  || []);
  } catch {
    document.getElementById('waiting-list').innerHTML = '<div class="cf-empty">Erro ao carregar coinflips.</div>';
  }
}

function renderWaiting(list) {
  const el = document.getElementById('waiting-list');
  const count = document.getElementById('waiting-count');
  count.textContent = list.length;
  if (!list.length) {
    el.innerHTML = '<div class="cf-empty">Nenhum coinflip aguardando oponente.</div>';
    return;
  }
  el.innerHTML = list.map(buildWaitingCard).join('');
  bindWaitingActions();
}

function buildWaitingCard(cf) {
  const mine = cf.creator_id === currentUserId;
  const label = skinLabel(cf.weapon, cf.skin_skin_name || cf.skin_name);
  return `
    <div class="cf-card${mine ? ' mine' : ''}" data-id="${cf.id}">
      <img class="cf-skin-img" src="${imgSrc(cf.image_url)}" alt="${label}">
      <div class="cf-card-info">
        <div class="cf-card-skin">${label}</div>
        <div class="cf-card-meta">
          <span>${cf.creator_username}</span>
          <span>·</span>
          <span>${timeAgo(cf.created_at)}</span>
        </div>
      </div>
      <div class="cf-card-value">${fmtPrice(cf.creator_value)}</div>
      <div class="cf-card-actions">
        ${mine
          ? `<button class="btn-cf-cancel" data-action="cancel" data-id="${cf.id}">Cancelar</button>`
          : `<button class="btn-cf-join" data-action="join" data-id="${cf.id}" data-value="${cf.creator_value}">
               <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
               Entrar
             </button>`
        }
      </div>
    </div>`;
}

function bindWaitingActions() {
  document.getElementById('waiting-list').querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', e => {
      const action = btn.dataset.action;
      const id     = btn.dataset.id;
      if (action === 'cancel') handleCancel(id);
      if (action === 'join')   openJoinModal(id, parseFloat(btn.dataset.value));
    });
  });
}

function renderRecent(list) {
  const el = document.getElementById('recent-list');
  if (!list.length) {
    el.innerHTML = '<div class="cf-empty">Nenhum resultado ainda.</div>';
    return;
  }
  el.innerHTML = list.map(buildRecentRow).join('');
}

function buildRecentRow(cf) {
  const creatorLabel = skinLabel(cf.creator_weapon, cf.creator_skin_name);
  const joinerLabel  = skinLabel(cf.joiner_weapon,  cf.joiner_skin_name);
  const creatorWon   = cf.winner_id === cf.creator_id;
  return `
    <div class="cf-result-row">
      <div class="cf-side${creatorWon ? ' winner' : ' loser'}">
        <img class="cf-side-img" src="${imgSrc(cf.creator_image_url)}" alt="${creatorLabel}">
        <div class="cf-side-info">
          <div class="cf-side-user">${cf.creator_username}</div>
          <div class="cf-side-skin">${creatorLabel}</div>
          <div class="cf-side-value">${fmtPrice(cf.creator_value)}</div>
        </div>
      </div>
      <div class="cf-vs-center">
        <div class="cf-vs-text">VS</div>
        <div class="cf-winner-icon">${creatorWon ? '🟡' : '🟣'}</div>
      </div>
      <div class="cf-side right${creatorWon ? ' loser' : ' winner'}">
        <img class="cf-side-img" src="${imgSrc(cf.joiner_image_url)}" alt="${joinerLabel}">
        <div class="cf-side-info">
          <div class="cf-side-user">${cf.joiner_username}</div>
          <div class="cf-side-skin">${joinerLabel}</div>
          <div class="cf-side-value">${fmtPrice(cf.joiner_value)}</div>
        </div>
      </div>
    </div>`;
}

// ── SSE ───────────────────────────────────────────────────────────────────────
function initSSE() {
  sseSource = getSharedSSE();

  sseSource.addEventListener('new-coinflip', e => {
    const cf = JSON.parse(e.data);
    prependWaiting(cf);
  });

  sseSource.addEventListener('coinflip-completed', e => {
    const data = JSON.parse(e.data);
    removeWaiting(data.coinflip_id);
    prependRecent({
      id:                  data.coinflip_id,
      creator_id:          data.creator_id,
      creator_username:    data.creator_username,
      joiner_id:           data.joiner_id,
      joiner_username:     data.joiner_username,
      winner_id:           data.winner_id,
      creator_weapon:      data.creator_skin.weapon,
      creator_skin_name:   data.creator_skin.skin_name,
      creator_image_url:   data.creator_skin.image_url,
      creator_value:       data.creator_skin.value,
      joiner_weapon:       data.joiner_skin.weapon,
      joiner_skin_name:    data.joiner_skin.skin_name,
      joiner_image_url:    data.joiner_skin.image_url,
      joiner_value:        data.joiner_skin.value,
    });

    // Show result overlay if I'm involved
    if (data.creator_id === currentUserId || data.joiner_id === currentUserId) {
      const iWon = data.winner_id === currentUserId;
      showResult(data, iWon);
    }
  });

  sseSource.addEventListener('coinflip-cancelled', e => {
    const data = JSON.parse(e.data);
    removeWaiting(data.coinflip_id);
  });

}

function prependWaiting(cf) {
  const el = document.getElementById('waiting-list');
  const empty = el.querySelector('.cf-empty');
  if (empty) empty.remove();
  const div = document.createElement('div');
  div.innerHTML = buildWaitingCard(cf);
  el.prepend(div.firstElementChild);
  bindWaitingActions();
  updateWaitingCount(1);
}

function removeWaiting(cfId) {
  const card = document.querySelector(`#waiting-list .cf-card[data-id="${cfId}"]`);
  if (card) { card.remove(); updateWaitingCount(-1); }
  const el = document.getElementById('waiting-list');
  if (!el.querySelector('.cf-card')) {
    el.innerHTML = '<div class="cf-empty">Nenhum coinflip aguardando oponente.</div>';
  }
}

function prependRecent(cf) {
  const el = document.getElementById('recent-list');
  const empty = el.querySelector('.cf-empty');
  if (empty) empty.remove();
  const div = document.createElement('div');
  div.innerHTML = buildRecentRow(cf);
  el.prepend(div.firstElementChild);
  // keep max 20
  const rows = el.querySelectorAll('.cf-result-row');
  if (rows.length > 20) rows[rows.length - 1].remove();
}

function updateWaitingCount(delta) {
  const el = document.getElementById('waiting-count');
  const cur = parseInt(el.textContent) || 0;
  el.textContent = Math.max(0, cur + delta);
}

// ── Create flow ───────────────────────────────────────────────────────────────
function bindUI() {
  document.getElementById('btn-open-create').addEventListener('click', openCreateModal);
  document.getElementById('btn-close-create-modal').addEventListener('click', closeCreateModal);
  document.getElementById('btn-cancel-create-modal').addEventListener('click', closeCreateModal);
  document.getElementById('btn-confirm-create').addEventListener('click', doCreate);

  document.getElementById('btn-close-join-modal').addEventListener('click', closeJoinModal);
  document.getElementById('btn-cancel-join-modal').addEventListener('click', closeJoinModal);
  document.getElementById('btn-confirm-join').addEventListener('click', doJoin);

  document.getElementById('btn-result-close').addEventListener('click', closeResult);
  document.getElementById('result-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget || e.target.classList.contains('cf-result-backdrop')) closeResult();
  });
}

async function openCreateModal() {
  if (!currentUserId) { showToast?.('Faça login para criar um coinflip', 'error'); return; }
  selectedCreateId = null;
  document.getElementById('btn-confirm-create').disabled = true;
  document.getElementById('create-modal').classList.add('open');
  await loadInventoryForGrid('create-inv-grid', null, item => {
    selectedCreateId = item.opening_id;
    document.getElementById('btn-confirm-create').disabled = false;
  });
}

function closeCreateModal() {
  document.getElementById('create-modal').classList.remove('open');
}

async function openJoinModal(cfId, creatorValue) {
  if (!currentUserId) { showToast?.('Faça login para entrar no coinflip', 'error'); return; }
  joinTargetCf = { id: cfId, creator_value: creatorValue };
  selectedJoinId = null;
  document.getElementById('btn-confirm-join').disabled = true;

  const min = creatorValue * (1 - VALUE_TOLERANCE);
  const max = creatorValue * (1 + VALUE_TOLERANCE);
  document.getElementById('join-modal-sub').textContent =
    `Selecione uma skin com valor entre ${fmtPrice(Math.floor(min))} e ${fmtPrice(Math.ceil(max))}.`;

  document.getElementById('join-modal').classList.add('open');
  await loadInventoryForGrid('join-inv-grid', creatorValue, item => {
    selectedJoinId = item.opening_id;
    document.getElementById('btn-confirm-join').disabled = false;
  });
}

function closeJoinModal() {
  document.getElementById('join-modal').classList.remove('open');
  joinTargetCf   = null;
  selectedJoinId = null;
}

async function loadInventoryForGrid(gridId, creatorValue, onSelect) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = '<div class="cf-empty">Carregando inventário...</div>';
  try {
    const data = await apiFetch('/inventory');
    const items = (data.items || []).filter(i => !i.sold);
    if (!items.length) {
      grid.innerHTML = '<div class="cf-empty">Inventário vazio.</div>';
      return;
    }

    grid.innerHTML = '';
    let activeItem = null;

    items.forEach(item => {
      const label  = skinLabel(item.weapon, item.skin_name);
      const compat = creatorValue === null
        ? true
        : (() => {
            const ratio = item.value / creatorValue;
            return ratio >= (1 - VALUE_TOLERANCE) && ratio <= (1 + VALUE_TOLERANCE);
          })();

      const div = document.createElement('div');
      div.className = 'cf-inv-item' + (compat ? '' : ' incompatible');
      div.style.setProperty('--item-rarity', item.rarity_color || 'var(--border)');
      div.innerHTML = `
        <img class="cf-inv-img" src="${imgSrc(item.image_url)}" alt="${label}">
        <div class="cf-inv-name">${label}</div>
        <div class="cf-inv-value">${fmtPrice(item.value)}</div>`;

      if (compat) {
        div.addEventListener('click', () => {
          if (activeItem) activeItem.classList.remove('selected');
          div.classList.add('selected');
          activeItem = div;
          onSelect(item);
        });
      }
      grid.appendChild(div);
    });
  } catch {
    grid.innerHTML = '<div class="cf-empty">Erro ao carregar inventário.</div>';
  }
}

async function doCreate() {
  if (!selectedCreateId) return;
  const btn = document.getElementById('btn-confirm-create');
  btn.disabled = true;
  btn.textContent = 'Criando...';
  try {
    await apiFetch('/coinflips', { method: 'POST', body: JSON.stringify({ opening_id: selectedCreateId }) });
    closeCreateModal();
    showToast?.('Coinflip criado! Aguardando oponente.', 'success');
  } catch (err) {
    showToast?.(err.message || 'Erro ao criar coinflip', 'error');
    btn.disabled = false;
    btn.textContent = 'Criar Coinflip';
  }
}

async function doJoin() {
  if (!selectedJoinId || !joinTargetCf) return;
  const btn = document.getElementById('btn-confirm-join');
  btn.disabled = true;
  btn.textContent = 'Entrando...';
  try {
    const result = await apiFetch(`/coinflips/${joinTargetCf.id}/join`, {
      method: 'POST',
      body: JSON.stringify({ opening_id: selectedJoinId }),
    });
    closeJoinModal();
    const iWon = result.winner_id === currentUserId;
    showResult({
      coinflip_id:      result.coinflip_id,
      creator_id:       result.creator_id,
      creator_username: result.creator_username,
      joiner_id:        result.joiner_id,
      joiner_username:  result.joiner_username,
      winner_id:        result.winner_id,
      creator_skin:     result.creator_skin,
      joiner_skin:      result.joiner_skin,
    }, iWon);
  } catch (err) {
    showToast?.(err.message || 'Erro ao entrar no coinflip', 'error');
    btn.disabled = false;
    btn.textContent = 'Entrar no Coinflip';
  }
}

// ── Cancel ────────────────────────────────────────────────────────────────────
async function handleCancel(cfId) {
  if (!confirm('Cancelar este coinflip e devolver o item ao inventário?')) return;
  try {
    await apiFetch(`/coinflips/${cfId}/cancel`, { method: 'POST' });
    showToast?.('Coinflip cancelado. Item devolvido ao inventário.', 'success');
  } catch (err) {
    showToast?.(err.message || 'Erro ao cancelar', 'error');
  }
}

// ── Result overlay ────────────────────────────────────────────────────────────
function showResult(data, iWon) {
  const overlay = document.getElementById('result-overlay');
  const title   = document.getElementById('result-title');
  const coin    = document.getElementById('result-coin');

  title.textContent = iWon ? 'VOCÊ GANHOU!' : 'VOCÊ PERDEU';
  title.className   = 'cf-result-title ' + (iWon ? 'win' : 'lose');
  coin.className    = 'cf-coin ' + (iWon ? 'win' : 'lose');
  coin.textContent  = iWon ? '🟡' : '🟣';

  // Creator side
  const cs = data.creator_skin;
  document.getElementById('result-creator-name').textContent  = data.creator_username;
  document.getElementById('result-creator-img').src           = imgSrc(cs.image_url);
  document.getElementById('result-creator-skin').textContent  = skinLabel(cs.weapon, cs.skin_name);
  document.getElementById('result-creator-value').textContent = fmtPrice(cs.value);

  const creatorWon = data.winner_id === data.creator_id;
  const cCard = document.getElementById('result-creator-card');
  cCard.className = 'cf-result-skin-card ' + (creatorWon ? 'winner-card' : 'loser-card');
  document.getElementById('result-creator-badge').textContent = creatorWon ? 'VENCEDOR' : 'PERDEDOR';
  document.getElementById('result-creator-badge').className   = 'cf-result-badge ' + (creatorWon ? 'badge-win' : 'badge-lose');

  // Joiner side
  const js = data.joiner_skin;
  document.getElementById('result-joiner-name').textContent  = data.joiner_username;
  document.getElementById('result-joiner-img').src           = imgSrc(js.image_url);
  document.getElementById('result-joiner-skin').textContent  = skinLabel(js.weapon, js.skin_name);
  document.getElementById('result-joiner-value').textContent = fmtPrice(js.value);

  const joinerWon = data.winner_id === data.joiner_id;
  const jCard = document.getElementById('result-joiner-card');
  jCard.className = 'cf-result-skin-card ' + (joinerWon ? 'winner-card' : 'loser-card');
  document.getElementById('result-joiner-badge').textContent = joinerWon ? 'VENCEDOR' : 'PERDEDOR';
  document.getElementById('result-joiner-badge').className   = 'cf-result-badge ' + (joinerWon ? 'badge-win' : 'badge-lose');

  overlay.classList.add('active');
}

function closeResult() {
  document.getElementById('result-overlay').classList.remove('active');
}
