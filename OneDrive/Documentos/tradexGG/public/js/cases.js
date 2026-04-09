document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('cases-grid');

  try {
    const cases = await apiFetch('/cases');

    if (cases.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p>Nenhuma caixa disponível no momento.</p></div>';
      return;
    }

    grid.innerHTML = cases.map(c => `
      <a href="/open.html?id=${c.id}" class="case-card">
        <img src="${c.image_url}" alt="${c.name}" class="case-card-img">
        <div class="case-card-info">
          <div class="case-card-name">${c.name}</div>
          <div class="case-card-price">${formatPrice(c.price)}</div>
        </div>
      </a>
    `).join('');
  } catch {
    grid.innerHTML = '<div class="empty-state"><p>Erro ao carregar caixas.</p></div>';
  }
});
