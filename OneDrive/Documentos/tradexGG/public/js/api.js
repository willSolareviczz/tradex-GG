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
  const user = getUser();
  const logged = isLoggedIn();

  const nav = document.createElement('nav');
  nav.className = 'navbar';
  nav.innerHTML = `
    <a href="/" class="navbar-logo">tradex<span>GG</span></a>
    <div class="navbar-links">
      <a href="/cases.html">Caixas</a>
      <a href="/ranking.html">Ranking</a>
      ${logged ? `<a href="/inventory.html">Inventário</a>` : ''}
    </div>
    <div class="navbar-right">
      ${logged ? `
        <div class="balance-display" id="nav-balance">${formatPrice(user?.balance || 0)}</div>
        <a href="/deposit.html" class="btn btn-primary btn-sm">Depositar</a>
        <a href="/profile.html" class="btn btn-secondary btn-sm">${user?.username || 'Perfil'}</a>
        <button class="btn btn-secondary btn-sm" onclick="logout()">Sair</button>
      ` : `
        <a href="/login.html" class="btn btn-secondary btn-sm">Entrar</a>
        <a href="/register.html" class="btn btn-primary btn-sm">Cadastrar</a>
      `}
    </div>
  `;

  document.body.prepend(nav);

  // Update balance from server
  if (logged) {
    apiFetch('/users/me').then(data => {
      if (data) {
        const balEl = document.getElementById('nav-balance');
        if (balEl) balEl.textContent = formatPrice(data.balance);
        // Update stored user
        const user = getUser();
        if (user) {
          user.balance = data.balance;
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

// Auto-render navbar
document.addEventListener('DOMContentLoaded', renderNavbar);
