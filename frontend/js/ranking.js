/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section frontend
 */
let currentTab = 'drops';

document.addEventListener('DOMContentLoaded', () => {
  switchTab('drops');
});

async function switchTab(tab) {
  currentTab = tab;

  const dropsBtn = document.getElementById('tab-drops');
  const xpBtn    = document.getElementById('tab-xp');
  if (dropsBtn) dropsBtn.className = tab === 'drops' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm';
  if (xpBtn)    xpBtn.className    = tab === 'xp'    ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm';

  const container = document.getElementById('ranking-content');
  container.innerHTML = '<div class="loading">Carregando...</div>';

  if (tab === 'drops') {
    await loadDropsRanking(container);
  } else {
    await loadXpRanking(container);
  }
}

async function loadDropsRanking(container) {
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
              <td style="font-weight:700;color:${i < 3 ? 'var(--rarity-extraordinary)' : 'var(--text-secondary)'};">${i + 1}</td>
              <td>${escapeHtml(d.username)}</td>
              <td>
                <div class="ranking-skin-cell">
                  <img src="${escapeHtml(d.image_url)}" alt="${escapeHtml(d.skin_name)}">
                  <span style="color:${d.rarity_color};font-weight:600;">${escapeHtml(d.skin_name)}</span>
                </div>
              </td>
              <td style="color:var(--text-secondary);">${escapeHtml(d.case_name)}</td>
              <td style="color:var(--accent);font-weight:700;">${formatPrice(d.market_price)}</td>
              <td style="color:var(--text-secondary);">${new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  } catch {
    container.innerHTML = '<div class="empty-state"><p>Erro ao carregar ranking.</p></div>';
  }
}

async function loadXpRanking(container) {
  try {
    const data = await apiFetch('/ranking/xp');
    const users      = data.ranking || data; // suporte ao formato antigo
    const myPosition = data.my_position ?? null;
    const currentUser = typeof getUser === 'function' ? getUser() : null;

    if (!users.length) {
      container.innerHTML = '<div class="empty-state"><p>Nenhum jogador encontrado.</p></div>';
      return;
    }

    const myPosBanner = myPosition && myPosition > 50 ? `
      <div style="background:var(--bg-card);border:1px solid var(--border-strong);border-radius:var(--r-sm);
                  padding:0.75rem 1.25rem;margin-bottom:1rem;display:flex;align-items:center;gap:1rem;
                  font-size:0.88rem;color:var(--text-secondary);">
        <span style="font-family:var(--font-mono);font-weight:700;color:var(--brass);">#${myPosition}</span>
        <span>Sua posição no ranking global · Continue abrindo caixas para subir!</span>
      </div>` : '';

    container.innerHTML = myPosBanner + `
      <table class="ranking-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Jogador</th>
            <th>Nível</th>
            <th>XP Total</th>
            <th>Aberturas</th>
          </tr>
        </thead>
        <tbody>
          ${users.map((u, i) => {
            const isMe = currentUser && u.id === currentUser.id;
            const rowStyle = isMe ? 'background:rgba(201,168,106,0.06);' : '';
            const pos = i + 1;
            const posColor = pos === 1 ? '#e4ae39' : pos === 2 ? '#b0c3d9' : pos === 3 ? '#c87b4e' : 'var(--text-secondary)';
            return `
            <tr style="${rowStyle}">
              <td style="font-weight:700;color:${posColor};">${pos <= 3 ? ['🥇','🥈','🥉'][pos-1] : pos}</td>
              <td>
                <a href="/profile.html?id=${u.id}" style="color:${isMe ? 'var(--brass)' : 'var(--text-primary)'};text-decoration:none;font-weight:${isMe ? '700' : '400'};">
                  ${escapeHtml(u.username)}${isMe ? ' <span style="font-size:0.7rem;color:var(--text-muted);">(você)</span>' : ''}
                </a>
              </td>
              <td style="font-weight:700;color:var(--brass);">LV ${u.level}</td>
              <td style="color:var(--accent);font-weight:600;">${u.xp.toLocaleString('pt-BR')} XP</td>
              <td style="color:var(--text-secondary);">${u.total_openings}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      ${myPosition && myPosition <= 50 ? `
        <div style="text-align:center;padding:0.75rem;font-size:0.82rem;color:var(--text-secondary);">
          Você está em <span style="color:var(--brass);font-weight:700;">#${myPosition}</span> no ranking global.
        </div>` : ''}`;
  } catch {
    container.innerHTML = '<div class="empty-state"><p>Erro ao carregar ranking de XP.</p></div>';
  }
}
