/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
// =====================================================
// tradexGG - Pricempire Integration
// API mais usada no mercado profissional de CS2.
// Consolida preços de 50+ sites (Steam, Buff, Skinport).
//
// Documentacao: https://pricempire.com/api
// Plano gratuito: limitado, suficiente para testes.
//
// Como obter API key:
//   1. Acesse https://pricempire.com
//   2. Crie uma conta gratuita
//   3. Va em Settings > API
//   4. Copie sua API key
//   5. Adicione ao backend/.env: PRICEMPIRE_API_KEY=sua-key
// =====================================================

const PRICEMPIRE_API_KEY = process.env.PRICEMPIRE_API_KEY;
const PRICEMPIRE_BASE    = 'https://api.pricempire.com/v3';

// Qual fonte de preco usar. Opcoes: steam, buff, skinport, csmoney, skinbid, waxpeer
// "steam" = Steam Community Market (mais confiavel como referencia)
// "buff"  = Buff163 (normalmente mais barato, popular entre traders)
const PRICEMPIRE_SOURCE = process.env.PRICEMPIRE_SOURCE || 'steam';

// Quantas horas o cache de precos da Pricempire é valido
// O plano gratuito tem limite de requests/dia, entao nao chamamos com frequencia
const PRICEMPIRE_CACHE_HOURS = parseInt(process.env.PRICEMPIRE_CACHE_HOURS || '12');

// Cache em memoria para evitar chamadas repetidas na mesma sessao
let _priceCache = null;         // { hashName: priceCents }
let _priceCacheTimestamp = 0;

// =====================================================
// Buscar todos os precos de uma vez (bulk)
// Retorna: { hashName: priceEmCentavosBRL } ou null se falhar
// =====================================================
async function fetchAllPrices() {
  if (!PRICEMPIRE_API_KEY || PRICEMPIRE_API_KEY === 'sua-api-key-aqui') {
    return null;
  }

  // Checar cache em memoria
  const ageMins = (Date.now() - _priceCacheTimestamp) / 60000;
  if (_priceCache && ageMins < PRICEMPIRE_CACHE_HOURS * 60) {
    console.log('[pricempire] Usando cache em memoria');
    return _priceCache;
  }

  try {
    console.log(`[pricempire] Buscando precos bulk (source: ${PRICEMPIRE_SOURCE})...`);

    // Pricempire v3: GET /items/prices retorna TODOS os itens do CS2
    // Resposta: { "AK-47 | Redline (Field-Tested)": { steam: { price: 2200 }, buff: {...} }, ... }
    const url = `${PRICEMPIRE_BASE}/items/prices?api_key=${PRICEMPIRE_API_KEY}&currency=BRL&sources=${PRICEMPIRE_SOURCE}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(30000),
      headers: { 'User-Agent': 'tradexGG/1.0' },
    });

    if (res.status === 401) {
      console.error('[pricempire] API key invalida. Configure PRICEMPIRE_API_KEY no .env');
      return null;
    }

    if (res.status === 429) {
      console.warn('[pricempire] Rate limit atingido. Aguarde antes de tentar novamente.');
      return null;
    }

    if (!res.ok) {
      console.error(`[pricempire] Erro HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();

    if (!data || typeof data !== 'object') {
      console.error('[pricempire] Resposta invalida');
      return null;
    }

    // Normalizar: extrair preco da fonte escolhida para cada item
    // Formato Pricempire: { hashName: { steam: { price: 2200, ... }, buff: {...} } }
    // price ja vem em centavos BRL quando currency=BRL
    const normalized = {};
    let count = 0;

    for (const [hashName, sources] of Object.entries(data)) {
      const sourceData = sources[PRICEMPIRE_SOURCE];
      if (!sourceData) continue;

      // price em centavos BRL (Pricempire retorna em centavos quando currency=BRL)
      const price = sourceData.price;
      if (typeof price === 'number' && price > 0) {
        normalized[hashName] = price;
        count++;
      }
    }

    console.log(`[pricempire] ✓ ${count} precos recebidos`);

    _priceCache = normalized;
    _priceCacheTimestamp = Date.now();

    return normalized;

  } catch (err) {
    console.error('[pricempire] Erro ao buscar precos:', err.message);
    return null;
  }
}

// =====================================================
// Buscar preco de um item especifico
// Retorna: preco em centavos BRL, ou null se nao encontrado
// =====================================================
async function fetchPrice(marketHashName) {
  const all = await fetchAllPrices();
  if (!all) return null;

  const price = all[marketHashName];
  if (!price) {
    console.warn(`[pricempire] Sem preco para: ${marketHashName}`);
    return null;
  }

  return price;
}

// =====================================================
// Buscar precos para uma lista de hash names
// Retorna: { hashName: priceCents } para os que encontrou
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
// Verificar se a API key esta configurada e funcionando
// =====================================================
async function testConnection() {
  if (!PRICEMPIRE_API_KEY || PRICEMPIRE_API_KEY === 'sua-api-key-aqui') {
    return { ok: false, reason: 'API key nao configurada (PRICEMPIRE_API_KEY no .env)' };
  }

  try {
    const url = `${PRICEMPIRE_BASE}/items/prices?api_key=${PRICEMPIRE_API_KEY}&currency=BRL&sources=${PRICEMPIRE_SOURCE}&limit=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'tradexGG/1.0' } });

    if (res.status === 401) return { ok: false, reason: 'API key invalida' };
    if (res.status === 429) return { ok: false, reason: 'Rate limit atingido' };
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };

    return { ok: true, source: PRICEMPIRE_SOURCE, cacheHours: PRICEMPIRE_CACHE_HOURS };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

// =====================================================
// Limpar cache em memoria (forcca nova busca)
// =====================================================
function clearCache() {
  _priceCache = null;
  _priceCacheTimestamp = 0;
  console.log('[pricempire] Cache limpo');
}

module.exports = {
  fetchAllPrices,
  fetchPrice,
  fetchPricesForSkins,
  testConnection,
  clearCache,
  isConfigured: () => !!PRICEMPIRE_API_KEY && PRICEMPIRE_API_KEY !== 'sua-api-key-aqui',
};
