/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
// =====================================================
// tradexGG - Waxpeer Price Service
//
// API gratuita, sem autenticacao, retorna precos de
// 24.000+ itens CS2 em um unico request.
//
// Fonte de preco: Waxpeer marketplace (referencia Steam)
// Endpoint: https://api.waxpeer.com/v1/prices?game=csgo
// Conversao: steam_price (USD milli) × (USD/BRL) / 10
// Taxa de cambio: https://api.frankfurter.app (gratuita)
// =====================================================

const WAXPEER_URL   = 'https://api.waxpeer.com/v1/prices?game=csgo';
const EXCHANGE_URL  = 'https://api.frankfurter.app/latest?from=USD&to=BRL';
const CACHE_MINUTES = 60; // Waxpeer atualiza a cada ~1h, nao precisa buscar mais

let _cache = null;       // { hashName: centavosBRL }
let _cacheAt = 0;

// =====================================================
// Buscar taxa de cambio USD/BRL atual (gratuita, sem key)
// =====================================================
async function fetchUsdBrl() {
  try {
    const res = await fetch(EXCHANGE_URL, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'tradexGG/1.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.rates?.BRL ?? null;
  } catch {
    return null;
  }
}

// =====================================================
// Buscar todos os precos do Waxpeer (bulk, gratuito)
// Retorna: { hashName: centavosBRL } ou null se falhar
// =====================================================
async function fetchAllPrices() {
  // Verificar cache
  if (_cache && (Date.now() - _cacheAt) < CACHE_MINUTES * 60 * 1000) {
    return _cache;
  }

  try {
    console.log('[waxpeer] Buscando precos bulk...');

    // 1. Buscar taxa de cambio USD/BRL
    const usdBrl = await fetchUsdBrl();
    if (!usdBrl) {
      console.warn('[waxpeer] Nao foi possivel obter taxa USD/BRL');
      return null;
    }
    console.log(`[waxpeer] USD/BRL: ${usdBrl.toFixed(4)}`);

    // 2. Buscar todos os precos do Waxpeer
    const res = await fetch(WAXPEER_URL, {
      signal: AbortSignal.timeout(30000),
      headers: { 'User-Agent': 'tradexGG/1.0' },
    });

    if (!res.ok) {
      console.error(`[waxpeer] HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();

    if (!data.success || !Array.isArray(data.items)) {
      console.error('[waxpeer] Resposta invalida');
      return null;
    }

    // 3. Converter: steam_price (milli-USD) × (USD/BRL) / 10 = centavos BRL
    // Waxpeer armazena precos como: valor_centavos_USD * 10
    // Entao: centavos_BRL = steam_price * usdBrl / 10
    const priceMap = {};
    for (const item of data.items) {
      if (!item.name || !item.steam_price || item.steam_price <= 0) continue;
      const centavosBRL = Math.round(item.steam_price * usdBrl / 10);
      if (centavosBRL > 0) {
        priceMap[item.name] = centavosBRL;
      }
    }

    const count = Object.keys(priceMap).length;
    console.log(`[waxpeer] ✓ ${count} precos recebidos (cambio: 1 USD = R$ ${usdBrl.toFixed(4)})`);

    _cache = priceMap;
    _cacheAt = Date.now();

    return priceMap;

  } catch (err) {
    console.error('[waxpeer] Erro:', err.message);
    return null;
  }
}

// =====================================================
// Buscar precos para uma lista de hash names
// =====================================================
async function fetchPricesForSkins(hashNames) {
  const all = await fetchAllPrices();
  if (!all) return {};

  const result = {};
  for (const name of hashNames) {
    if (all[name]) result[name] = all[name];
  }
  return result;
}

// =====================================================
// Limpar cache (forcca nova busca)
// =====================================================
function clearCache() {
  _cache = null;
  _cacheAt = 0;
  console.log('[waxpeer] Cache limpo');
}

module.exports = { fetchAllPrices, fetchPricesForSkins, clearCache };
