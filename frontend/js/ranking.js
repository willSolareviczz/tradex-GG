/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section frontend
 */
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('ranking-content');

  try {
    const drops = await apiFetch('/ranking');

    if (drops.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Nenhum drop registrado ainda.</p></div>';
      return;
    }

    container.innerHTML = `
      <table class="ranking-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Jogador</th>
            <th>Skin</th>
            <th>Caixa</th>
            <th>Valor</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          ${drops.map((d, i) => `
            <tr>
              <td style="font-weight: 700; color: ${i < 3 ? 'var(--rarity-extraordinary)' : 'var(--text-secondary)'};">${i + 1}</td>
              <td>${d.username}</td>
              <td>
                <div class="ranking-skin-cell">
                  <img src="${d.image_url}" alt="${d.skin_name}">
                  <span style="color: ${d.rarity_color}; font-weight: 600;">${d.skin_name}</span>
                </div>
              </td>
              <td style="color: var(--text-secondary);">${d.case_name}</td>
              <td style="color: var(--accent); font-weight: 700;">${formatPrice(d.market_price)}</td>
              <td style="color: var(--text-secondary);">${new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch {
    container.innerHTML = '<div class="empty-state"><p>Erro ao carregar ranking.</p></div>';
  }
});
