// ===== Case Opening Roulette =====

let caseData = null;
let isSpinning = false;
let lastOpeningId = null;

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

    // Render header
    document.getElementById('case-header').innerHTML = `
      <img src="${caseData.image_url}" alt="${caseData.name}">
      <h2>${caseData.name}</h2>
      <div class="case-open-price">${formatPrice(caseData.price)}</div>
    `;

    // Show open button
    const openBtn = document.getElementById('open-btn');
    openBtn.style.display = 'inline-flex';
    openBtn.textContent = `ABRIR POR ${formatPrice(caseData.price)}`;
    openBtn.addEventListener('click', () => handleOpen(caseData.id));

    // Render possible skins
    const skinsSection = document.getElementById('possible-skins');
    const skinsGrid = document.getElementById('skins-grid');
    skinsSection.style.display = 'block';

    skinsGrid.innerHTML = caseData.skins.map(s => `
      <div class="possible-skin-item" style="border-bottom: 3px solid ${s.rarity_color}">
        <img src="${s.image_url}" alt="${s.name}">
        <div class="name">${s.name}</div>
        <div class="price">${formatPrice(s.market_price)}</div>
      </div>
    `).join('');

  } catch (err) {
    document.getElementById('case-header').innerHTML =
      `<div class="empty-state"><p>Caixa não encontrada.</p><a href="/cases.html" class="btn btn-secondary">Voltar</a></div>`;
  }
}

async function handleOpen(caseId) {
  if (isSpinning || !isLoggedIn()) {
    if (!isLoggedIn()) window.location.href = '/login.html';
    return;
  }

  const openBtn = document.getElementById('open-btn');
  openBtn.disabled = true;
  isSpinning = true;

  try {
    const result = await apiFetch(`/cases/${caseId}/open`, { method: 'POST' });

    // Update navbar balance
    const balEl = document.getElementById('nav-balance');
    if (balEl) balEl.textContent = formatPrice(result.new_balance);

    // Run roulette animation
    await runRoulette(result.animation_items, result.won_skin);

    // Show result popup
    showResult(result.won_skin);

  } catch (err) {
    showToast(err.message, 'error');
    openBtn.disabled = false;
    isSpinning = false;
  }
}

function runRoulette(items, wonSkin) {
  return new Promise((resolve) => {
    const wrapper = document.getElementById('roulette-wrapper');
    const strip = document.getElementById('roulette-strip');

    wrapper.style.display = 'block';
    strip.classList.remove('spinning');

    // Build strip HTML
    strip.innerHTML = items.map((item, i) => `
      <div class="roulette-item" data-index="${i}" style="border-bottom: 3px solid ${item.rarity_color}">
        <img src="${item.image_url}" alt="${item.name}">
        <div class="roulette-item-name">${item.name}</div>
      </div>
    `).join('');

    // Calculate scroll distance
    // Winner is at index 37, each item is 134px (130px + 4px gap)
    const itemWidth = 134;
    const winnerIndex = 37;
    const wrapperWidth = wrapper.offsetWidth;
    const targetOffset = (winnerIndex * itemWidth) - (wrapperWidth / 2) + (itemWidth / 2);

    // Add small random offset for variation
    const randomOffset = (Math.random() - 0.5) * 60;

    // Reset position
    strip.style.transform = `translateY(-50%) translateX(0px)`;

    // Start animation after brief pause
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        strip.classList.add('spinning');
        strip.style.transform = `translateY(-50%) translateX(-${targetOffset + randomOffset}px)`;
      });
    });

    // After animation completes
    setTimeout(() => {
      // Highlight winner
      const winnerEl = strip.querySelector(`[data-index="${winnerIndex}"]`);
      if (winnerEl) winnerEl.classList.add('winner');
      resolve();
    }, 5200);
  });
}

function showResult(skin) {
  const popup = document.getElementById('result-popup');
  document.getElementById('result-img').src = skin.image_url;
  document.getElementById('result-name').textContent = skin.name;
  document.getElementById('result-rarity').textContent = skin.rarity.replace('_', ' ');
  document.getElementById('result-rarity').style.color = skin.rarity_color;
  document.getElementById('result-price').textContent = formatPrice(skin.market_price);

  // Update sell button text
  document.getElementById('btn-sell').textContent = `Vender por ${formatPrice(skin.market_price)}`;

  popup.classList.add('active');

  // Keep button - just close popup
  document.getElementById('btn-keep').onclick = () => {
    closeResult();
    showToast('Skin adicionada ao inventário!');
  };

  // Sell button
  document.getElementById('btn-sell').onclick = async () => {
    try {
      // Get the latest opening to sell
      const inventory = await apiFetch('/inventory');
      const latestItem = inventory[0]; // Most recent unsold item

      if (latestItem) {
        const result = await apiFetch(`/inventory/${latestItem.opening_id}/sell`, { method: 'POST' });

        // Update balance
        const balEl = document.getElementById('nav-balance');
        if (balEl) balEl.textContent = formatPrice(result.new_balance);

        closeResult();
        showToast(`Vendido por ${formatPrice(result.sell_price)}!`);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
}

function closeResult() {
  document.getElementById('result-popup').classList.remove('active');
  document.getElementById('open-btn').disabled = false;
  isSpinning = false;
}
