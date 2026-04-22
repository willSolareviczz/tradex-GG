/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section frontend
 */
// ===== Case Opening Roulette =====

let caseData = null;
let isSpinning = false;
let currentSortMode = 'price';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const caseId = params.get('id');

  if (!caseId) {
    window.location.href = '/cases.html';
    return;
  }

  await loadCaseDetail(caseId);
});

async function loadCaseDetail(caseId) {
  try {
    caseData = await apiFetch(`/cases/${caseId}`);

    const bestSkin = caseData.skins.reduce(
      (best, s) => (s.market_price > best.market_price ? s : best),
      caseData.skins[0]
    );

    // Hero glow colors based on best skin
    const heroColor = bestSkin.rarity_color || '#4b69ff';
    document.getElementById('open-hero-bg').style.setProperty(
      'background',
      `radial-gradient(ellipse at 50% 0%, ${heroColor}20 0%, transparent 65%)`
    );

    // Render case image — usa sempre o render limpo da skin (sem fundo)
    document.getElementById('open-case-visual').innerHTML = `
      <div class="open-case-visual-orb" style="--hero-orb: ${heroColor}40"></div>
      <img
        src="${bestSkin.image_url}"
        alt="${caseData.name}"
        class="open-case-visual-img"
        style="--hero-img-glow: ${heroColor}60"
      >
    `;

    // Render meta
    const metaEl = document.getElementById('open-case-meta');
    document.getElementById('open-case-title').textContent = caseData.name;
    document.getElementById('open-case-price').textContent = formatPrice(caseData.price);
    metaEl.style.display = 'block';

    // Open button
    const openBtn = document.getElementById('open-btn');
    openBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 3l14 9-14 9V3z"/></svg>
      ABRIR — ${formatPrice(caseData.price)}
    `;
    openBtn.addEventListener('click', () => handleOpen(caseData.id));

    // Render possible skins
    renderPossibleSkins(caseData.skins, currentSortMode);

    // Sort tabs
    document.getElementById('skins-sort-tabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.skins-sort-btn');
      if (!btn) return;
      document.querySelectorAll('.skins-sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSortMode = btn.dataset.sort;
      renderPossibleSkins(caseData.skins, currentSortMode);
    });

    document.getElementById('possible-skins').style.display = 'block';

  } catch (err) {
    document.getElementById('open-case-visual').innerHTML =
      `<div class="empty-state"><p>Caixa não encontrada.</p><a href="/cases.html" class="btn btn-secondary">Voltar</a></div>`;
  }
}

// ===== Render possible skins =====
// Pesos são baseados em escala 100.000 — weight=1 → 0.001%, weight=3 → 0.003%, etc.
const WEIGHT_BASE = 100000;
let skinGroups = [];

function fmtPct(weight) {
  const pct = weight / WEIGHT_BASE * 100;
  return (pct < 0.001 ? pct.toFixed(4) : pct < 0.1 ? pct.toFixed(3) : pct.toFixed(2)) + '%';
}

function renderPossibleSkins(skins, sortMode) {
  const skinsGrid = document.getElementById('skins-grid');

  // Group by weapon + skin_name
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
        <img src="${rep.image_url}" alt="${rep.name}">
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

// ===== Handle open =====
async function handleOpen(caseId) {
  if (isSpinning) return;
  if (!isLoggedIn()) {
    window.location.href = '/login.html';
    return;
  }

  const openBtn = document.getElementById('open-btn');
  openBtn.disabled = true;
  isSpinning = true;

  // Show roulette section
  document.getElementById('roulette-section').style.display = 'block';
  document.getElementById('roulette-section').scrollIntoView({ behavior: 'smooth', block: 'center' });

  try {
    const result = await apiFetch(`/cases/${caseId}/open`, { method: 'POST' });

    // Update navbar balance
    const balEl = document.getElementById('nav-balance');
    if (balEl) balEl.textContent = formatPrice(result.new_balance);

    // Run roulette
    await runRoulette(result.animation_items, result.won_skin);

    // Show result popup
    showResult(result.won_skin);

  } catch (err) {
    showToast(err.message, 'error');
    openBtn.disabled = false;
    isSpinning = false;
  }
}

// ===== Roulette animation =====
function runRoulette(items, wonSkin) {
  return new Promise((resolve) => {
    const wrapper = document.getElementById('roulette-wrapper');
    const strip = document.getElementById('roulette-strip');

    strip.classList.remove('spinning');
    strip.style.transform = 'translateY(-50%) translateX(0px)';

    // Build strip HTML
    strip.innerHTML = items.map((item, i) => `
      <div class="roulette-item"
           data-index="${i}"
           style="border-bottom-color: ${item.rarity_color}; --item-glow: ${item.rarity_color}40">
        <img src="${item.image_url}" alt="${item.name}">
        <div class="roulette-item-name">${item.weapon || ''} | ${item.skin_name || item.name}</div>
        <div class="roulette-item-wear">${wearLabel(item.wear)}</div>
      </div>
    `).join('');

    // Calculate target scroll
    const itemWidth = 156; // 150px + 6px gap
    const winnerIndex = 37;
    const wrapperWidth = wrapper.offsetWidth;
    const targetOffset = (winnerIndex * itemWidth) - (wrapperWidth / 2) + (itemWidth / 2);
    const randomOffset = (Math.random() - 0.5) * 50;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        strip.classList.add('spinning');
        strip.style.transform = `translateY(-50%) translateX(-${targetOffset + randomOffset}px)`;
      });
    });

    setTimeout(() => {
      const winnerEl = strip.querySelector(`[data-index="${winnerIndex}"]`);
      if (winnerEl) {
        winnerEl.classList.add('winner');
        winnerEl.style.setProperty('--win-color', wonSkin.rarity_color || 'var(--accent)');
      }
      resolve();
    }, 5700);
  });
}

// ===== Show result popup =====
function showResult(skin) {
  const popup = document.getElementById('result-popup');
  const rarityColor = skin.rarity_color || '#4b69ff';

  // Set glow color
  document.getElementById('result-glow').style.setProperty(
    '--result-glow-color', `${rarityColor}30`
  );
  document.getElementById('result-glow').style.background =
    `radial-gradient(ellipse at center, ${rarityColor}30 0%, transparent 70%)`;

  document.getElementById('result-img').src = skin.image_url;
  document.getElementById('result-img').style.setProperty(
    '--result-img-shadow', `${rarityColor}60`
  );
  document.getElementById('result-img').style.filter =
    `drop-shadow(0 8px 30px ${rarityColor}80)`;

  document.getElementById('result-name').textContent = `${skin.weapon} | ${skin.skin_name}`;
  document.getElementById('result-rarity').textContent = formatRarityLabel(skin.rarity);
  document.getElementById('result-rarity').style.color = rarityColor;

  const wearEl = document.getElementById('result-wear');
  if (wearEl && skin.wear) {
    wearEl.textContent = wearLabel(skin.wear);
    wearEl.className = `wear-badge wear-${skin.wear}`;
  }

  const displayPrice = skin.site_price || skin.market_price;
  document.getElementById('result-price').textContent = formatPrice(displayPrice);

  // Result content border gets rarity color
  document.getElementById('result-content').style.borderColor = `${rarityColor}60`;

  popup.classList.add('active');

  // Keep button
  document.getElementById('btn-keep').onclick = () => {
    closeResult();
    showToast('Skin adicionada ao inventário!');
  };

  // Sell button
  document.getElementById('btn-sell').textContent = '';
  document.getElementById('btn-sell').innerHTML = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    Vender — ${formatPrice(displayPrice)}
  `;

  document.getElementById('btn-sell').onclick = async () => {
    try {
      const inventory = await apiFetch('/inventory');
      const latestItem = inventory[0];
      if (latestItem) {
        const result = await apiFetch(`/inventory/${latestItem.opening_id}/sell`, { method: 'POST' });
        const balEl = document.getElementById('nav-balance');
        if (balEl) balEl.textContent = formatPrice(result.new_balance);
        closeResult();
        showToast(`Vendido por ${formatPrice(result.sell_price)}!`);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Open again button
  document.getElementById('btn-open-again').onclick = () => {
    closeResult();
    setTimeout(() => handleOpen(caseData.id), 200);
  };
}

function closeResult() {
  document.getElementById('result-popup').classList.remove('active');
  document.getElementById('open-btn').disabled = false;
  isSpinning = false;

  // Reset roulette section
  const section = document.getElementById('roulette-section');
  section.style.display = 'none';
  document.getElementById('roulette-strip').innerHTML = '';
}

// ===== Helpers =====
function wearLabel(wear) {
  const map = {
    FN: 'Factory New',
    MW: 'Minimal Wear',
    FT: 'Field-Tested',
    WW: 'Well-Worn',
    BS: 'Battle-Scarred',
  };
  return map[wear] || wear || '';
}

function formatRarityLabel(rarity) {
  const map = {
    consumer: 'Consumer Grade',
    industrial: 'Industrial Grade',
    mil_spec: 'Mil-Spec Grade',
    restricted: 'Restricted',
    classified: 'Classified',
    covert: 'Covert',
    extraordinary: 'Extraordinary',
  };
  return map[rarity] || (rarity || '').replace('_', ' ');
}
