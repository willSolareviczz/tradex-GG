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

  await loadInventory(1);

  const btnSellAll = document.getElementById('btn-sell-all');
  if (btnSellAll) btnSellAll.addEventListener('click', sellAll);
});

async function loadInventory(page) {
  const grid = document.getElementById('inventory-grid');

  try {
    const data = await apiFetch(`/inventory?page=${page}&limit=24`);
    const { items, total, pages } = data;

    if (total === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <p>Seu inventário está vazio.</p>
          <a href="/cases.html" class="btn btn-primary">Abrir Caixas</a>
        </div>`;
      document.getElementById('inventory-summary').style.display = 'none';
      return;
    }

    if (data.summary) {
      const { total_count, total_value } = data.summary;
      const summary      = document.getElementById('inventory-summary');
      const totalItemsEl = document.getElementById('inv-total-items');
      const totalValEl   = document.getElementById('inv-total-value');
      if (summary)      summary.style.display = total_count > 0 ? 'flex' : 'none';
      if (totalItemsEl) totalItemsEl.textContent = `${total_count} ${total_count === 1 ? 'item' : 'itens'}`;
      if (totalValEl)   totalValEl.textContent = formatPrice(total_value);
    }

    const wearLabels = { FN: 'Factory New', MW: 'Minimal Wear', FT: 'Field-Tested', WW: 'Well-Worn', BS: 'Battle-Scarred' };
    const cards = items.map(item => {
      const price = item.site_price || item.market_price;
      const wearText = wearLabels[item.wear] || item.wear || '';
      return `
      <div class="skin-card" style="border-color: ${item.rarity_color}">
        <div class="skin-card-visual">
          <img src="/api/image/weapon-crop?url=${encodeURIComponent(item.image_url)}" alt="${escapeHtml(item.name)}" class="skin-card-img">
        </div>
        <div class="skin-card-info">
          <div class="skin-card-name">${escapeHtml(item.weapon)} | ${escapeHtml(item.skin_name)}</div>
          <div class="skin-card-rarity-row">
            <span class="skin-card-rarity" style="color: ${item.rarity_color}">${item.rarity.replace('_', ' ')}</span>
            ${item.wear ? `<span class="wear-badge wear-${item.wear}">${wearText}</span>` : ''}
          </div>
          <div class="skin-card-price">${formatPrice(price)}</div>
          <div class="skin-card-case">de: ${escapeHtml(item.case_name)}</div>
        </div>
        <div class="skin-card-actions">
          <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="sellItem(${item.opening_id}, this)">
            Vender por ${formatPrice(price)}
          </button>
        </div>
      </div>`;
    }).join('');

    const paginationHtml = pages > 1 ? `
      <div class="pagination" style="grid-column: 1 / -1;">
        ${page > 1
          ? `<button class="btn btn-secondary btn-sm" onclick="loadInventory(${page - 1})">← Anterior</button>`
          : `<button class="btn btn-secondary btn-sm" disabled>← Anterior</button>`}
        <span class="pagination-info">Página ${page} de ${pages} · ${total} itens</span>
        ${page < pages
          ? `<button class="btn btn-secondary btn-sm" onclick="loadInventory(${page + 1})">Próxima →</button>`
          : `<button class="btn btn-secondary btn-sm" disabled>Próxima →</button>`}
      </div>` : '';

    grid.innerHTML = cards + paginationHtml;
  } catch {
    grid.innerHTML = '<div class="empty-state"><p>Erro ao carregar inventário.</p></div>';
  }
}

const _sellingIds = new Set();

async function sellAll() {
  if (!confirm('Vender todos os itens do inventário?')) return;

  const btn = document.getElementById('btn-sell-all');
  if (btn) { btn.disabled = true; btn.textContent = 'Vendendo...'; }

  try {
    const res = await apiFetch('/inventory/sell-all', { method: 'POST' });
    if (res.sold === 0) { showToast('Nenhum item para vender.', 'error'); return; }
    showToast(`${res.sold} item(s) vendido(s) por ${formatPrice(res.total_amount)}!`);
    const balEl = document.getElementById('nav-balance');
    if (balEl) balEl.textContent = formatPrice(res.new_balance);
    updateStoredBalance(res.new_balance);
    await loadInventory(1);
  } catch (err) {
    showToast(err.message || 'Erro ao vender itens', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Vender Tudo'; }
  }
}

async function sellItem(openingId, btn) {
  const priceText = btn.textContent.trim();
  if (!confirm(`Confirma a venda do item por ${priceText}?`)) return;
  if (_sellingIds.has(openingId)) return;
  _sellingIds.add(openingId);
  btn.disabled = true;
  btn.textContent = 'Vendendo...';

  try {
    const result = await apiFetch(`/inventory/${openingId}/sell`, { method: 'POST' });

    const balEl = document.getElementById('nav-balance');
    if (balEl) balEl.textContent = formatPrice(result.new_balance);

    showToast(`Vendido por ${formatPrice(result.sell_price)}!`);

    // Recarrega a mesma página
    const currentPage = parseInt(document.querySelector('.pagination-info')?.textContent?.match(/\d+/)?.[0]) || 1;
    await loadInventory(currentPage);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Vender';
  } finally {
    _sellingIds.delete(openingId);
  }
}
