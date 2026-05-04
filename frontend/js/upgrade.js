/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section frontend
 */
let _inventory    = [];
let _targets      = [];
let _selectedFrom = null; // { opening_id, skin }
let _selectedTo   = null; // skin object
let _isSpinning   = false;
let _currentTab   = 'inventory';

const WEAR_LABELS = { FN: 'Factory New', MW: 'Minimal Wear', FT: 'Field-Tested', WW: 'Well-Worn', BS: 'Battle-Scarred' };

document.addEventListener('DOMContentLoaded', async () => {
  if (!isLoggedIn()) { window.location.href = '/login.html'; return; }

  await loadInventory();
  await loadHistory();

  // Tab switching
  document.querySelectorAll('.upgrade-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('btn-continue').addEventListener('click', () => {
    document.getElementById('result-overlay').classList.remove('active');
    resetSelection();
    loadInventory();
    loadHistory();
  });
});

// ===== Audio =====
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}
function playDialTick() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.025);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.035);
  } catch {}
}
function playResult(won) {
  try {
    const ctx = getAudioCtx();
    const freqs = won ? [880, 1100, 1320] : [300, 240, 200];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = won ? 'sine' : 'sawtooth';
      const delay = i * 0.12;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(won ? 0.14 : 0.07, ctx.currentTime + delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.7);
      osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.75);
    });
  } catch {}
}

// ===== Data loading =====
async function loadInventory() {
  try {
    _inventory = await apiFetch('/upgrades/inventory');
    document.getElementById('inv-count').textContent = _inventory.length;
    if (_currentTab === 'inventory') renderGrid('inventory');
  } catch {
    showToast('Erro ao carregar inventário', 'error');
  }
}

async function loadTargets(minValue = 0) {
  try {
    _targets = await apiFetch(`/upgrades/targets?minValue=${minValue}`);
    document.getElementById('target-count').textContent = _targets.length;
    if (_currentTab === 'targets') renderGrid('targets');
  } catch {
    showToast('Erro ao carregar skins alvo', 'error');
  }
}

async function loadHistory() {
  try {
    const rows = await apiFetch('/upgrades/history');
    const list = document.getElementById('upgrade-history-list');
    if (!rows.length) {
      list.innerHTML = '<p style="color:var(--text-secondary);font-size:0.9rem;">Nenhum upgrade realizado ainda.</p>';
      return;
    }
    list.innerHTML = rows.map(r => {
      const chancePct = (r.win_chance / 100).toFixed(2);
      const wonColor  = r.won ? 'var(--accent)' : 'var(--danger)';
      const badge     = r.won ? 'WIN' : 'LOSS';
      return `
        <div class="upgrade-history-row">
          <span class="upgrade-history-badge" style="color:${wonColor};border-color:${wonColor}">${badge}</span>
          <span style="color:var(--text-secondary);font-size:0.82rem;">${new Date(r.created_at).toLocaleDateString('pt-BR')}</span>
          <span style="color:${r.from_rarity_color};font-weight:600;">${escapeHtml(r.from_weapon)} | ${escapeHtml(r.from_skin_name)}</span>
          <span style="color:var(--text-tertiary);">→</span>
          <span style="color:${r.to_rarity_color};font-weight:600;">${escapeHtml(r.to_weapon)} | ${escapeHtml(r.to_skin_name)}</span>
          <span class="upgrade-history-chance">${chancePct}%</span>
          <span style="color:var(--brass);">${formatPrice(r.from_value)} → ${formatPrice(r.to_value)}</span>
        </div>`;
    }).join('');
  } catch {}
}

// ===== Tab switching =====
function switchTab(tab) {
  _currentTab = tab;
  document.querySelectorAll('.upgrade-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  if (tab === 'targets' && _selectedFrom) {
    loadTargets(_selectedFrom.value);
  } else if (tab === 'targets') {
    loadTargets(0);
  }
  renderGrid(tab);
}

// ===== Render item grid =====
function renderGrid(tab) {
  const grid = document.getElementById('upgrade-grid');
  const items = tab === 'inventory' ? _inventory : _targets;

  if (!items.length) {
    grid.innerHTML = `<div class="empty-state"><p>${tab === 'inventory' ? 'Inventário vazio.' : 'Nenhuma skin disponível para o valor selecionado.'}</p></div>`;
    return;
  }

  grid.innerHTML = items.map((item, i) => {
    const isSelected = tab === 'inventory'
      ? _selectedFrom?.opening_id === item.opening_id
      : _selectedTo?.id === item.id;
    const value = item.value || 0;
    return `
      <div class="upgrade-item ${isSelected ? 'selected' : ''}" data-idx="${i}" data-tab="${tab}"
           style="--item-rarity:${item.rarity_color}; border-bottom-color:${item.rarity_color}">
        <img src="/api/image/weapon-crop?url=${encodeURIComponent(item.image_url)}" alt="${escapeHtml(item.name)}" class="upgrade-item-img">
        <div class="upgrade-item-name">${escapeHtml(item.weapon)} | ${escapeHtml(item.skin_name)}</div>
        <div class="upgrade-item-wear">${WEAR_LABELS[item.wear] || item.wear || ''}</div>
        <div class="upgrade-item-price">${formatPrice(value)}</div>
      </div>`;
  }).join('');

  grid.querySelectorAll('.upgrade-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.idx);
      if (el.dataset.tab === 'inventory') selectFrom(items[idx]);
      else selectTo(items[idx]);
    });
  });
}

// ===== Selection =====
function selectFrom(item) {
  _selectedFrom = item;
  renderFromCard(item);
  renderGrid('inventory');
  // Load targets with new minValue
  loadTargets(item.value);
  updateDial();
}

function selectTo(item) {
  _selectedTo = item;
  renderToCard(item);
  renderGrid('targets');
  updateDial();
}

function renderFromCard(item) {
  const card = document.getElementById('from-card');
  card.classList.remove('empty');
  card.style.borderColor = item.rarity_color;
  card.innerHTML = `
    <div class="upgrade-slot-card-inner">
      <img src="/api/image/weapon-crop?url=${encodeURIComponent(item.image_url)}" alt="${escapeHtml(item.name)}" class="upgrade-slot-img">
      <div class="upgrade-slot-skin-name">${escapeHtml(item.weapon)} | ${escapeHtml(item.skin_name)}</div>
      <div class="upgrade-slot-wear">${WEAR_LABELS[item.wear] || item.wear || ''}</div>
      <div class="upgrade-slot-price">${formatPrice(item.value)}</div>
    </div>
    <button class="upgrade-slot-clear" onclick="clearFrom()">✕</button>`;
}

function renderToCard(item) {
  const card = document.getElementById('to-card');
  card.classList.remove('empty');
  card.style.borderColor = item.rarity_color;
  card.innerHTML = `
    <div class="upgrade-slot-card-inner">
      <img src="/api/image/weapon-crop?url=${encodeURIComponent(item.image_url)}" alt="${escapeHtml(item.name)}" class="upgrade-slot-img">
      <div class="upgrade-slot-skin-name">${escapeHtml(item.weapon)} | ${escapeHtml(item.skin_name)}</div>
      <div class="upgrade-slot-wear">${WEAR_LABELS[item.wear] || item.wear || ''}</div>
      <div class="upgrade-slot-price">${formatPrice(item.value)}</div>
    </div>
    <button class="upgrade-slot-clear" onclick="clearTo()">✕</button>`;
}

function clearFrom() {
  _selectedFrom = null;
  const card = document.getElementById('from-card');
  card.classList.add('empty');
  card.style.borderColor = '';
  card.innerHTML = `
    <div class="upgrade-slot-placeholder">
      <svg viewBox="0 0 40 40" fill="none" width="40" height="40">
        <rect x="4" y="4" width="32" height="32" rx="4" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/>
        <path d="M20 14v12M14 20h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <span>Selecione do inventário</span>
    </div>`;
  updateDial();
}

function clearTo() {
  _selectedTo = null;
  const card = document.getElementById('to-card');
  card.classList.add('empty');
  card.style.borderColor = '';
  card.innerHTML = `
    <div class="upgrade-slot-placeholder">
      <svg viewBox="0 0 40 40" fill="none" width="40" height="40">
        <rect x="4" y="4" width="32" height="32" rx="4" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/>
        <path d="M20 14v12M14 20h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <span>Selecione um alvo</span>
    </div>`;
  updateDial();
}

function resetSelection() {
  _selectedFrom = null;
  _selectedTo   = null;
  clearFrom(); clearTo();
  updateDial();
}

// ===== Dial update =====
function updateDial() {
  const btn = document.getElementById('upgrade-btn');
  const dialChance = document.getElementById('dial-chance');
  const dialBg = document.getElementById('dial-bg');
  const needleWrap = document.getElementById('needle-wrap');

  if (!_selectedFrom || !_selectedTo) {
    dialChance.textContent = '—';
    dialBg.style.background = 'conic-gradient(var(--bg-card-hi) 0deg, var(--bg-card-hi) 360deg)';
    needleWrap.style.transform = 'rotate(0deg)';
    btn.disabled = true;
    return;
  }

  const from_value = _selectedFrom.value;
  const to_value   = _selectedTo.value;

  if (to_value <= from_value) {
    dialChance.textContent = '—';
    dialChance.style.color = 'var(--danger)';
    dialBg.style.background = 'conic-gradient(var(--danger) 0deg 360deg)';
    btn.disabled = true;
    showToast('Skin alvo deve valer mais que a sua skin', 'error');
    return;
  }

  const win_chance_bps = Math.min(7500, Math.floor((from_value / to_value) * 9000));
  const pct = win_chance_bps / 100;
  const winDeg = (win_chance_bps / 10000) * 360;

  dialChance.textContent = pct.toFixed(1) + '%';
  dialChance.style.color = pct >= 50 ? '#22c55e' : pct >= 25 ? 'var(--brass)' : 'var(--danger)';

  dialBg.style.background = `conic-gradient(
    #22c55e 0deg ${winDeg}deg,
    #c0503e ${winDeg}deg 360deg
  )`;

  needleWrap.style.transition = 'none';
  needleWrap.style.transform  = 'rotate(0deg)';

  btn.disabled = false;
}

// ===== Perform upgrade =====
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('upgrade-btn');
  if (btn) btn.addEventListener('click', performUpgrade);
});

async function performUpgrade() {
  if (_isSpinning || !_selectedFrom || !_selectedTo) return;
  const fromVal = formatPrice(_selectedFrom.value);
  const toVal   = formatPrice(_selectedTo.value);
  if (!confirm(`Confirma o upgrade?\n${fromVal} → ${toVal}\nSua skin original será consumida mesmo se perder.`)) return;
  _isSpinning = true;

  const btn = document.getElementById('upgrade-btn');
  btn.disabled = true;
  btn.textContent = 'Girando...';

  try {
    const result = await apiFetch('/upgrades', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        opening_id:     _selectedFrom.opening_id,
        target_skin_id: _selectedTo.id,
      }),
    });

    await spinDial(result.won, result.win_chance);
    showResult(result);

  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 3l14 9-14 9V3z"/></svg> FAZER UPGRADE`;
  } finally {
    _isSpinning = false;
  }
}

// ===== Spin animation =====
function spinDial(won, winChanceBps) {
  return new Promise(resolve => {
    const needleWrap = document.getElementById('needle-wrap');
    const winDeg = (winChanceBps / 10000) * 360;
    const fullSpins = 5 * 360;

    let landDeg;
    if (won) {
      const margin = winDeg * 0.08;
      landDeg = margin + Math.random() * (winDeg - margin * 2);
    } else {
      const redSpan = 360 - winDeg;
      const margin  = redSpan * 0.05;
      landDeg = winDeg + margin + Math.random() * (redSpan - margin * 2);
    }

    const totalRotation = fullSpins + landDeg;

    // Schedule ticks that decelerate
    let elapsed = 0;
    const totalMs = 3500;
    let interval  = 40;
    let tickTimer;

    function tick() {
      if (elapsed >= totalMs) return;
      playDialTick();
      const progress = elapsed / totalMs;
      interval = 40 + Math.pow(progress, 2) * 460;
      elapsed += interval;
      tickTimer = setTimeout(tick, interval);
    }
    tick();

    needleWrap.style.transition = 'none';
    needleWrap.style.transform  = 'rotate(0deg)';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        needleWrap.style.transition = `transform 3.5s cubic-bezier(0.12, 0.85, 0.35, 1.00)`;
        needleWrap.style.transform  = `rotate(${totalRotation}deg)`;
      });
    });

    setTimeout(() => {
      clearTimeout(tickTimer);
      playResult(won);
      resolve();
    }, 3700);
  });
}

// ===== Show result overlay =====
function showResult(result) {
  const overlay = document.getElementById('result-overlay');
  const badge   = document.getElementById('result-badge');
  const card    = document.getElementById('result-card');
  const glow    = document.getElementById('result-glow');
  const img     = document.getElementById('result-img');
  const name    = document.getElementById('result-name');
  const meta    = document.getElementById('result-meta');

  const skin  = result.won ? result.to_skin : result.from_skin;
  const color = skin.rarity_color;

  badge.textContent    = result.won ? 'WIN' : 'LOSS';
  badge.style.color    = result.won ? '#22c55e' : '#c0503e';
  badge.style.borderColor = result.won ? '#22c55e' : '#c0503e';
  badge.style.boxShadow = `0 0 18px ${result.won ? '#22c55e' : '#c0503e'}50`;

  glow.style.background = `radial-gradient(ellipse at top, ${color}30 0%, transparent 65%)`;
  card.style.borderTopColor = color;

  img.src = `/api/image/weapon-crop?url=${encodeURIComponent(skin.image_url)}`;
  img.style.filter = `drop-shadow(0 8px 28px ${color}80)`;

  name.textContent = `${skin.weapon} | ${skin.skin_name}`;
  name.style.color = color;

  const pct = (result.win_chance / 100).toFixed(2);
  meta.innerHTML = result.won
    ? `<span style="color:var(--text-secondary)">Chance foi ${pct}% · você ganhou!</span>`
    : `<span style="color:var(--text-secondary)">Chance era ${pct}% · tente novamente</span>`;

  overlay.classList.add('active');
}
