/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
// =====================================================
// tradexGG Price Service
//
// Estrategia de precos (em ordem de prioridade):
//   1. Waxpeer API    — bulk, gratuito, sem key, ~24k itens
//   2. Pricempire API — bulk, requer plano pago
//   3. Steam API      — fallback individual, rate limited
//
// market_price = referencia interna para calculos de EV (nunca alterado aqui)
// site_price   = preco real exibido ao usuario (atualizado por este servico)
// =====================================================

const pool       = require('../config/db');
const waxpeer    = require('./waxpeerService');
const pricempire = require('./pricempireService');

const PRICE_ADJUST_FACTOR = parseFloat(process.env.PRICE_ADJUST_FACTOR || '1.0');
const PRICE_CACHE_HOURS   = parseInt(process.env.PRICE_CACHE_HOURS || '6');
const STEAM_DELAY_MS      = 3200;

let updateRunning = false;

function calcSitePrice(rawPrice) {
  return Math.max(1, Math.round(rawPrice * PRICE_ADJUST_FACTOR));
}

// =====================================================
// Fonte 1: Waxpeer (gratuito, bulk, sem autenticacao)
// =====================================================
async function updateViaWaxpeer(skins) {
  console.log('[prices] Usando Waxpeer API (bulk, gratuito)...');

  const hashNames = skins.map(s => s.market_hash_name).filter(Boolean);
  const priceMap  = await waxpeer.fetchPricesForSkins(hashNames);

  if (!priceMap || Object.keys(priceMap).length === 0) {
    console.warn('[prices] Waxpeer nao retornou precos. Tentando proximo fallback...');
    return false;
  }

  let updated = 0, notFound = 0;

  for (const skin of skins) {
    const raw = priceMap[skin.market_hash_name];
    if (raw) {
      const sitePrice = calcSitePrice(raw);
      await pool.query(
        `UPDATE skins SET market_price = $1, site_price = $1, price_updated_at = NOW() WHERE id = $2`,
        [sitePrice, skin.id]
      );
      console.log(`[prices] ✓ [waxpeer] ${skin.name}: R$ ${(sitePrice / 100).toFixed(2)}`);
      updated++;
    } else {
      console.warn(`[prices] ✗ [waxpeer] ${skin.name}: sem preco`);
      notFound++;
    }
  }

  console.log(`[prices] Waxpeer: ${updated} atualizadas, ${notFound} sem preco`);
  return updated > 0;
}

// =====================================================
// Fonte 2: Pricempire (plano pago, bulk)
// =====================================================
async function updateViaPricempire(skins) {
  console.log('[prices] Usando Pricempire API (bulk)...');

  const hashNames = skins.map(s => s.market_hash_name).filter(Boolean);
  const priceMap  = await pricempire.fetchPricesForSkins(hashNames);

  if (!priceMap || Object.keys(priceMap).length === 0) {
    console.warn('[prices] Pricempire nao retornou precos.');
    return false;
  }

  let updated = 0, notFound = 0;

  for (const skin of skins) {
    const raw = priceMap[skin.market_hash_name];
    if (raw) {
      const sitePrice = calcSitePrice(raw);
      await pool.query(
        `UPDATE skins SET market_price = $1, site_price = $1, price_updated_at = NOW() WHERE id = $2`,
        [sitePrice, skin.id]
      );
      console.log(`[prices] ✓ [pricempire] ${skin.name}: R$ ${(sitePrice / 100).toFixed(2)}`);
      updated++;
    } else {
      console.warn(`[prices] ✗ [pricempire] ${skin.name}: sem preco`);
      notFound++;
    }
  }

  console.log(`[prices] Pricempire: ${updated} atualizadas, ${notFound} sem preco`);
  return updated > 0;
}

// =====================================================
// Fonte 3: Steam Market API (fallback individual, lento)
// =====================================================
async function fetchSteamPrice(marketHashName) {
  try {
    const encoded = encodeURIComponent(marketHashName);
    const url = `https://steamcommunity.com/market/priceoverview/?currency=7&appid=730&market_hash_name=${encoded}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success) return null;
    const rawStr = data.median_price || data.lowest_price || '';
    const cleaned = rawStr.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    const value = Math.round(parseFloat(cleaned) * 100);
    return isNaN(value) || value <= 0 ? null : value;
  } catch {
    return null;
  }
}

async function updateViaSteam(skins) {
  console.log(`[prices] Usando Steam Market API (${skins.length} skins, lento)...`);
  let updated = 0, failed = 0;

  for (const skin of skins) {
    const price = await fetchSteamPrice(skin.market_hash_name);
    if (price !== null) {
      const sitePrice = calcSitePrice(price);
      await pool.query(
        `UPDATE skins SET market_price = $1, site_price = $1, price_updated_at = NOW() WHERE id = $2`,
        [sitePrice, skin.id]
      );
      console.log(`[prices] ✓ [steam] ${skin.name}: R$ ${(sitePrice / 100).toFixed(2)}`);
      updated++;
    } else {
      if (!skin.site_price) {
        await pool.query(`UPDATE skins SET site_price = $1 WHERE id = $2`, [calcSitePrice(skin.market_price), skin.id]);
      }
      console.warn(`[prices] ✗ [steam] ${skin.name}: falhou`);
      failed++;
    }
    await new Promise(r => setTimeout(r, STEAM_DELAY_MS));
  }

  console.log(`[prices] Steam: ${updated} atualizadas, ${failed} falhas`);
}

// =====================================================
// Atualizar precos de todas as skins
// =====================================================
async function updateSkinPrices({ force = false } = {}) {
  if (updateRunning) {
    console.log('[prices] Atualizacao ja em andamento, ignorando');
    return { updated: 0, failed: 0, skipped: 0 };
  }

  updateRunning = true;

  try {
    const whereClause = force
      ? `WHERE market_hash_name IS NOT NULL`
      : `WHERE market_hash_name IS NOT NULL
         AND (price_updated_at IS NULL OR price_updated_at < NOW() - INTERVAL '${PRICE_CACHE_HOURS} hours')`;

    const { rows: skins } = await pool.query(
      `SELECT id, name, market_hash_name, market_price, site_price FROM skins ${whereClause} ORDER BY id`
    );

    if (skins.length === 0) {
      console.log('[prices] Nenhuma skin precisa de atualizacao');
      return { updated: 0, failed: 0, skipped: 0 };
    }

    console.log(`[prices] Atualizando ${skins.length} skins...`);

    // 1. Tentar Waxpeer (gratuito, sem key)
    const waxpeerOk = await updateViaWaxpeer(skins);
    if (waxpeerOk) return { updated: skins.length, failed: 0, skipped: 0 };

    // 2. Tentar Pricempire (plano pago)
    if (pricempire.isConfigured()) {
      const pricempireOk = await updateViaPricempire(skins);
      if (pricempireOk) return { updated: skins.length, failed: 0, skipped: 0 };
    }

    // 3. Fallback: Steam API individual (lento)
    await updateViaSteam(skins);
    return { updated: skins.length, failed: 0, skipped: 0 };

  } finally {
    updateRunning = false;
  }
}

// =====================================================
// Garantir que todas as skins tem site_price preenchido
// =====================================================
async function ensureSitePrices() {
  try {
    const result = await pool.query(
      `UPDATE skins SET site_price = market_price WHERE site_price IS NULL`
    );
    if (result.rowCount > 0) {
      console.log(`[prices] ${result.rowCount} skins sem site_price corrigidas`);
    }
  } catch (err) {
    console.error('[prices] Erro ao garantir site_price:', err.message);
  }
}

// =====================================================
// Iniciar ciclo automatico de atualizacao de precos
// =====================================================
function startPriceUpdateLoop() {
  ensureSitePrices();
  console.log('[prices] Fonte: Waxpeer (gratuito) → Pricempire → Steam API (fallback)');

  setTimeout(async () => {
    console.log('[prices] Iniciando primeira atualizacao de precos...');
    await updateSkinPrices();

    setInterval(() => {
      console.log('[prices] Ciclo automatico de atualizacao de precos');
      updateSkinPrices();
    }, PRICE_CACHE_HOURS * 60 * 60 * 1000);
  }, 10_000);
}

module.exports = { updateSkinPrices, ensureSitePrices, startPriceUpdateLoop, calcSitePrice };
