/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section frontend
 */
// ===== Loading Screen =====
const LOADER_DURATION = 3000;

const LOADER_MSGS = [
  'INICIALIZANDO SERVIDOR',
  'CONECTANDO AO BR-01',
  'VERIFICANDO INVENTÁRIO',
  'CARREGANDO SKINS',
  'PRONTO',
];

function createLoader() {
  const path = window.location.pathname;
  const loaderPages = ['/', '/index.html', '/deposit.html'];
  const isLoaderPage = loaderPages.some(p => path === p || path.endsWith(p));
  if (!isLoaderPage) return;

  const loader = document.createElement('div');
  loader.className = 'loader-screen';
  loader.id = 'loader-screen';

  loader.innerHTML = `
    <div class="loader-blobs" id="loader-blobs"></div>
    <div class="loader-grid"></div>
    <div class="loader-particle-field" id="loader-particles"></div>

    <div class="loader-hud-br" id="loader-hud-br">00:00:00</div>

    <div class="loader-center">
      <div class="loader-logo-wrap">
        <div class="loader-ring"></div>
        <div class="loader-ring-inner"></div>
        <div class="loader-logo">
          <div class="loader-logo-text">tradex<span>GG</span></div>
        </div>
      </div>
      <div class="loader-tagline">ARMARIA DE SKINS CS2</div>
      <div class="loader-progress-wrap">
        <div class="loader-progress-bar" id="loader-progress-bar">
          <span class="loader-percent" id="loader-percent">0%</span>
        </div>
      </div>
      <div class="loader-status" id="loader-status-text">INICIALIZANDO<span class="loader-dots"></span></div>
    </div>
  `;

  // Blobs neon aleatórios
  const blobField = document.getElementById('loader-blobs');
  const blobColors = [
    [136, 71,  255],  // purple
    [75,  105, 255],  // blue
    [211, 44,  230],  // pink
    [235, 75,  75 ],  // red
    [56,  189, 248],  // cyan
    [201, 168, 106],  // gold
    [34,  197, 94 ],  // green
    [251, 120, 30 ],  // orange
    [0,   210, 180],  // teal
    [255, 60,  130],  // hot-pink
  ];
  if (blobField) {
    for (let i = 0; i < 12; i++) {
      const b = document.createElement('div');
      b.className = 'loader-blob';
      const [r, g, c] = blobColors[Math.floor(Math.random() * blobColors.length)];
      const size    = 220 + Math.random() * 320;
      const blur    = 45  + Math.random() * 40;
      const x       = 5   + Math.random() * 90;
      const y       = 5   + Math.random() * 90;
      const maxOp   = (0.55 + Math.random() * 0.40).toFixed(2);
      const dur     = (2.5 + Math.random() * 3.5).toFixed(1);
      const delay   = (-(Math.random() * 5)).toFixed(1);
      b.style.cssText = `
        width:${size}px; height:${size}px;
        background: radial-gradient(circle, rgba(${r},${g},${c},${maxOp}) 0%, rgba(${r},${g},${c},0.12) 45%, transparent 70%);
        filter: blur(${blur}px);
        left:${x}%; top:${y}%;
        transform: translate(-50%,-50%);
        --pulse-max: ${maxOp};
        animation-duration: ${dur}s;
        animation-delay: ${delay}s;
      `;
      blobField.appendChild(b);
    }
  }

  // Partículas flutuantes coloridas
  const particleColors = [
    ['rgba(75,105,255,VAL)',  0.35],
    ['rgba(136,71,255,VAL)', 0.40],
    ['rgba(211,44,230,VAL)', 0.35],
    ['rgba(201,168,106,VAL)',0.38],
    ['rgba(235,75,75,VAL)',  0.28],
    ['rgba(93,173,255,VAL)', 0.32],
  ];
  const pField = document.getElementById('loader-particles');
  if (pField) {
    for (let i = 0; i < 22; i++) {
      const p = document.createElement('div');
      p.className = 'loader-particle';
      const size   = 1.5 + Math.random() * 3.5;
      const [colorTpl, maxOp] = particleColors[Math.floor(Math.random() * particleColors.length)];
      const op     = (0.15 + Math.random() * maxOp).toFixed(2);
      const color  = colorTpl.replace('VAL', op);
      const x      = 2 + Math.random() * 96;
      const y      = 5 + Math.random() * 90;
      const dur    = 7 + Math.random() * 10;
      const delay  = -(Math.random() * dur);
      p.style.cssText = `
        width:${size}px; height:${size}px;
        background:${color};
        left:${x}%; top:${y}%;
        box-shadow:0 0 ${size*2.5}px ${size}px ${color};
        --p-op:${op};
        animation-duration:${dur}s;
        animation-delay:${delay}s;
      `;
      pField.appendChild(p);
    }
  }

  document.body.prepend(loader);

  // Ciclar mensagens de status
  let msgIdx = 0;
  const statusEl = document.getElementById('loader-status-text');
  const msgInterval = setInterval(() => {
    msgIdx = Math.min(msgIdx + 1, LOADER_MSGS.length - 1);
    if (statusEl) statusEl.innerHTML = LOADER_MSGS[msgIdx] + (msgIdx < LOADER_MSGS.length - 1 ? '<span class="loader-dots"></span>' : '');
  }, LOADER_DURATION / LOADER_MSGS.length);

  // Contador de porcentagem — sincronizado com keyframes do CSS
  const percentEl = document.getElementById('loader-percent');
  const PROG_DURATION = 2600;
  const checkpoints = [[0,0],[390,12],[910,38],[1560,62],[2132,85],[2600,100]];
  const startTime = Date.now();
  const percentInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    let pct = 100;
    for (let i = 0; i < checkpoints.length - 1; i++) {
      const [t0, v0] = checkpoints[i];
      const [t1, v1] = checkpoints[i + 1];
      if (elapsed >= t0 && elapsed < t1) {
        pct = Math.round(v0 + (v1 - v0) * ((elapsed - t0) / (t1 - t0)));
        break;
      }
    }
    if (percentEl) percentEl.textContent = pct + '%';
    if (elapsed >= PROG_DURATION) clearInterval(percentInterval);
  }, 40);

  // Relógio no HUD
  const hudBr = document.getElementById('loader-hud-br');
  const clockInterval = setInterval(() => {
    if (hudBr) hudBr.textContent = new Date().toLocaleTimeString('pt-BR');
  }, 1000);
  if (hudBr) hudBr.textContent = new Date().toLocaleTimeString('pt-BR');

  // Fade out
  setTimeout(() => {
    clearInterval(msgInterval);
    clearInterval(clockInterval);
    clearInterval(percentInterval);
    loader.classList.add('fade-out');
    setTimeout(() => loader.remove(), 700);
  }, LOADER_DURATION);
}

// Injetar loader imediatamente
createLoader();

// ===== Image Fallback =====
// SVG placeholder para quando imagem falha
const SKIN_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256'%3E%3Crect fill='%23161b22' width='256' height='256'/%3E%3Ctext x='128' y='118' text-anchor='middle' font-family='sans-serif' font-size='40' fill='%2330363d'%3E%3F%3C/text%3E%3Ctext x='128' y='155' text-anchor='middle' font-family='sans-serif' font-size='12' fill='%238b949e'%3ESem imagem%3C/text%3E%3C/svg%3E";

function handleImgError(img) {
  img.onerror = null;
  img.src = SKIN_PLACEHOLDER;
  img.style.opacity = '0.5';
}

// Aplicar fallback global a todas as imagens que falham
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG' && !e.target.dataset.fallback) {
      e.target.dataset.fallback = '1';
      e.target.src = SKIN_PLACEHOLDER;
      e.target.style.opacity = '0.5';
    }
  }, true);
});

// ===== API Helper + Auth State =====

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('tradexgg_token');
}

function getUser() {
  const data = localStorage.getItem('tradexgg_user');
  return data ? JSON.parse(data) : null;
}

function saveAuth(user, token) {
  localStorage.setItem('tradexgg_token', token);
  localStorage.setItem('tradexgg_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('tradexgg_token');
  localStorage.removeItem('tradexgg_user');
}

function isLoggedIn() {
  return !!getToken();
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearAuth();
    window.location.href = '/login.html';
    return;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Erro desconhecido');
  }

  return data;
}

function formatPrice(centavos) {
  return `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`;
}

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== Navbar rendering =====
function renderNavbar() {
  if (document.querySelector('.navbar')) return;
  const user = getUser();
  const logged = isLoggedIn();

  const nav = document.createElement('nav');
  nav.className = 'navbar';
  nav.innerHTML = `
    <a href="/" class="navbar-logo">tradex<span>GG</span></a>
    <div class="navbar-links">
      <a href="/cases.html">Caixas</a>
      <a href="/ranking.html">Ranking</a>
      ${logged ? `
        <a href="/inventory.html">Inventário</a>
        <a href="/history.html">Histórico</a>
        ${user?.role === 'admin' ? `<a href="/admin.html" style="color:var(--rarity-extraordinary);">Admin</a>` : ''}
      ` : ''}
    </div>
    <div class="navbar-search" id="navbar-search">
      <div class="nsearch-wrap">
        <svg class="nsearch-icon" viewBox="0 0 20 20" fill="none">
          <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M13 13l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <input
          id="nsearch-input"
          class="nsearch-input"
          type="text"
          placeholder="Buscar skin..."
          autocomplete="off"
          spellcheck="false"
        />
        <button class="nsearch-clear" id="nsearch-clear" aria-label="Limpar">✕</button>
      </div>
      <div class="nsearch-dropdown" id="nsearch-dropdown"></div>
    </div>
    <div class="navbar-right">
      ${logged ? `
        <div class="balance-display" id="nav-balance">${formatPrice(user?.balance || 0)}</div>
        <a href="/deposit.html" class="btn btn-primary btn-sm">Depositar</a>
        <a href="/profile.html" class="btn btn-secondary btn-sm nav-profile-btn">
          <span class="nav-level-badge" id="nav-level-badge">${user?.level ? `LV ${user.level}` : ''}</span>
          ${user?.username || 'Perfil'}
        </a>
        <button class="btn btn-secondary btn-sm" onclick="logout()">Sair</button>
      ` : `
        <a href="/login.html" class="btn btn-secondary btn-sm">Entrar</a>
        <a href="/register.html" class="btn btn-primary btn-sm">Cadastrar</a>
      `}
    </div>
  `;

  document.body.prepend(nav);

  // Mark active link
  const currentPath = window.location.pathname;
  nav.querySelectorAll('.navbar-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (currentPath === href || currentPath.endsWith(href))) {
      link.classList.add('active');
    }
  });

  // Navbar search logic
  (function initNavSearch() {
    const input    = document.getElementById('nsearch-input');
    const dropdown = document.getElementById('nsearch-dropdown');
    const clearBtn = document.getElementById('nsearch-clear');
    const wrap     = document.getElementById('navbar-search');
    if (!input) return;

    let debounceTimer = null;
    let lastQuery = '';

    function closeDropdown() {
      dropdown.innerHTML = '';
      dropdown.classList.remove('open');
      wrap.classList.remove('active');
      clearBtn.style.display = 'none';
    }

    function openDropdown(html) {
      dropdown.innerHTML = html;
      dropdown.classList.add('open');
      wrap.classList.add('active');
    }

    function renderResults(items, q) {
      if (!items.length) {
        return openDropdown(`<div class="nsearch-empty">Nenhuma skin encontrada para "<strong>${q}</strong>"</div>`);
      }
      const rows = items.map(it => {
        const price = it.price ? formatPrice(it.price) : '';
        return `
          <a class="nsearch-result" href="/open.html?case=${it.case_id}">
            <img class="nsearch-skin-img" src="${it.skin_image}" onerror="this.src='${SKIN_PLACEHOLDER}'" alt="">
            <div class="nsearch-info">
              <span class="nsearch-skin-name">
                <span class="nsearch-rarity-dot" style="background:${it.rarity_color}"></span>
                ${it.skin_name}
              </span>
              <span class="nsearch-case-row">
                <img class="nsearch-case-img" src="${it.case_image}" onerror="this.style.display='none'" alt="">
                ${it.case_name}
              </span>
            </div>
            ${price ? `<span class="nsearch-price">${price}</span>` : ''}
          </a>`;
      }).join('');
      openDropdown(rows);
    }

    async function doSearch(q) {
      if (q.length < 2) return closeDropdown();
      if (q === lastQuery) return;
      lastQuery = q;

      openDropdown('<div class="nsearch-loading"><span class="nsearch-spinner"></span> Buscando...</div>');

      try {
        const res = await fetch(`/api/cases/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (q !== input.value.trim()) return;
        if (!res.ok) throw new Error(data.error || 'Erro');
        renderResults(Array.isArray(data) ? data : [], q);
      } catch (err) {
        console.error('[search]', err);
        openDropdown('<div class="nsearch-empty">Erro ao buscar. Tente novamente.</div>');
      }
    }

    input.addEventListener('input', () => {
      const q = input.value.trim();
      clearBtn.style.display = q ? 'flex' : 'none';
      clearTimeout(debounceTimer);
      if (!q) { lastQuery = ''; return closeDropdown(); }
      debounceTimer = setTimeout(() => doSearch(q), 220);
    });

    clearBtn.addEventListener('click', () => {
      input.value = '';
      lastQuery = '';
      clearBtn.style.display = 'none';
      closeDropdown();
      input.focus();
    });

    document.addEventListener('mousedown', e => {
      if (!wrap.contains(e.target)) closeDropdown();
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeDropdown(); input.blur(); }
      if (e.key === 'ArrowDown') {
        const first = dropdown.querySelector('.nsearch-result');
        if (first) first.focus();
        e.preventDefault();
      }
    });

    dropdown.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeDropdown(); input.focus(); }
      if (e.key === 'ArrowDown') {
        const next = document.activeElement?.nextElementSibling;
        if (next) next.focus();
        e.preventDefault();
      }
      if (e.key === 'ArrowUp') {
        const prev = document.activeElement?.previousElementSibling;
        if (prev) prev.focus(); else input.focus();
        e.preventDefault();
      }
    });
  })();

  // Update balance and level from server
  if (logged) {
    apiFetch('/users/me').then(data => {
      if (data) {
        const balEl = document.getElementById('nav-balance');
        if (balEl) balEl.textContent = formatPrice(data.balance);
        // Update level badge
        const levelBadge = document.getElementById('nav-level-badge');
        if (levelBadge && data.level) {
          levelBadge.textContent = `LV ${data.level}`;
          levelBadge.style.display = 'inline-block';
        }
        // Update stored user
        const user = getUser();
        if (user) {
          user.balance = data.balance;
          user.level = data.level;
          user.xp = data.xp;
          localStorage.setItem('tradexgg_user', JSON.stringify(user));
        }
      }
    }).catch(() => {});
  }
}

function logout() {
  clearAuth();
  window.location.href = '/';
}

// ===== Footer =====
function renderFooter() {
  if (document.querySelector('.site-footer')) return;

  // Não exibir footer nas telas de auth/onboarding
  const path = window.location.pathname;
  const noFooter = ['/login.html', '/register.html', '/forgot-password.html', '/reset-password.html'];
  if (noFooter.some(p => path === p || path.endsWith(p))) return;

  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-brand">
        <a href="/" class="footer-logo">tradex<span>GG</span></a>
        <p class="footer-tagline">Armaria de skins CS2. Inventário operado no Brasil, sem ruído.</p>
      </div>
      <div class="footer-col">
        <span class="footer-col-title">Plataforma</span>
        <a href="/cases.html">Caixas</a>
        <a href="/ranking.html">Ranking</a>
        <a href="/inventory.html">Inventário</a>
        <a href="/history.html">Histórico</a>
        <a href="/deposit.html">Depositar</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span class="footer-server-badge"><span class="live-dot"></span>BR-01 Online</span>
      <span class="footer-copy">© ${new Date().getFullYear()} tradexGG &middot; <a href="https://github.com/willSolareviczz/tradex-GG" style="color:inherit;text-decoration:none;">github.com/willSolareviczz</a></span>
    </div>
  `;

  document.body.appendChild(footer);
}

document.addEventListener('DOMContentLoaded', renderNavbar);
document.addEventListener('DOMContentLoaded', renderFooter);

// ===== Auto-scale weapon images based on actual pixel bounds =====
// Uses fetch() to bypass browser cache CORS taint issue
function autoScaleWeaponImages(imgEls) {
  Array.from(imgEls).forEach(img => {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:')) return;

    fetch(src, { mode: 'cors', cache: 'no-store' })
      .then(r => r.ok ? r.blob() : Promise.reject())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const probe = new Image();
        probe.onload = () => {
          const w = probe.naturalWidth, h = probe.naturalHeight;
          if (!w || !h) { URL.revokeObjectURL(blobUrl); return; }
          try {
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(probe, 0, 0);
            const data = ctx.getImageData(0, 0, w, h).data;

            let minY = h, maxY = 0, found = false;
            for (let i = 0; i < data.length; i += 4) {
              if (data[i + 3] > 15) {
                const y = ((i >> 2) / w) | 0;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                found = true;
              }
            }
            URL.revokeObjectURL(blobUrl);
            if (!found) return;

            const fracY = (maxY - minY) / h;
            // scale so weapon fills 85% of container height; cap 6× to avoid absurd zoom
            const scale = Math.max(Math.min(0.85 / fracY, 6.0), 1.0);
            const final = scale.toFixed(2);
            const hover = (scale * 1.06).toFixed(2);

            img.style.transform = `scale(${final})`;
            const card = img.closest('.skin-card, .possible-skin-item');
            if (card) {
              card.addEventListener('mouseenter', () => { img.style.transform = `scale(${hover})`; });
              card.addEventListener('mouseleave', () => { img.style.transform = `scale(${final})`; });
            }
          } catch (_) { URL.revokeObjectURL(blobUrl); }
        };
        probe.onerror = () => URL.revokeObjectURL(blobUrl);
        probe.src = blobUrl;
      })
      .catch(() => {});
  });
}
