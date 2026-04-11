document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('cases-grid');

  try {
    const cases = await apiFetch('/cases');

    if (cases.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p>Nenhuma caixa disponível no momento.</p></div>';
      return;
    }

    grid.innerHTML = cases.map(c => {
      const rarityColor = c.best_skin_rarity_color || '#4b69ff';
      const skinImg = c.best_skin_image || c.image_url;
      const skinName = c.best_skin_name || '';
      const rarityLabel = formatRarity(c.best_skin_rarity);

      return `
      <a href="/open.html?id=${c.id}" class="case-card" style="--rarity-glow: ${rarityColor}">
        <div class="case-card-visual">
          <div class="case-card-bg-glow" style="background: radial-gradient(ellipse at center, ${rarityColor}22 0%, transparent 70%)"></div>
          <img src="${skinImg}" alt="${c.name}" class="case-card-img">
          ${c.best_skin_rarity ? `<span class="case-card-rarity-badge" style="background: ${rarityColor}">${rarityLabel}</span>` : ''}
        </div>
        <div class="case-card-info">
          <div class="case-card-name">${c.name}</div>
          ${skinName ? `<div class="case-card-best-skin">${skinName}</div>` : ''}
          <div class="case-card-price">${formatPrice(c.price)}</div>
        </div>
      </a>
    `;
    }).join('');
  } catch {
    grid.innerHTML = '<div class="empty-state"><p>Erro ao carregar caixas.</p></div>';
  }
});

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
