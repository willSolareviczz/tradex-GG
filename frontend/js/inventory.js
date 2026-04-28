/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section frontend
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (!isLoggedIn()) {
    window.location.href = '/login.html';
    return;
  }

  await loadInventory();
});

async function loadInventory() {
  const grid = document.getElementById('inventory-grid');

  try {
    const items = await apiFetch('/inventory');

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <p>Seu inventário está vazio.</p>
          <a href="/cases.html" class="btn btn-primary">Abrir Caixas</a>
        </div>`;
      return;
    }

    const wearLabels = { FN: 'Factory New', MW: 'Minimal Wear', FT: 'Field-Tested', WW: 'Well-Worn', BS: 'Battle-Scarred' };
    grid.innerHTML = items.map(item => {
      const price = item.site_price || item.market_price;
      const wearText = wearLabels[item.wear] || item.wear || '';
      return `
      <div class="skin-card" style="border-color: ${item.rarity_color}">
        <div class="skin-card-visual">
          <img src="/api/image/weapon-crop?url=${encodeURIComponent(item.image_url)}" alt="${item.name}" class="skin-card-img">
        </div>
        <div class="skin-card-info">
          <div class="skin-card-name">${item.weapon} | ${item.skin_name}</div>
          <div class="skin-card-rarity-row">
            <span class="skin-card-rarity" style="color: ${item.rarity_color}">${item.rarity.replace('_', ' ')}</span>
            ${item.wear ? `<span class="wear-badge wear-${item.wear}">${wearText}</span>` : ''}
          </div>
          <div class="skin-card-price">${formatPrice(price)}</div>
          <div class="skin-card-case">de: ${item.case_name}</div>
        </div>
        <div class="skin-card-actions">
          <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="sellItem(${item.opening_id}, this)">
            Vender por ${formatPrice(price)}
          </button>
        </div>
      </div>`
    }).join('');
  } catch {
    grid.innerHTML = '<div class="empty-state"><p>Erro ao carregar inventário.</p></div>';
  }
}

async function sellItem(openingId, btn) {
  btn.disabled = true;
  btn.textContent = 'Vendendo...';

  try {
    const result = await apiFetch(`/inventory/${openingId}/sell`, { method: 'POST' });

    // Update balance in navbar
    const balEl = document.getElementById('nav-balance');
    if (balEl) balEl.textContent = formatPrice(result.new_balance);

    showToast(`Vendido por ${formatPrice(result.sell_price)}!`);

    // Reload inventory
    await loadInventory();
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Vender';
  }
}
