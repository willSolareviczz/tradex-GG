/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
// =====================================================
// tradexGG Price Service — Skinport
//
// Fonte unica: api.skinport.com/v1/items
// Busca todos os itens CS2 em BRL de uma vez (bulk).
// site_price = min_price da Skinport * PRICE_ADJUST_FACTOR
// =====================================================

const pool = require('../config/db');

const SKINPORT_URL     = 'https://api.skinport.com/v1/items?app_id=730&currency=BRL';
const PRICE_ADJUST_FACTOR = parseFloat(process.env.PRICE_ADJUST_FACTOR || '1.0');
const PRICE_CACHE_HOURS   = parseInt(process.env.PRICE_CACHE_HOURS || '6');

let updateRunning = false;

// Busca todos os precos da Skinport e retorna Map: market_hash_name -> centavos
async function fetchSkinportPrices() {
  const res = await fetch(SKINPORT_URL, {
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip,br,deflate',
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`Skinport API retornou ${res.status}`);

  const items = await res.json();
  if (!Array.isArray(items)) throw new Error('Skinport retornou resposta inesperada');

  const priceMap = new Map();
  for (const item of items) {
    if (item.market_hash_name && item.min_price != null && item.min_price > 0) {
      const centavos = Math.max(1, Math.round(item.min_price * 100 * PRICE_ADJUST_FACTOR));
      const imageUrl = item.icon_url
        ? `https://community.akamai.steamstatic.com/economy/image/${item.icon_url}/960fx960f`
        : null;
      priceMap.set(item.market_hash_name, { price: centavos, imageUrl });
    }
  }
  console.log(`[prices] Skinport: ${priceMap.size} itens carregados`);
  return priceMap;
}

// Atualiza site_price de todas as skins que precisam de atualizacao
async function updateSkinPrices({ force = false } = {}) {
  if (updateRunning) {
    console.log('[prices] Atualizacao ja em andamento, ignorando');
    return { updated: 0, notFound: 0, skipped: 0 };
  }

  updateRunning = true;

  try {
    const whereClause = force
      ? `WHERE market_hash_name IS NOT NULL`
      : `WHERE market_hash_name IS NOT NULL
         AND (price_updated_at IS NULL OR price_updated_at < NOW() - INTERVAL '${PRICE_CACHE_HOURS} hours')`;

    const { rows: skins } = await pool.query(
      `SELECT id, name, market_hash_name, image_url FROM skins ${whereClause} ORDER BY id`
    );

    if (skins.length === 0) {
      console.log('[prices] Nenhuma skin precisa de atualizacao');
      return { updated: 0, notFound: 0, skipped: 0 };
    }

    console.log(`[prices] Atualizando ${skins.length} skins via Skinport...`);

    const priceMap = await fetchSkinportPrices();

    let updated = 0, notFound = 0;

    for (const skin of skins) {
      const entry = priceMap.get(skin.market_hash_name);
      if (entry != null) {
        const { price, imageUrl } = entry;
        if (imageUrl && !skin.image_url) {
          await pool.query(
            `UPDATE skins SET site_price = $1, image_url = $2, price_updated_at = NOW() WHERE id = $3`,
            [price, imageUrl, skin.id]
          );
        } else {
          await pool.query(
            `UPDATE skins SET site_price = $1, price_updated_at = NOW() WHERE id = $2`,
            [price, skin.id]
          );
        }
        console.log(`[prices] ✓ ${skin.name}: R$ ${(price / 100).toFixed(2)}`);
        updated++;
      } else {
        console.warn(`[prices] ✗ ${skin.name}: nao encontrado na Skinport`);
        notFound++;
      }
    }

    console.log(`[prices] Concluido: ${updated} atualizadas, ${notFound} nao encontradas`);
    return { updated, notFound, skipped: 0 };

  } finally {
    updateRunning = false;
  }
}

// Garante que todas as skins tenham site_price preenchido (fallback para market_price)
async function ensureSitePrices() {
  try {
    const result = await pool.query(
      `UPDATE skins SET site_price = market_price WHERE site_price IS NULL`
    );
    if (result.rowCount > 0) {
      console.log(`[prices] ${result.rowCount} skins sem site_price corrigidas com market_price`);
    }
  } catch (err) {
    console.error('[prices] Erro ao garantir site_price:', err.message);
  }
}

// Inicia ciclo automatico de atualizacao de precos
function startPriceUpdateLoop() {
  ensureSitePrices();
  console.log('[prices] Fonte: Skinport API (bulk, BRL)');

  setTimeout(async () => {
    console.log('[prices] Iniciando primeira atualizacao de precos...');
    await updateSkinPrices().catch(err => console.error('[prices] Erro na primeira atualizacao:', err.message));

    setInterval(() => {
      console.log('[prices] Ciclo automatico de atualizacao de precos');
      updateSkinPrices().catch(err => console.error('[prices] Erro no ciclo automatico:', err.message));
    }, PRICE_CACHE_HOURS * 60 * 60 * 1000);
  }, 10_000);
}

module.exports = { updateSkinPrices, ensureSitePrices, startPriceUpdateLoop, fetchSkinportPrices };
