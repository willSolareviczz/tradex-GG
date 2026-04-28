/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section frontend
 */
// ===== Cases Page =====

let allCases = [];
let activeCategory = 'all';
let searchQuery = '';
let sortOrder = 'default';

// Paleta de cores temáticas por categoria (1 cor por case dentro da categoria)
const caseColors = {
  rifles:  ['#ff4500', '#cc2200', '#4b69ff', '#2266ff', '#ff8c00', '#e4ae39'],
  snipers: ['#00e676', '#8847ff', '#ff6a00'],
  smg:     ['#00d4ff', '#f5c518', '#00bcd4'],
  pistols: ['#f5c518', '#9c27b0', '#e0e0e0', '#ff2200'],
  knives:  ['#7b1fa2', '#e53935', '#e4ae39', '#c62828'],
  premium: ['#e4ae39', '#ff6b35', '#9c27b0'],
};

const categoryLabels = {
  rifles: 'Cases de Fuzil',
  pistols: 'Cases de Pistola',
  snipers: 'Cases de Sniper',
  smg: 'Cases de SMG',
  knives: 'Cases de Faca',
  premium: 'Cases Premium',
};

const categoryIcons = {
  rifles: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 12h4l2-3h8l2 3h4M6 12v4h12v-4M10 9V6h4v3"/></svg>',
  pistols:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 11h10l2-2h6v4h-6l-1 1v4h-3v-4H3z"/></svg>',
  snipers:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>',
  smg:    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 11h14l2-2h4v4h-4l-1 1v3h-2v-3H2z"/><path d="M6 11V8h4v3"/></svg>',
  knives: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 19L19 5M19 5l-3 0M19 5l0 3M5 19l4-1l10-10"/></svg>',
  premium:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>',
};

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('cases-grid')) return;

  // Load cases
  try {
    allCases = await apiFetch('/cases');
    updateTotalBadge();
    renderCases();
  } catch {
    document.getElementById('cases-grid').innerHTML =
      '<div class="empty-state"><p>Erro ao carregar caixas.</p></div>';
  }

  // Load live drops
  loadLiveDrops();
  setInterval(loadLiveDrops, 20000);

  // Search input
  const searchInput = document.getElementById('cases-search');
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.toLowerCase().trim();
    renderCases();
  });

  // Sort select
  const sortSelect = document.getElementById('cases-sort');
  sortSelect.addEventListener('change', () => {
    sortOrder = sortSelect.value;
    renderCases();
  });

  // Category filter tabs
  document.getElementById('cases-filter-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeCategory = tab.dataset.cat;
    renderCases();
  });
});

function updateTotalBadge() {
  const badge = document.getElementById('cases-total-badge');
  if (badge) badge.textContent = `${allCases.length} caixas`;
}

function getFilteredCases() {
  let filtered = [...allCases];

  // Category filter
  if (activeCategory !== 'all') {
    filtered = filtered.filter(c => (c.category || 'rifles') === activeCategory);
  }

  // Search filter
  if (searchQuery) {
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(searchQuery) ||
      (c.best_skin_name || '').toLowerCase().includes(searchQuery)
    );
  }

  // Sort
  if (sortOrder === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortOrder === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  }

  return filtered;
}

function renderCases() {
  const grid = document.getElementById('cases-grid');
  const noResults = document.getElementById('no-results');
  const filtered = getFilteredCases();

  if (filtered.length === 0) {
    grid.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }

  noResults.style.display = 'none';

  // If filtering by specific category or searching — flat grid, no section headers
  if (activeCategory !== 'all' || searchQuery) {
    const colors = caseColors[activeCategory] || caseColors.rifles;
    let html = '<div class="card-grid">';
    filtered.forEach((c, i) => {
      html += buildCaseCard(c, colors[i % colors.length]);
    });
    html += '</div>';
    grid.innerHTML = html;
    return;
  }

  // Default: grouped by category
  const categories = {
    rifles:  [],
    pistols: [],
    snipers: [],
    smg:     [],
    knives:  [],
    premium: [],
  };

  filtered.forEach(c => {
    const cat = c.category || 'rifles';
    if (categories[cat]) categories[cat].push(c);
    else categories.rifles.push(c);
  });

  let html = '';

  Object.entries(categories).forEach(([catKey, cases]) => {
    if (cases.length === 0) return;
    const colors = caseColors[catKey] || caseColors.rifles;

    html += `
      <div class="category-section">
        <div class="category-header">
          <span class="category-title">${categoryLabels[catKey]}</span>
          <span class="category-count">${cases.length} ${cases.length === 1 ? 'caixa' : 'caixas'}</span>
        </div>
        <div class="card-grid">
    `;

    cases.forEach((c, i) => {
      html += buildCaseCard(c, colors[i % colors.length]);
    });

    html += '</div></div>';
  });

  grid.innerHTML = html;
}

function buildCaseCard(c, color) {
  const rawImg  = c.image_url || c.best_skin_image || '';
  const skinImg = rawImg && rawImg.startsWith('/') ? `${rawImg}?v=${Date.now()}` : rawImg;
  const price   = formatPrice(c.price);
  const serial  = `CASE-${String(c.id).padStart(3, '0')}`;
  const cat     = (c.category || 'rifles').toUpperCase().slice(0, 6);

  return `
    <a href="/open.html?id=${c.id}" class="case-card" style="--case-color: ${color}">
      <div class="case-card-stripe"></div>
      <div class="case-card-visual">
        <img src="${skinImg}" alt="${c.name}" class="case-card-img"
             onerror="this.style.opacity='0.15'">
      </div>
      <div class="case-card-info">
        <div class="case-card-name">${c.name}</div>
        <div class="case-card-price">${price}</div>
      </div>
    </a>
  `;
}

// ===== Live Drops Ticker =====
async function loadLiveDrops() {
  try {
    const drops = await apiFetch('/cases/recent-drops');
    if (!drops || drops.length === 0) {
      document.getElementById('live-drops-track').innerHTML =
        '<span class="live-drop-empty">Nenhum drop recente</span>';
      return;
    }
    renderLiveDrops(drops);
  } catch {
    // silently fail — drops feed is not critical
  }
}

function renderLiveDrops(drops) {
  const track = document.getElementById('live-drops-track');

  // Build items (duplicate for seamless loop)
  const buildItem = (d) => {
    const price = d.price ? formatPrice(d.price) : '';
    return `
      <div class="live-drop-item" style="--drop-color: ${d.rarity_color || '#4b69ff'}">
        <img src="${d.image_url}" alt="${d.skin_name}" onerror="this.style.display='none'">
        <div class="live-drop-info">
          <span class="live-drop-skin">${d.weapon} | ${d.skin_skin_name || d.skin_name}</span>
          <span class="live-drop-user">${d.username}</span>
        </div>
        ${price ? `<span class="live-drop-price">${price}</span>` : ''}
      </div>
    `;
  };

  const itemsHTML = drops.map(buildItem).join('');
  // Duplicate for seamless infinite scroll
  track.innerHTML = itemsHTML + itemsHTML;
}

function formatRarity(rarity) {
  const map = {
    'consumer': 'Consumer',
    'industrial': 'Industrial',
    'mil_spec': 'Mil-Spec',
    'restricted': 'Restricted',
    'classified': 'Classified',
    'covert': 'Covert',
    'extraordinary': 'Knife',
  };
  return map[rarity] || rarity || '';
}
