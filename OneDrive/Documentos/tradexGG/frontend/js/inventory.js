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

    grid.innerHTML = items.map(item => `
      <div class="skin-card" style="border-color: ${item.rarity_color}">
        <img src="${item.image_url}" alt="${item.name}" class="skin-card-img">
        <div class="skin-card-info">
          <div class="skin-card-name">${item.name}</div>
          <div class="skin-card-rarity" style="color: ${item.rarity_color}">${item.rarity.replace('_', ' ')}</div>
          <div class="skin-card-price">${formatPrice(item.market_price)}</div>
        </div>
        <div class="skin-card-actions">
          <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="sellItem(${item.opening_id}, this)">
            Vender por ${formatPrice(item.market_price)}
          </button>
        </div>
      </div>
    `).join('');
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
