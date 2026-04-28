/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section frontend
 */
// ===== Case Opening Roulette =====

let caseData      = null;
let isSpinning    = false;
let currentSortMode = 'price';
let selectedQty   = 1;
let fastMode      = false;
let lastOpenedResults = []; // [{ opening_id, won_skin }]
let stopRouletteFn = null;
let multiStopFns   = [];

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const caseId = params.get('id');
  if (!caseId) { window.location.href = '/cases.html'; return; }

  await loadCaseDetail(caseId);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (!caseData) return;
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    if (e.key === 'Enter') {
      e.preventDefault();
      handleOpen(caseData.id);
    } else if (e.key === ' ') {
      e.preventDefault();
      if (stopRouletteFn) stopRouletteFn();
      if (multiStopFns.length) { multiStopFns.forEach(fn => fn()); multiStopFns = []; }
    } else if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      sellAllResults();
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      if (!isSpinning) handleOpen(caseData.id);
    }
  });
});

// ===== Load case data =====
async function loadCaseDetail(caseId) {
  try {
    caseData = await apiFetch(`/cases/${caseId}`);

    const bestSkin = caseData.skins.reduce(
      (best, s) => ((s.market_price || 0) > (best.market_price || 0) ? s : best),
      caseData.skins[0]
    );

    const heroColor  = bestSkin.rarity_color || '#4b69ff';
    const rawHeroImg = bestSkin.image_url || '';
    const skinImg    = rawHeroImg ? `/api/image/weapon-crop?url=${encodeURIComponent(rawHeroImg)}` : '';

    // Hero background: blurred best skin + rarity glow
    const bgEl = document.getElementById('open-hero-bg');
    bgEl.innerHTML = `
      <div style="position:absolute;inset:-50px;background:url(${rawHeroImg}) center/cover no-repeat;filter:blur(48px) brightness(0.18) saturate(2.4);"></div>
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse 75% 55% at 50% 30%, ${heroColor}28 0%, transparent 65%);"></div>
    `;
    document.getElementById('open-case-visual').innerHTML = `
      <img
        src="${skinImg}"
        alt="${bestSkin.weapon} | ${bestSkin.skin_name}"
        class="open-case-visual-img"
        style="filter: drop-shadow(0 22px 52px ${heroColor}70)"
      >
    `;

    // Meta
    document.getElementById('open-case-title').textContent = caseData.name;
    document.getElementById('open-case-price').textContent = formatPrice(caseData.price);
    document.getElementById('open-case-meta').style.display = 'flex';

    updateOpenBtn();
    document.getElementById('open-btn').addEventListener('click', () => handleOpen(caseData.id));

    // Qty selector
    document.getElementById('qty-selector').addEventListener('click', (e) => {
      const btn = e.target.closest('.qty-btn');
      if (!btn || isSpinning) return;
      document.querySelectorAll('.qty-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedQty = parseInt(btn.dataset.qty);
      updateOpenBtn();
    });

    // Fast mode
    document.getElementById('fast-mode-check').addEventListener('change', (e) => {
      fastMode = e.target.checked;
    });

    // Results section buttons
    document.getElementById('sell-all-btn').addEventListener('click', sellAllResults);
    document.getElementById('repeat-btn').addEventListener('click', () => {
      if (!isSpinning) handleOpen(caseData.id);
    });

    // Possible skins
    renderPossibleSkins(caseData.skins, currentSortMode);
    document.getElementById('skins-sort-tabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.skins-sort-btn');
      if (!btn) return;
      document.querySelectorAll('.skins-sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSortMode = btn.dataset.sort;
      renderPossibleSkins(caseData.skins, currentSortMode);
    });
    document.getElementById('possible-skins').style.display = 'block';

  } catch {
    document.getElementById('open-case-visual').innerHTML =
      `<div class="empty-state"><p>Caixa não encontrada.</p><a href="/cases.html" class="btn btn-secondary">Voltar</a></div>`;
  }
}

function updateOpenBtn() {
  const btn = document.getElementById('open-btn');
  if (!btn || !caseData) return;
  const totalPrice = caseData.price * selectedQty;
  const qtyLabel   = selectedQty > 1 ? `${selectedQty}x · ` : '';
  btn.innerHTML = `${qtyLabel}${formatPrice(totalPrice)}`;
}

// ===== Handle open — branches on qty + fast mode =====
async function handleOpen(caseId) {
  if (isSpinning) return;
  if (!isLoggedIn()) { window.location.href = '/login.html'; return; }

  if (selectedQty === 1 && !fastMode) {
    await handleSingleOpen(caseId);
  } else {
    await handleMultiOpen(caseId, selectedQty);
  }
}

// Single open with roulette animation
async function handleSingleOpen(caseId) {
  const openBtn = document.getElementById('open-btn');
  openBtn.disabled = true;
  isSpinning = true;

  document.getElementById('results-section').style.display = 'none';
  document.getElementById('multi-roulette-section').style.display = 'none';
  document.getElementById('roulette-section').style.display = 'block';
  requestAnimationFrame(() => {
    const _rs = document.getElementById('roulette-section');
    const top = _rs.getBoundingClientRect().top + window.scrollY - (window.innerHeight - _rs.offsetHeight) / 2;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  });

  try {
    const result = await apiFetch(`/cases/${caseId}/open`, { method: 'POST' });

    const balEl = document.getElementById('nav-balance');
    if (balEl) balEl.textContent = formatPrice(result.new_balance);

    lastOpenedResults = [{ opening_id: result.won_skin.opening_id, won_skin: result.won_skin }];

    await runRoulette(result.animation_items, result.won_skin);
    showResult(result.won_skin);

  } catch (err) {
    showToast(err.message, 'error');
    openBtn.disabled = false;
    isSpinning = false;
  }
}

// Multi-open or fast-mode single
async function handleMultiOpen(caseId, qty) {
  const openBtn = document.getElementById('open-btn');
  openBtn.disabled = true;
  isSpinning = true;
  multiStopFns = [];

  document.getElementById('roulette-section').style.display = 'none';
  document.getElementById('results-section').style.display = 'none';
  document.getElementById('multi-roulette-section').style.display = 'none';

  try {
    let results, newBalance;

    if (qty === 1) {
      const r = await apiFetch(`/cases/${caseId}/open`, { method: 'POST' });
      results    = [{ opening_id: r.won_skin.opening_id, won_skin: r.won_skin, animation_items: r.animation_items }];
      newBalance = r.new_balance;
    } else {
      const batchRes = await apiFetch(`/cases/${caseId}/open-batch`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ quantity: qty }),
      });
      results    = batchRes.results;
      newBalance = batchRes.new_balance;
    }

    lastOpenedResults = results;

    const balEl = document.getElementById('nav-balance');
    if (balEl) balEl.textContent = formatPrice(newBalance);

    if (!fastMode && results.length > 0) {
      const tracksEl = document.getElementById('multi-roulette-tracks');
      const qty = results.length;
      const cols = qty <= 5 ? qty : qty <= 6 ? 3 : qty <= 8 ? 4 : 5;
      tracksEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

      tracksEl.innerHTML = results.map((_, i) => `
        <div class="multi-roulette-track" id="multi-track-${i}">
          <span class="multi-track-num">${i + 1}</span>
          <div class="roulette-fade-left"></div>
          <div class="roulette-fade-right"></div>
          <div class="roulette-indicator">
            <div class="roulette-indicator-line"></div>
            <div class="roulette-indicator-arrow-top"></div>
            <div class="roulette-indicator-arrow-bot"></div>
          </div>
          <div class="roulette-strip"></div>
        </div>
      `).join('');

      document.getElementById('multi-roulette-section').style.display = 'block';
      requestAnimationFrame(() => {
        const _mrs = document.getElementById('multi-roulette-section');
        const top = _mrs.getBoundingClientRect().top + window.scrollY - (window.innerHeight - _mrs.offsetHeight) / 2;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      });

      await Promise.all(results.map((r, i) => {
        const trackEl = document.getElementById(`multi-track-${i}`);
        return runCompactRoulette(trackEl, r.animation_items || [], r.won_skin);
      }));

      await new Promise(res => setTimeout(res, 500));
    }

    showMultiResults(results);

  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    openBtn.disabled = false;
    isSpinning = false;
    multiStopFns = [];
  }
}

// ===== Show results grid =====
function showMultiResults(results) {
  const section = document.getElementById('results-section');
  const grid    = document.getElementById('results-title');
  const title   = document.getElementById('results-title');

  title.textContent = `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}`;

  document.getElementById('results-grid').innerHTML = results.map((r, i) => {
    const skin = r.won_skin;
    const displayPrice = skin.site_price || skin.market_price;
    return `
      <div class="open-result-card" style="animation-delay: ${Math.min(i * 0.06, 0.55)}s">
        <div class="open-result-card-top" style="border-top: 2px solid ${skin.rarity_color}; background: ${skin.rarity_color}12">
          <img src="/api/image/weapon-crop?url=${encodeURIComponent(skin.image_url)}" alt="${skin.weapon} | ${skin.skin_name}" class="open-result-card-img">
        </div>
        <div class="open-result-card-info">
          <div class="open-result-card-name">${skin.weapon} | ${skin.skin_name}</div>
          <div class="open-result-card-meta-row">
            <div class="open-result-card-wear">${wearLabel(skin.wear)}</div>
            <div class="open-result-card-price">${formatPrice(displayPrice)}</div>
          </div>
          <div class="open-result-card-actions">
            <button class="open-result-card-keep" data-idx="${i}">Guardar</button>
            <button class="open-result-card-sell" data-idx="${i}" data-opening-id="${r.opening_id || ''}">Vender</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Keep buttons
  document.querySelectorAll('.open-result-card-keep').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('kept')) return;
      btn.textContent = 'Guardado';
      btn.classList.add('kept');
      const sellBtn = btn.closest('.open-result-card-actions').querySelector('.open-result-card-sell');
      if (sellBtn) { sellBtn.textContent = 'Vendido'; sellBtn.classList.add('sold'); }
      showToast('Skin guardada no inventário!');
    });
  });

  // Individual sell buttons
  document.querySelectorAll('.open-result-card-sell').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('sold')) return;
      sellByOpeningId(parseInt(btn.dataset.idx), btn);
    });
  });

  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function sellByOpeningId(idx, btn) {
  const r = lastOpenedResults[idx];
  if (!r?.opening_id) { showToast('ID de abertura não encontrado', 'error'); return; }

  try {
    const result = await apiFetch(`/inventory/${r.opening_id}/sell`, { method: 'POST' });
    const balEl = document.getElementById('nav-balance');
    if (balEl) balEl.textContent = formatPrice(result.new_balance);
    btn.textContent = 'Vendido';
    btn.classList.add('sold');
    showToast(`Vendido por ${formatPrice(result.sell_price)}!`);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function sellAllResults() {
  if (!lastOpenedResults.length) return;

  let totalSold = 0;
  let count = 0;

  for (let i = 0; i < lastOpenedResults.length; i++) {
    const r = lastOpenedResults[i];
    if (!r.opening_id) continue;

    const btn = document.querySelector(`.open-result-card-sell[data-idx="${i}"]`);
    if (btn?.classList.contains('sold')) continue;

    try {
      const result = await apiFetch(`/inventory/${r.opening_id}/sell`, { method: 'POST' });
      const balEl = document.getElementById('nav-balance');
      if (balEl) balEl.textContent = formatPrice(result.new_balance);
      if (btn) { btn.textContent = 'Vendido'; btn.classList.add('sold'); }
      totalSold += result.sell_price || 0;
      count++;
    } catch {}
  }

  if (count > 0) showToast(`${count} item(s) vendido(s)! Total: ${formatPrice(totalSold)}`);
}

// ===== Render possible skins =====
const WEIGHT_BASE = 100000;
let skinGroups = [];

function fmtPct(weight) {
  const pct = weight / WEIGHT_BASE * 100;
  return (pct < 0.001 ? pct.toFixed(4) : pct < 0.1 ? pct.toFixed(3) : pct.toFixed(2)) + '%';
}

function renderPossibleSkins(skins, sortMode) {
  const skinsGrid = document.getElementById('skins-grid');

  const groupMap = {};
  skins.forEach(s => {
    const key = `${s.weapon}|||${s.skin_name}`;
    if (!groupMap[key]) groupMap[key] = [];
    groupMap[key].push(s);
  });

  let groups = Object.values(groupMap).map(variants => {
    const rep = variants.reduce((best, s) =>
      (s.site_price || s.market_price || 0) > (best.site_price || best.market_price || 0) ? s : best, variants[0]);
    const totalWeight = variants.reduce((sum, s) => sum + Number(s.weight), 0);
    return { rep, variants, totalWeight };
  });

  if (sortMode === 'price') {
    groups.sort((a, b) => (b.rep.site_price || b.rep.market_price || 0) - (a.rep.site_price || a.rep.market_price || 0));
  } else if (sortMode === 'chance') {
    groups.sort((a, b) => b.totalWeight - a.totalWeight);
  } else if (sortMode === 'rarity') {
    const rarityOrder = { extraordinary: 0, covert: 1, classified: 2, restricted: 3, mil_spec: 4, industrial: 5, consumer: 6 };
    groups.sort((a, b) => (rarityOrder[a.rep.rarity] ?? 9) - (rarityOrder[b.rep.rarity] ?? 9));
  }

  skinGroups = groups;

  skinsGrid.innerHTML = groups.map(({ rep, totalWeight }, idx) => {
    const displayPrice = rep.site_price || rep.market_price;
    return `
      <div class="possible-skin-item" style="--item-rarity: ${rep.rarity_color}; border-bottom-color: ${rep.rarity_color}">
        <button class="skin-info-btn" data-group="${idx}" title="Ver variantes">ⓘ</button>
        <div class="possible-skin-img-wrap"><img src="/api/image/weapon-crop?url=${encodeURIComponent(rep.image_url)}" alt="${rep.name}"></div>
        <div class="name">${rep.weapon} | ${rep.skin_name}</div>
        <div class="price">${formatPrice(displayPrice)}</div>
        <div class="drop-chance">
          <span class="drop-wear">${wearLabel(rep.wear)}</span>
          <strong>${fmtPct(totalWeight)}</strong>
        </div>
      </div>
    `;
  }).join('');

  skinsGrid.querySelectorAll('.skin-info-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showSkinInfo(skinGroups[Number(btn.dataset.group)]);
    });
  });
}

function showSkinInfo({ rep, variants }) {
  const wearOrder = ['FN', 'MW', 'FT', 'WW', 'BS'];
  const sorted = [...variants].sort((a, b) => wearOrder.indexOf(a.wear) - wearOrder.indexOf(b.wear));

  document.getElementById('skin-info-img').src = rep.image_url;
  document.getElementById('skin-info-name').textContent = `${rep.weapon} | ${rep.skin_name}`;
  document.getElementById('skin-info-tbody').innerHTML = sorted.map(s => {
    const price = s.site_price || s.market_price;
    return `<tr>
      <td>${s.wear}</td>
      <td>${formatPrice(price)}</td>
      <td>${fmtPct(Number(s.weight))}</td>
    </tr>`;
  }).join('');

  document.getElementById('skin-info-modal').classList.add('active');
}

function closeSkinInfo() {
  document.getElementById('skin-info-modal').classList.remove('active');
}

// ===== Compact roulette (multi-open tracks) =====
function runCompactRoulette(trackEl, items, wonSkin) {
  return new Promise((resolve) => {
    const strip = trackEl.querySelector('.roulette-strip');

    strip.classList.remove('spinning');
    strip.style.transition = '';
    strip.style.transform  = 'translateY(-50%) translateX(0px)';

    strip.innerHTML = items.map((item, i) => `
      <div class="roulette-item" data-index="${i}"
           style="border-bottom-color: ${item.rarity_color}; --item-glow: ${item.rarity_color}40">
        <img src="/api/image/weapon-crop?url=${encodeURIComponent(item.image_url)}" alt="">
        <div class="roulette-item-name">${item.name || ''}</div>
      </div>
    `).join('');

    const ITEM_W   = 130; // 124px + 6px gap (must match CSS .multi-roulette-track .roulette-item width)
    const STRIP_PAD = 8;  // .roulette-strip padding-left
    const WIN_IDX  = 37;
    const wrapW    = trackEl.offsetWidth;
    const finalX   = STRIP_PAD + (WIN_IDX * ITEM_W) - (wrapW / 2) + (ITEM_W / 2) + (Math.random() - 0.5) * 40;

    let resolved = false;
    let spinTimeout;

    function finish() {
      if (resolved) return;
      resolved = true;
      const winEl = strip.querySelector(`[data-index="${WIN_IDX}"]`);
      if (winEl) {
        winEl.classList.add('winner');
        winEl.style.setProperty('--win-color', wonSkin.rarity_color || 'var(--brass)');
      }
      resolve();
    }

    const stopFn = () => {
      clearTimeout(spinTimeout);
      strip.classList.remove('spinning');
      strip.style.transition = 'none';
      strip.style.transform  = `translateY(-50%) translateX(-${finalX}px)`;
      finish();
    };
    multiStopFns.push(stopFn);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        strip.classList.add('spinning');
        strip.style.transform = `translateY(-50%) translateX(-${finalX}px)`;
      });
    });

    spinTimeout = setTimeout(finish, 5700);
  });
}

// ===== Roulette animation (single open) =====
function runRoulette(items, wonSkin) {
  return new Promise((resolve) => {
    const wrapper   = document.getElementById('roulette-wrapper');
    const strip     = document.getElementById('roulette-strip');

    strip.classList.remove('spinning');
    strip.style.transition = '';
    strip.style.transform  = 'translateY(-50%) translateX(0px)';

    strip.innerHTML = items.map((item, i) => `
      <div class="roulette-item"
           data-index="${i}"
           style="border-bottom-color: ${item.rarity_color}; --item-glow: ${item.rarity_color}40">
        <img src="/api/image/weapon-crop?url=${encodeURIComponent(item.image_url)}" alt="${item.name}">
        <div class="roulette-item-name">${item.weapon || ''} | ${item.skin_name || item.name}</div>
        <div class="roulette-item-wear">${wearLabel(item.wear)}</div>
      </div>
    `).join('');

    const itemWidth    = 156; // 150px + 6px gap (must match CSS .roulette-item width)
    const stripPad     = 8;   // .roulette-strip padding-left
    const winnerIndex  = 37;
    const wrapperWidth = wrapper.offsetWidth;
    const targetOffset = stripPad + (winnerIndex * itemWidth) - (wrapperWidth / 2) + (itemWidth / 2);
    const randomOffset = (Math.random() - 0.5) * 50;
    const finalX       = targetOffset + randomOffset;

    let resolved = false;
    let spinTimeout;

    function finish() {
      if (resolved) return;
      resolved = true;
      stopRouletteFn = null;
      const winnerEl = strip.querySelector(`[data-index="${winnerIndex}"]`);
      if (winnerEl) {
        winnerEl.classList.add('winner');
        winnerEl.style.setProperty('--win-color', wonSkin.rarity_color || 'var(--accent)');
      }
      resolve();
    }

    // Space = quick stop
    stopRouletteFn = () => {
      clearTimeout(spinTimeout);
      strip.classList.remove('spinning');
      strip.style.transition = 'none';
      strip.style.transform  = `translateY(-50%) translateX(-${finalX}px)`;
      finish();
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        strip.classList.add('spinning');
        strip.style.transform = `translateY(-50%) translateX(-${finalX}px)`;
      });
    });

    spinTimeout = setTimeout(() => { finish(); }, 5700);
  });
}

// ===== Show single-open result popup =====
function showResult(skin) {
  const popup      = document.getElementById('result-popup');
  const rarityColor = skin.rarity_color || '#4b69ff';

  document.getElementById('result-glow').style.background =
    `radial-gradient(ellipse at center, ${rarityColor}30 0%, transparent 70%)`;
  document.getElementById('result-img').src = `/api/image/weapon-crop?url=${encodeURIComponent(skin.image_url)}`;
  document.getElementById('result-img').style.filter = `drop-shadow(0 8px 30px ${rarityColor}80)`;
  document.getElementById('result-name').textContent = `${skin.weapon} | ${skin.skin_name}`;
  document.getElementById('result-rarity').textContent = formatRarityLabel(skin.rarity);
  document.getElementById('result-rarity').style.color = rarityColor;

  const wearEl = document.getElementById('result-wear');
  if (wearEl && skin.wear) {
    wearEl.textContent = wearLabel(skin.wear);
    wearEl.className   = `wear-badge wear-${skin.wear}`;
  }

  const displayPrice = skin.site_price || skin.market_price;
  document.getElementById('result-price').textContent = formatPrice(displayPrice);
  document.getElementById('result-content').style.borderColor = `${rarityColor}60`;

  popup.classList.add('active');

  document.getElementById('btn-keep').onclick = () => {
    closeResult();
    showToast('Skin adicionada ao inventário!');
  };

  document.getElementById('btn-sell').innerHTML = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    Vender — ${formatPrice(displayPrice)}
  `;

  document.getElementById('btn-sell').onclick = async () => {
    const r = lastOpenedResults[0];
    if (!r?.opening_id) { showToast('ID não encontrado', 'error'); return; }
    try {
      const result = await apiFetch(`/inventory/${r.opening_id}/sell`, { method: 'POST' });
      const balEl = document.getElementById('nav-balance');
      if (balEl) balEl.textContent = formatPrice(result.new_balance);
      closeResult();
      showToast(`Vendido por ${formatPrice(result.sell_price)}!`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  document.getElementById('btn-open-again').onclick = () => {
    closeResult();
    setTimeout(() => handleOpen(caseData.id), 200);
  };
}

function closeResult() {
  document.getElementById('result-popup').classList.remove('active');
  document.getElementById('open-btn').disabled = false;
  isSpinning = false;
  const section = document.getElementById('roulette-section');
  section.style.display = 'none';
  document.getElementById('roulette-strip').innerHTML = '';
}

// ===== Helpers =====
function wearLabel(wear) {
  const map = { FN: 'Factory New', MW: 'Minimal Wear', FT: 'Field-Tested', WW: 'Well-Worn', BS: 'Battle-Scarred' };
  return map[wear] || wear || '';
}

function formatRarityLabel(rarity) {
  const map = {
    consumer: 'Consumer Grade', industrial: 'Industrial Grade', mil_spec: 'Mil-Spec Grade',
    restricted: 'Restricted', classified: 'Classified', covert: 'Covert', extraordinary: 'Extraordinary',
  };
  return map[rarity] || (rarity || '').replace('_', ' ');
}
