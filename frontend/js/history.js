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

  createSkinModal();
  await loadHistory();
});

// ===== Skin Preview Modal =====
function createSkinModal() {
  const modal = document.createElement('div');
  modal.id = 'skin-preview-modal';
  modal.className = 'skin-preview-modal';
  modal.innerHTML = `
    <div class="skin-preview-backdrop"></div>
    <div class="skin-preview-card">
      <button class="skin-preview-close">✕</button>
      <div class="skin-preview-img-wrap">
        <img id="skin-preview-img" src="" alt="">
      </div>
      <div class="skin-preview-body">
        <div class="skin-preview-name" id="skin-preview-name"></div>
        <div class="skin-preview-meta">
          <span class="skin-preview-rarity" id="skin-preview-rarity"></span>
          <span class="skin-preview-price" id="skin-preview-price"></span>
        </div>
        <div class="skin-preview-case" id="skin-preview-case"></div>
        <div class="skin-preview-status" id="skin-preview-status"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('.skin-preview-backdrop').addEventListener('click', closeSkinModal);
  modal.querySelector('.skin-preview-close').addEventListener('click', closeSkinModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSkinModal(); });
}

function openSkinModal(item) {
  const modal = document.getElementById('skin-preview-modal');
  const imgUrl = `/api/image/weapon-crop?url=${encodeURIComponent(item.image_url)}`;

  document.getElementById('skin-preview-img').src = imgUrl;
  document.getElementById('skin-preview-name').textContent = item.skin_name;
  document.getElementById('skin-preview-rarity').textContent = formatRarity(item.rarity);
  document.getElementById('skin-preview-rarity').style.color = item.rarity_color;
  document.getElementById('skin-preview-price').textContent = formatPrice(item.market_price);
  document.getElementById('skin-preview-case').textContent = item.case_name;
  document.getElementById('skin-preview-status').innerHTML = item.sold
    ? `<span style="color:var(--brass)">Vendido por ${formatPrice(item.sell_price)}</span>`
    : `<span style="color:var(--text-secondary)">No inventário</span>`;

  // Rarity border color
  modal.querySelector('.skin-preview-card').style.borderColor = item.rarity_color;
  modal.querySelector('.skin-preview-img-wrap').style.boxShadow = `0 0 40px ${item.rarity_color}30`;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSkinModal() {
  const modal = document.getElementById('skin-preview-modal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

// ===== Load History =====
async function loadHistory() {
  const container = document.getElementById('history-content');

  try {
    const items = await apiFetch('/history');

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Você ainda não abriu nenhuma caixa.</p>
          <a href="/cases.html" class="btn btn-primary">Abrir Caixas</a>
        </div>`;
      return;
    }

    container.innerHTML = `
      <table class="ranking-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Caixa</th>
            <th>Item Ganho</th>
            <th>Raridade</th>
            <th>Valor</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, i) => {
            const date = new Date(item.created_at);
            const dateStr = date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const rarityLabel = formatRarity(item.rarity);
            const status = item.sold
              ? `<span style="color: var(--accent);">Vendido por ${formatPrice(item.sell_price)}</span>`
              : '<span style="color: var(--text-secondary);">No inventário</span>';

            return `
              <tr>
                <td>${dateStr}</td>
                <td>${item.case_name}</td>
                <td>
                  <div class="ranking-skin-cell history-skin-clickable" data-idx="${i}">
                    <img src="/api/image/weapon-crop?url=${encodeURIComponent(item.image_url)}" alt="${item.skin_name}">
                    <span>${item.skin_name}</span>
                  </div>
                </td>
                <td><span style="color: ${item.rarity_color}; font-weight: 600;">${rarityLabel}</span></td>
                <td style="font-weight: 600;">${formatPrice(item.market_price)}</td>
                <td>${status}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    // Attach click handlers
    container.querySelectorAll('.history-skin-clickable').forEach(el => {
      const item = items[parseInt(el.dataset.idx)];
      el.addEventListener('click', () => openSkinModal(item));
    });

  } catch {
    container.innerHTML = '<div class="empty-state"><p>Erro ao carregar histórico.</p></div>';
  }
}

function formatRarity(rarity) {
  const map = {
    'consumer': 'Consumer',
    'industrial': 'Industrial',
    'mil_spec': 'Mil-Spec',
    'restricted': 'Restricted',
    'classified': 'Classified',
    'covert': 'Covert',
    'extraordinary': 'Knife'
  };
  return map[rarity] || rarity || '';
}
