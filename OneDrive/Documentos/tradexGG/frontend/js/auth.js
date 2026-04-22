/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section frontend
 */
// ===== Login / Register page logic =====

document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  if (isLoggedIn()) {
    window.location.href = '/cases.html';
    return;
  }

  const form = document.getElementById('auth-form');
  const errorEl = document.getElementById('form-error');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const isRegister = form.dataset.type === 'register';

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const result = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      saveAuth(result.user, result.token);
      window.location.href = '/cases.html';
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    }
  });
});
