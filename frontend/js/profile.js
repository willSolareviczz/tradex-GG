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

  const user = getUser();
  const container = document.getElementById('profile-content');

  try {
    const data = await apiFetch(`/users/profile/${user.id}`);

    const joinDate = new Date(data.user.created_at).toLocaleDateString('pt-BR');
    const initial = data.user.username.charAt(0).toUpperCase();

    let bestDropHtml = '';
    if (data.best_drop) {
      bestDropHtml = `
        <div class="stat-card">
          <div style="color: ${data.best_drop.rarity_color}; font-weight: 600;">${data.best_drop.name}</div>
          <div class="stat-value">${formatPrice(data.best_drop.market_price)}</div>
          <div class="stat-label">Melhor Drop</div>
        </div>`;
    }

    container.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">${initial}</div>
        <div>
          <h1 style="margin-bottom: 0.3rem;">${data.user.username}</h1>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Membro desde ${joinDate}</p>
        </div>
      </div>

      <div class="profile-stats">
        <div class="stat-card">
          <div class="stat-value">${data.stats.total_openings}</div>
          <div class="stat-label">Caixas Abertas</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.stats.total_sold}</div>
          <div class="stat-label">Skins Vendidas</div>
        </div>
        ${bestDropHtml}
      </div>

      <h2 class="page-title" style="font-size: 1.3rem;">Aberturas Recentes</h2>
      ${data.recent_openings.length === 0
        ? '<div class="empty-state"><p>Nenhuma abertura ainda.</p><a href="/cases.html" class="btn btn-primary">Abrir Caixas</a></div>'
        : `<div class="card-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
            ${data.recent_openings.map(o => `
              <div class="skin-card" style="border-color: ${o.rarity_color}">
                <div class="skin-card-visual">
                  <img src="/api/image/weapon-crop?url=${encodeURIComponent(o.image_url)}" alt="${o.name}" class="skin-card-img">
                </div>
                <div class="skin-card-info">
                  <div class="skin-card-name">${o.name}</div>
                  <div class="skin-card-rarity" style="color: ${o.rarity_color}">${o.rarity.replace('_', ' ')}</div>
                  <div style="font-size: 0.75rem; color: var(--text-secondary);">${o.case_name}</div>
                </div>
              </div>
            `).join('')}
          </div>`
      }
    `;
  } catch {
    container.innerHTML = '<div class="empty-state"><p>Erro ao carregar perfil.</p></div>';
  }
});
