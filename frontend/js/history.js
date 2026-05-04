/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section frontend
 */
let _historyPage = 1;
let _historyMeta = { total: 0, pages: 1 };

document.addEventListener('DOMContentLoaded', async () => {
  if (!isLoggedIn()) {
    window.location.href = '/login.html';
    return;
  }

  createSkinModal();
  createFairModal();
  await loadHistory(1);
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
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeSkinModal(); closeFairModal(); } });
}

const WEAR_LABELS = { FN: 'Factory New', MW: 'Minimal Wear', FT: 'Field-Tested', WW: 'Well-Worn', BS: 'Battle-Scarred' };

function openSkinModal(item) {
  const modal = document.getElementById('skin-preview-modal');
  const imgUrl = `/api/image/weapon-crop?url=${encodeURIComponent(item.image_url)}`;
  const price = item.site_price || item.market_price;

  document.getElementById('skin-preview-img').src = imgUrl;
  document.getElementById('skin-preview-name').textContent = item.skin_name;
  document.getElementById('skin-preview-rarity').textContent = formatRarity(item.rarity) + (item.wear ? ` · ${WEAR_LABELS[item.wear] || item.wear}` : '');
  document.getElementById('skin-preview-rarity').style.color = item.rarity_color;
  document.getElementById('skin-preview-price').textContent = formatPrice(price);
  document.getElementById('skin-preview-case').textContent = item.case_name;
  document.getElementById('skin-preview-status').innerHTML = item.sold
    ? `<span style="color:var(--brass)">Vendido por ${formatPrice(item.sell_price)}</span>`
    : `<span style="color:var(--text-secondary)">No inventário</span>`;

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

// ===== Provably Fair Verification Modal =====
function createFairModal() {
  const modal = document.createElement('div');
  modal.id = 'fair-modal';
  modal.className = 'fair-modal';
  modal.innerHTML = `
    <div class="fair-modal-backdrop"></div>
    <div class="fair-modal-box">
      <div class="fair-modal-header">
        <span class="fair-modal-icon">🔒</span>
        <div>
          <div class="fair-modal-title">Verificação Provably Fair</div>
          <div class="fair-modal-subtitle" id="fair-opening-id">Abertura #—</div>
        </div>
        <button class="fair-modal-close" onclick="closeFairModal()">✕</button>
      </div>

      <div class="fair-modal-body">
        <!-- Hash commitment section -->
        <div class="fair-section">
          <div class="fair-section-label">
            <span class="fair-lock locked">🔒</span>
            Comprometido <em>antes</em> da abertura
          </div>
          <div class="fair-field">
            <label>Hash do Seed do Servidor (SHA-256)</label>
            <div class="fair-seed-row">
              <code id="fair-server-seed-hash" class="fair-seed">—</code>
              <button class="fair-copy-btn" onclick="copyFairField('fair-server-seed-hash')">Copiar</button>
            </div>
          </div>
        </div>

        <!-- Revealed seeds section -->
        <div class="fair-section">
          <div class="fair-section-label">
            <span class="fair-lock unlocked">🔓</span>
            Revelado <em>após</em> a abertura
          </div>
          <div class="fair-field">
            <label>Seed do Servidor</label>
            <div class="fair-seed-row">
              <code id="fair-server-seed" class="fair-seed">—</code>
              <button class="fair-copy-btn" onclick="copyFairField('fair-server-seed')">Copiar</button>
            </div>
          </div>
          <div class="fair-field">
            <label>Seed do Cliente</label>
            <div class="fair-seed-row">
              <code id="fair-client-seed" class="fair-seed">—</code>
              <button class="fair-copy-btn" onclick="copyFairField('fair-client-seed')">Copiar</button>
            </div>
          </div>
          <div class="fair-field">
            <label>Nonce</label>
            <div class="fair-seed-row">
              <code id="fair-nonce" class="fair-seed">—</code>
            </div>
          </div>
        </div>

        <!-- Hash verification -->
        <div class="fair-section fair-verify-section">
          <div class="fair-section-label">Verificar integridade</div>
          <p class="fair-info">Confirme que o hash SHA-256 do seed revelado corresponde ao hash comprometido antes da abertura:</p>
          <div id="fair-verify-result" class="fair-verify-result fair-verify-idle">
            <span>Clique em "Verificar" para validar</span>
          </div>
          <button class="btn btn-primary btn-sm" onclick="verifyFairHash()" id="fair-verify-btn">
            Verificar SHA-256
          </button>
        </div>

        <!-- Algorithm explanation -->
        <div class="fair-section fair-algo-section">
          <div class="fair-section-label">Algoritmo de seleção</div>
          <p class="fair-info">O resultado foi determinado por:</p>
          <pre class="fair-algo-code">hmac = HMAC-SHA256(server_seed, client_seed + ":" + nonce)
roll = parseInt(hmac[0..7], 16) % total_weight
// A skin cuja faixa de peso contém o roll é o resultado</pre>
          <p class="fair-info" style="margin-top: 0.75rem;">
            Você pode verificar independentemente com qualquer ferramenta HMAC-SHA256 (Python, OpenSSL, etc.).
          </p>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('.fair-modal-backdrop').addEventListener('click', closeFairModal);
}

function openFairModal(item) {
  const modal = document.getElementById('fair-modal');

  document.getElementById('fair-opening-id').textContent = `Abertura #${item.id}`;
  document.getElementById('fair-server-seed-hash').textContent = item.server_seed_hash || 'Não disponível';
  document.getElementById('fair-server-seed').textContent = item.server_seed || 'Não disponível';
  document.getElementById('fair-client-seed').textContent = item.client_seed || 'Não disponível';
  document.getElementById('fair-nonce').textContent = item.nonce != null ? item.nonce : '—';

  // Reset verify state
  const result = document.getElementById('fair-verify-result');
  result.className = 'fair-verify-result fair-verify-idle';
  result.innerHTML = '<span>Clique em "Verificar" para validar</span>';
  document.getElementById('fair-verify-btn').disabled = false;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeFairModal() {
  const modal = document.getElementById('fair-modal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

async function verifyFairHash() {
  const btn = document.getElementById('fair-verify-btn');
  const result = document.getElementById('fair-verify-result');
  const serverSeed = document.getElementById('fair-server-seed').textContent.trim();
  const expectedHash = document.getElementById('fair-server-seed-hash').textContent.trim();

  if (!serverSeed || serverSeed === 'Não disponível' || !expectedHash) {
    result.className = 'fair-verify-result fair-verify-fail';
    result.innerHTML = '<span>⚠ Dados insuficientes para verificação</span>';
    return;
  }

  btn.disabled = true;
  result.className = 'fair-verify-result fair-verify-idle';
  result.innerHTML = '<span>Calculando...</span>';

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(serverSeed);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (computedHash === expectedHash) {
      result.className = 'fair-verify-result fair-verify-ok';
      result.innerHTML = `<span>✅ Hash verificado! O servidor comprometeu o seed antes da abertura.</span>`;
    } else {
      result.className = 'fair-verify-result fair-verify-fail';
      result.innerHTML = `<span>❌ Hash não corresponde. Computed: <code>${computedHash.slice(0,16)}…</code></span>`;
    }
  } catch {
    result.className = 'fair-verify-result fair-verify-fail';
    result.innerHTML = '<span>⚠ Erro ao calcular hash</span>';
  }

  btn.disabled = false;
}

function copyFairField(id) {
  const text = document.getElementById(id).textContent.trim();
  if (!text || text === '—' || text === 'Não disponível') return;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById(id).parentElement.querySelector('.fair-copy-btn');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'Copiado!';
      setTimeout(() => { btn.textContent = orig; }, 1500);
    }
  }).catch(() => {});
}

// ===== Load History =====
async function loadHistory(page) {
  _historyPage = page;
  const container = document.getElementById('history-content');
  container.innerHTML = '<div class="loading">Carregando...</div>';

  try {
    const data = await apiFetch(`/history?page=${page}&limit=20`);
    const { items, total, pages } = data;
    _historyMeta = { total, pages };

    if (total === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Você ainda não abriu nenhuma caixa.</p>
          <a href="/cases.html" class="btn btn-primary">Abrir Caixas</a>
        </div>`;
      return;
    }

    let summaryHtml = '';
    if (page === 1 && data.stats) {
      const { total_value, total_sold, sold_count, inventory_value } = data.stats;
      summaryHtml = `
        <div class="history-summary">
          <div class="history-stat">
            <div class="history-stat-value">${total}</div>
            <div class="history-stat-label">Drops totais</div>
          </div>
          <div class="history-stat">
            <div class="history-stat-value" style="color:var(--brass);">${formatPrice(total_value)}</div>
            <div class="history-stat-label">Valor total recebido</div>
          </div>
          <div class="history-stat">
            <div class="history-stat-value" style="color:var(--accent);">${formatPrice(total_sold)}</div>
            <div class="history-stat-label">Total vendido (${sold_count} itens)</div>
          </div>
          <div class="history-stat">
            <div class="history-stat-value" style="color:var(--text-primary);">${formatPrice(inventory_value)}</div>
            <div class="history-stat-label">Em inventário (${total - sold_count} itens)</div>
          </div>
        </div>`;
    }

    const tableHtml = `
      <table class="ranking-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Caixa</th>
            <th>Item Ganho</th>
            <th>Raridade</th>
            <th>Valor</th>
            <th>Status</th>
            <th style="text-align:center;">Fair</th>
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
            const price = item.site_price || item.market_price;
            const wearLabel = WEAR_LABELS[item.wear] || item.wear || '';
            const hasFair = !!(item.server_seed_hash);
            return `
              <tr>
                <td>${dateStr}</td>
                <td>${escapeHtml(item.case_name)}</td>
                <td>
                  <div class="ranking-skin-cell history-skin-clickable" data-idx="${i}">
                    <img src="/api/image/weapon-crop?url=${encodeURIComponent(item.image_url)}" alt="${escapeHtml(item.skin_name)}">
                    <span>${escapeHtml(item.skin_name)}${wearLabel ? ` <small style="opacity:0.6">(${wearLabel})</small>` : ''}</span>
                  </div>
                </td>
                <td><span style="color: ${item.rarity_color}; font-weight: 600;">${rarityLabel}</span></td>
                <td style="font-weight: 600;">${formatPrice(price)}</td>
                <td>${status}</td>
                <td style="text-align:center;">
                  ${hasFair
                    ? `<button class="fair-verify-btn-row" data-idx="${i}" title="Verificar Provably Fair">🔒 Verificar</button>`
                    : `<span style="color:var(--text-muted); font-size:0.75rem;">—</span>`}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      ${renderPagination(page, pages, 'loadHistory')}`;

    container.innerHTML = summaryHtml + tableHtml;

    container.querySelectorAll('.history-skin-clickable').forEach(el => {
      const item = items[parseInt(el.dataset.idx)];
      el.addEventListener('click', () => openSkinModal(item));
    });

    container.querySelectorAll('.fair-verify-btn-row').forEach(el => {
      const item = items[parseInt(el.dataset.idx)];
      el.addEventListener('click', () => openFairModal(item));
    });

  } catch {
    container.innerHTML = '<div class="empty-state"><p>Erro ao carregar histórico.</p></div>';
  }
}

function renderPagination(currentPage, totalPages, callbackName) {
  if (totalPages <= 1) return '';

  const prev = currentPage > 1
    ? `<button class="btn btn-secondary btn-sm" onclick="${callbackName}(${currentPage - 1})">← Anterior</button>`
    : `<button class="btn btn-secondary btn-sm" disabled>← Anterior</button>`;

  const next = currentPage < totalPages
    ? `<button class="btn btn-secondary btn-sm" onclick="${callbackName}(${currentPage + 1})">Próxima →</button>`
    : `<button class="btn btn-secondary btn-sm" disabled>Próxima →</button>`;

  return `
    <div class="pagination">
      ${prev}
      <span class="pagination-info">Página ${currentPage} de ${totalPages}</span>
      ${next}
    </div>`;
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
