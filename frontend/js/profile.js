/**
 * tradex-GG
 * @author willSolareviczz
 * @section frontend
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (!isLoggedIn()) { window.location.href = '/login.html'; return; }

  const me        = getUser();
  const container = document.getElementById('profile-content');

  // Support viewing other users' profiles via ?id=
  const urlParams  = new URLSearchParams(window.location.search);
  const profileId  = urlParams.get('id') || me?.id;
  const isOwnProfile = String(profileId) === String(me?.id);

  try {
    const promises = [
      apiFetch(`/users/profile/${profileId}`),
      isOwnProfile ? apiFetch('/referral/code').catch(() => null) : Promise.resolve(null),
      isOwnProfile ? apiFetch('/users/me').catch(() => null) : Promise.resolve(null),
    ];
    const [data, refData, meData] = await Promise.all(promises);
    renderProfile(container, data, refData, meData, isOwnProfile);
  } catch {
    container.innerHTML = '<div class="empty-state"><p>Erro ao carregar perfil.</p></div>';
  }
});

function renderProfile(container, data, refData, meData, isOwnProfile = true) {
  const { user, xp_progress, stats, best_drop, achievements, showcase, roi_chart, recent_openings } = data;
  const joinDate = new Date(user.created_at).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
  const initial  = escapeHtml(user.username.charAt(0).toUpperCase());
  const uname    = escapeHtml(user.username);

  const roiPositive = parseFloat(stats.roi) >= 0;

  container.innerHTML = `
    <!-- Hero -->
    <div class="profile-hero">
      <div class="profile-avatar-wrap">
        <div class="profile-avatar-lg">${initial}</div>
        <div class="profile-level-badge">LV ${xp_progress.level}</div>
      </div>
      <div class="profile-hero-info">
        <div class="profile-hero-name">${uname}</div>
        <div class="profile-hero-meta">Membro desde ${escapeHtml(joinDate)}</div>
        <div class="profile-xp-bar-wrap">
          <div class="profile-xp-labels">
            <span>${xp_progress.xp_this_level} / ${xp_progress.xp_for_next} XP</span>
            <span>Nível ${xp_progress.level + 1}</span>
          </div>
          <div class="profile-xp-bar-track">
            <div class="profile-xp-bar-fill" id="xp-fill" style="width: 0%"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="profile-stats-row">
      <div class="profile-stat">
        <div class="profile-stat-value">${stats.total_openings}</div>
        <div class="profile-stat-label">Caixas Abertas</div>
      </div>
      <div class="profile-stat">
        <div class="profile-stat-value">${stats.total_sold}</div>
        <div class="profile-stat-label">Skins Vendidas</div>
      </div>
      <div class="profile-stat">
        <div class="profile-stat-value">${formatPrice(stats.total_spent)}</div>
        <div class="profile-stat-label">Total Gasto</div>
      </div>
      <div class="profile-stat">
        <div class="profile-stat-value">${formatPrice(stats.total_earned)}</div>
        <div class="profile-stat-label">Total em Drops</div>
      </div>
      <div class="profile-stat">
        <div class="profile-stat-value ${roiPositive ? 'positive' : 'negative'}">
          ${roiPositive ? '+' : ''}${stats.roi}%
        </div>
        <div class="profile-stat-label">ROI</div>
      </div>
      ${best_drop ? `
      <div class="profile-stat">
        <div class="profile-stat-value" style="font-size:0.88rem; color: ${escapeHtml(best_drop.rarity_color)}">
          ${escapeHtml(best_drop.weapon)} | ${escapeHtml(best_drop.skin_name)}
        </div>
        <div class="profile-stat-label">Melhor Drop — ${formatPrice(best_drop.site_price)}</div>
      </div>` : ''}
    </div>

    ${isOwnProfile && refData ? `
    <!-- Referral -->
    <div class="profile-section-title">Programa de Indicação</div>
    <div class="referral-panel">
      <div class="referral-info">
        <div class="referral-info-row">
          <span class="referral-info-label">Seu link de convite</span>
          <span class="referral-info-sub">Amigos que se cadastrarem ganham R$5. Você ganha R$10 no primeiro depósito deles.</span>
        </div>
        <div class="referral-link-row">
          <input class="referral-link-input" id="ref-link-input" readonly value="${escapeHtml(refData.url)}">
          <button class="btn btn-primary btn-sm" id="btn-copy-ref">Copiar</button>
        </div>
      </div>
      <div class="referral-stats" id="ref-stats">
        <div class="referral-stat"><span class="referral-stat-val" id="ref-count">—</span><span class="referral-stat-label">Indicados</span></div>
        <div class="referral-stat"><span class="referral-stat-val" id="ref-paid">—</span><span class="referral-stat-label">Bônus Pagos</span></div>
      </div>
    </div>` : ''}

    <!-- ROI Chart -->
    <div class="profile-section-title">Histórico de 14 Dias</div>
    <div class="profile-chart-wrap">
      <div class="profile-chart-legend">
        <span class="chart-legend-item">
          <span class="chart-legend-dot" style="background:#22c55e"></span> Drops Recebidos
        </span>
        <span class="chart-legend-item">
          <span class="chart-legend-dot" style="background:#c0503e"></span> Gasto em Caixas
        </span>
      </div>
      <canvas class="chart-canvas" id="roi-chart" height="180"></canvas>
    </div>

    <!-- Achievements -->
    <div class="profile-section-title">Conquistas</div>
    <div class="achievements-grid">
      ${achievements.map(a => `
        <div class="achievement-card ${a.unlocked ? 'unlocked' : 'locked'}">
          <div class="achievement-icon">${a.icon}</div>
          <div class="achievement-info">
            <div class="achievement-name">${escapeHtml(a.name)}</div>
            <div class="achievement-desc">${escapeHtml(a.desc)}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Showcase -->
    ${showcase.length > 0 ? `
    <div class="profile-section-title">Vitrine de Skins</div>
    <div class="showcase-grid">
      ${showcase.map((s, i) => `
        <div class="showcase-card" style="--item-rarity: ${escapeHtml(s.rarity_color)}">
          <div class="showcase-rank">#${i + 1}</div>
          <img class="showcase-img"
               src="/api/image/weapon-crop?url=${encodeURIComponent(s.image_url)}"
               alt="${escapeHtml(s.name)}"
               onerror="this.style.opacity='0.2'">
          <div class="showcase-name">${escapeHtml(s.weapon)} | ${escapeHtml(s.skin_name)}</div>
          <div class="showcase-wear">${escapeHtml(s.wear)}</div>
          <div class="showcase-value">${formatPrice(s.value)}</div>
        </div>
      `).join('')}
    </div>` : ''}

    <!-- Recent Openings -->
    <div class="profile-section-title">Aberturas Recentes</div>
    ${recent_openings.length === 0
      ? `<div class="empty-state"><p>Nenhuma abertura ainda.</p><a href="/cases.html" class="btn btn-primary">Abrir Caixas</a></div>`
      : `<div class="recent-grid">
          ${recent_openings.map(o => `
            <div class="recent-card" style="--item-rarity: ${escapeHtml(o.rarity_color)}">
              <img class="recent-img"
                   src="/api/image/weapon-crop?url=${encodeURIComponent(o.image_url)}"
                   alt="${escapeHtml(o.name)}"
                   onerror="this.style.opacity='0.15'">
              <div class="recent-name">${escapeHtml(o.weapon)} | ${escapeHtml(o.skin_name)}</div>
              <div class="recent-rarity" style="color:${escapeHtml(o.rarity_color)}">${escapeHtml(o.rarity.replace('_',' '))}</div>
              ${o.case_name ? `<div class="recent-case">${escapeHtml(o.case_name)}</div>` : ''}
            </div>
          `).join('')}
        </div>`
    }

    ${isOwnProfile ? `
    <!-- Wallet Card -->
    <div class="profile-section-title">Carteira</div>
    <div class="profile-wallet-card">
      <div class="profile-wallet-balance">
        <div class="profile-wallet-label">Saldo disponível</div>
        <div class="profile-wallet-value" id="profile-balance-val">${meData ? formatPrice(meData.balance) : formatPrice((getUser() || {}).balance || 0)}</div>
      </div>
      <div class="profile-wallet-actions">
        <a href="/deposit.html" class="btn btn-primary btn-sm">Depositar</a>
        <a href="/deposit.html#withdraw" class="btn btn-ghost btn-sm">Sacar</a>
        <a href="/history.html" class="btn btn-secondary btn-sm">Histórico</a>
      </div>
    </div>

    <!-- Provably Fair -->
    <div class="profile-section-title">Provably Fair — Seu Seed</div>
    <div class="profile-fair-card">
      <div class="profile-fair-desc">
        Seu seed cliente é combinado com um seed aleatório do servidor via HMAC-SHA256 para gerar cada resultado.
        Você pode alterar o seed a qualquer momento — aberturas anteriores permanecem verificáveis no histórico.
      </div>
      <div class="profile-fair-seed-row">
        <div class="profile-fair-field">
          <label>Seed ativo</label>
          <code class="profile-fair-seed" id="profile-client-seed">${escapeHtml(meData?.client_seed || 'tradexGG')}</code>
        </div>
        <button class="btn btn-ghost btn-sm" id="btn-change-seed">Alterar Seed</button>
      </div>
      <div id="change-seed-form" style="display:none; margin-top:0.75rem;">
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <input type="text" class="form-input" id="new-seed-input" placeholder="Novo seed (8-64 chars, a-z 0-9 _ -)"
                 maxlength="64" style="flex:1; font-family:var(--font-mono); font-size:0.82rem;">
          <button class="btn btn-primary btn-sm" id="btn-seed-submit">Salvar</button>
          <button class="btn btn-secondary btn-sm" id="btn-seed-cancel">Cancelar</button>
        </div>
        <div id="seed-feedback" style="font-size:0.78rem; margin-top:0.4rem;"></div>
      </div>
      <a href="/history.html" class="profile-fair-link">Ver e verificar aberturas →</a>
    </div>
    ` : ''}
  `;

  // Animate XP bar after render
  requestAnimationFrame(() => {
    const fill = document.getElementById('xp-fill');
    if (fill) fill.style.width = `${xp_progress.percent}%`;
  });

  // Draw ROI chart
  requestAnimationFrame(() => drawRoiChart(roi_chart));

  // Seed change UI (own profile only)
  if (!isOwnProfile) return;
  const btnChangeSeed = document.getElementById('btn-change-seed');
  const seedForm      = document.getElementById('change-seed-form');
  const btnSeedSubmit = document.getElementById('btn-seed-submit');
  const btnSeedCancel = document.getElementById('btn-seed-cancel');
  const seedInput     = document.getElementById('new-seed-input');
  const seedFeedback  = document.getElementById('seed-feedback');
  const seedDisplay   = document.getElementById('profile-client-seed');

  if (btnChangeSeed) {
    btnChangeSeed.addEventListener('click', () => {
      seedForm.style.display = 'block';
      btnChangeSeed.style.display = 'none';
      seedInput.focus();
    });
  }
  if (btnSeedCancel) {
    btnSeedCancel.addEventListener('click', () => {
      seedForm.style.display = 'none';
      btnChangeSeed.style.display = '';
      seedFeedback.textContent = '';
      seedInput.value = '';
    });
  }
  if (btnSeedSubmit) {
    btnSeedSubmit.addEventListener('click', async () => {
      const val = seedInput.value.trim();
      seedFeedback.textContent = '';
      if (!val) { seedFeedback.style.color = 'var(--danger)'; seedFeedback.textContent = 'Informe o novo seed.'; return; }
      btnSeedSubmit.disabled = true;
      try {
        const res = await apiFetch('/users/me/seed', { method: 'PUT', body: JSON.stringify({ seed: val }) });
        seedDisplay.textContent = res.client_seed;
        seedFeedback.style.color = 'var(--accent)';
        seedFeedback.textContent = '✓ Seed atualizado! Próximas aberturas usarão o novo seed.';
        seedInput.value = '';
        setTimeout(() => {
          seedForm.style.display = 'none';
          btnChangeSeed.style.display = '';
          seedFeedback.textContent = '';
        }, 2500);
      } catch (err) {
        seedFeedback.style.color = 'var(--danger)';
        seedFeedback.textContent = err.message || 'Erro ao atualizar seed.';
      } finally {
        btnSeedSubmit.disabled = false;
      }
    });
  }

  // Referral copy button + stats
  const copyBtn = document.getElementById('btn-copy-ref');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const input = document.getElementById('ref-link-input');
      navigator.clipboard.writeText(input.value).then(() => {
        copyBtn.textContent = 'Copiado!';
        setTimeout(() => { copyBtn.textContent = 'Copiar'; }, 2000);
      });
    });
    apiFetch('/referral/stats').then(s => {
      const countEl = document.getElementById('ref-count');
      const paidEl  = document.getElementById('ref-paid');
      if (countEl) countEl.textContent = s.total_referred;
      if (paidEl)  paidEl.textContent  = s.bonuses_paid;
    }).catch(() => {});
  }
}

// ===== Canvas ROI Chart =====
function drawRoiChart(rows) {
  const canvas = document.getElementById('roi-chart');
  if (!canvas) return;

  const dpr  = window.devicePixelRatio || 1;
  const w    = canvas.offsetWidth;
  const h    = 180;
  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  canvas.style.height = h + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const PAD_L = 52, PAD_R = 16, PAD_T = 12, PAD_B = 28;
  const chartW = w - PAD_L - PAD_R;
  const chartH = h - PAD_T - PAD_B;

  const spents  = rows.map(r => parseInt(r.spent));
  const earneds = rows.map(r => parseInt(r.earned));
  const maxVal  = Math.max(...spents, ...earneds, 100);
  const n       = rows.length;

  // Grid
  ctx.strokeStyle = 'rgba(120,160,230,0.07)';
  ctx.lineWidth   = 1;
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const y = PAD_T + (chartH / steps) * i;
    ctx.beginPath();
    ctx.moveTo(PAD_L, y);
    ctx.lineTo(PAD_L + chartW, y);
    ctx.stroke();

    const val = Math.round(maxVal * (1 - i / steps));
    ctx.fillStyle = 'rgba(150,148,136,0.55)';
    ctx.font = `${9 * dpr / dpr}px JetBrains Mono, monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(chartPrice(val), PAD_L - 6, y + 3.5);
  }

  // Helper: x/y for a data index
  const xOf = (i) => PAD_L + (i / (n - 1)) * chartW;
  const yOf = (v) => PAD_T + chartH - (v / maxVal) * chartH;

  // Draw a dataset
  function drawDataset(values, color, alpha) {
    if (n < 2) return;

    // Area fill
    ctx.beginPath();
    ctx.moveTo(xOf(0), PAD_T + chartH);
    ctx.lineTo(xOf(0), yOf(values[0]));
    for (let i = 1; i < n; i++) ctx.lineTo(xOf(i), yOf(values[i]));
    ctx.lineTo(xOf(n - 1), PAD_T + chartH);
    ctx.closePath();
    ctx.fillStyle = color.replace(')', `, ${alpha})`).replace('rgb(', 'rgba(');
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(values[0]));
    for (let i = 1; i < n; i++) ctx.lineTo(xOf(i), yOf(values[i]));
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.stroke();

    // Dots on non-zero values
    for (let i = 0; i < n; i++) {
      if (values[i] === 0) continue;
      ctx.beginPath();
      ctx.arc(xOf(i), yOf(values[i]), 2.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  drawDataset(spents,  'rgb(192,80,62)',  0.15);
  drawDataset(earneds, 'rgb(34,197,94)',  0.15);

  // X axis labels (every other day to avoid crowding)
  ctx.fillStyle = 'rgba(150,148,136,0.55)';
  ctx.font = `${9 * dpr / dpr}px JetBrains Mono, monospace`;
  ctx.textAlign = 'center';
  rows.forEach((r, i) => {
    if (i % 2 !== 0 && i !== n - 1) return;
    ctx.fillText(r.date, xOf(i), PAD_T + chartH + 16);
  });
}

// Short price formatter for chart axis (no decimal)
function chartPrice(centavos) {
  return 'R$' + Math.round(centavos / 100);
}
