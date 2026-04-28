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

  await loadHistory();
});

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
          ${items.map(item => {
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
                  <div class="ranking-skin-cell">
                    <img src="${item.image_url}" alt="${item.skin_name}">
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
