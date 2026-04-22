/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section frontend
 */
// ===== Loading Screen =====
// Tempo de exibicao em ms (ajuste aqui)
const LOADER_DURATION = 2500;

function createLoader() {
  const path = window.location.pathname;

  // Apenas mostrar loader nestas paginas:
  // - index / home (primeira visita)
  // - deposit (tela de saldo)
  // - login/register (apos login, redirect mostra loader na home)
  const loaderPages = ['/', '/index.html', '/deposit.html'];
  const isLoaderPage = loaderPages.some(p => path === p || path.endsWith(p));
  if (!isLoaderPage) return;

  const loader = document.createElement('div');
  loader.className = 'loader-screen';
  loader.id = 'loader-screen';

  // Gerar particulas
  let particlesHTML = '';
  const colors = ['#00ff88', '#00d4ff', '#8b5cf6', '#00ff88', '#00d4ff'];
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * 100;
    const size = 2 + Math.random() * 3;
    const duration = 4 + Math.random() * 6;
    const delay = Math.random() * 5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    particlesHTML += `<div class="loader-particle" style="
      left:${x}%;
      bottom:-10px;
      width:${size}px;
      height:${size}px;
      background:${color};
      box-shadow:0 0 ${size * 2}px ${color};
      animation-duration:${duration}s;
      animation-delay:${delay}s;
    "></div>`;
  }

  // =============================================
  // TROCAR A LOGO:
  // Substitua o bloco .loader-logo-text por:
  //   <img class="loader-logo-img" src="/assets/logo.png" alt="Logo">
  // =============================================
  loader.innerHTML = `
    <div class="loader-orb loader-orb--1"></div>
    <div class="loader-orb loader-orb--2"></div>
    <div class="loader-orb loader-orb--3"></div>
    <div class="loader-particles">${particlesHTML}</div>
    <div class="loader-logo-wrap">
      <div class="loader-ring"></div>
      <div class="loader-logo">
        <div class="loader-logo-text">tradex<span>GG</span></div>
      </div>
    </div>
    <div class="loader-tagline">Case Opening Experience</div>
    <div class="loader-progress-wrap">
      <div class="loader-progress-bar"></div>
    </div>
    <div class="loader-status">Carregando<span class="loader-dots"></span></div>
  `;

  document.body.prepend(loader);

  // Fade out apos o tempo definido
  setTimeout(() => {
    loader.classList.add('fade-out');
    setTimeout(() => loader.remove(), 600);
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

document.addEventListener('DOMContentLoaded', renderNavbar);
