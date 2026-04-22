#!/usr/bin/env node
// =====================================================
// tradexGG — fix-prices.js
//
// Busca preços reais do Waxpeer (gratuito, sem key) e
// Pricempire (se configurado), atualiza market_price e
// site_price de TODAS as skins e recalcula o preço de
// cada case com house edge configurável.
//
// Uso:
//   node database/fix-prices.js
//   node database/fix-prices.js --edge 0.12   (12% house edge)
//   node database/fix-prices.js --dry-run      (simula sem salvar)
// =====================================================

require('dotenv').config({ path: __dirname + '/../backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const WAXPEER_URL  = 'https://api.waxpeer.com/v1/prices?game=csgo';
const EXCHANGE_URL = 'https://api.frankfurter.app/latest?from=USD&to=BRL';

// Argumentos CLI
const args       = process.argv.slice(2);
const DRY_RUN    = args.includes('--dry-run');
const edgeArg    = args.find(a => a.startsWith('--edge=') || a === '--edge');
const HOUSE_EDGE = edgeArg
  ? parseFloat(args[args.indexOf(edgeArg) + (edgeArg.includes('=') ? 0 : 1)]?.replace('--edge=', '') ?? '0.10')
  : parseFloat(process.env.HOUSE_EDGE || '0.10');

const PRICE_ADJUST = parseFloat(process.env.PRICE_ADJUST_FACTOR || '1.0');

console.log('='.repeat(60));
console.log('tradexGG — Correção de Preços e Cases');
console.log('='.repeat(60));
console.log(`House edge: ${(HOUSE_EDGE * 100).toFixed(0)}%`);
console.log(`Fator de ajuste: ${PRICE_ADJUST}`);
if (DRY_RUN) console.log('⚠️  DRY RUN — nenhuma alteração será salva\n');

// ─────────────────────────────────────────────────────
// 1. Taxa de câmbio USD/BRL
// ─────────────────────────────────────────────────────
async function fetchUsdBrl() {
  try {
    const res = await fetch(EXCHANGE_URL, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'tradexGG/1.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.rates?.BRL ?? null;
  } catch (e) {
    console.warn('[cambio] Erro:', e.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────
// 2. Preços Waxpeer (gratuito, bulk)
// ─────────────────────────────────────────────────────
async function fetchWaxpeerPrices(usdBrl) {
  try {
    console.log('[waxpeer] Buscando preços...');
    const res = await fetch(WAXPEER_URL, {
      signal: AbortSignal.timeout(30000),
      headers: { 'User-Agent': 'tradexGG/1.0' },
    });
    if (!res.ok) { console.error(`[waxpeer] HTTP ${res.status}`); return null; }
    const data = await res.json();
    if (!data.success || !Array.isArray(data.items)) { console.error('[waxpeer] Resposta inválida'); return null; }

    const map = {};
    for (const item of data.items) {
      if (!item.name || !item.steam_price || item.steam_price <= 0) continue;
      // steam_price = milli-USD  →  centavos BRL = steam_price * usdBrl / 10
      map[item.name] = Math.round(item.steam_price * usdBrl / 10 * PRICE_ADJUST);
    }
    console.log(`[waxpeer] ✓ ${Object.keys(map).length} itens recebidos`);
    return map;
  } catch (e) {
    console.error('[waxpeer] Erro:', e.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────
// 3. Preços Pricempire (fallback, requer key)
// ─────────────────────────────────────────────────────
async function fetchPricempirePrices() {
  const key = process.env.PRICEMPIRE_API_KEY;
  if (!key || key === 'sua-api-key-aqui') return null;

  try {
    console.log('[pricempire] Buscando preços...');
    const source = process.env.PRICEMPIRE_SOURCE || 'steam';
    const url = `https://api.pricempire.com/v3/items/prices?api_key=${key}&currency=BRL&sources=${source}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(30000),
      headers: { 'User-Agent': 'tradexGG/1.0' },
    });
    if (res.status === 401) { console.warn('[pricempire] API key inválida'); return null; }
    if (!res.ok) { console.warn(`[pricempire] HTTP ${res.status}`); return null; }
    const data = await res.json();

    const map = {};
    for (const [name, sources] of Object.entries(data)) {
      const price = sources[source]?.price;
      if (typeof price === 'number' && price > 0) {
        map[name] = Math.round(price * PRICE_ADJUST);
      }
    }
    console.log(`[pricempire] ✓ ${Object.keys(map).length} itens recebidos`);
    return map;
  } catch (e) {
    console.error('[pricempire] Erro:', e.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────
// 4. Atualizar market_price e site_price das skins
// ─────────────────────────────────────────────────────
async function updateSkinPrices(priceMap) {
  const { rows: skins } = await pool.query(
    'SELECT id, name, market_hash_name, market_price FROM skins WHERE market_hash_name IS NOT NULL ORDER BY id'
  );

  let updated = 0, notFound = 0;
  const notFoundList = [];

  for (const skin of skins) {
    const newPrice = priceMap[skin.market_hash_name];
    if (newPrice && newPrice > 0) {
      if (!DRY_RUN) {
        await pool.query(
          'UPDATE skins SET market_price = $1, site_price = $1, price_updated_at = NOW() WHERE id = $2',
          [newPrice, skin.id]
        );
      }
      const old = skin.market_price;
      const diff = old > 0 ? ((newPrice - old) / old * 100).toFixed(0) : '—';
      const sign = newPrice > old ? '+' : '';
      console.log(
        `  ✓ ${skin.name.padEnd(45)} R$${(newPrice / 100).toFixed(2).padStart(8)}  (era R$${(old / 100).toFixed(2)}, ${sign}${diff}%)`
      );
      updated++;
    } else {
      notFound++;
      notFoundList.push(skin.name);
    }
  }

  if (notFoundList.length > 0) {
    console.log('\n  ⚠️  Skins sem preço no Waxpeer/Pricempire:');
    notFoundList.forEach(n => console.log(`     - ${n}`));
  }

  return { updated, notFound, total: skins.length };
}

// ─────────────────────────────────────────────────────
// 5. Recalcular preço das cases com base no EV real
// ─────────────────────────────────────────────────────
async function recalculateCasePrices() {
  const { rows: cases } = await pool.query(
    'SELECT id, name, price FROM cases WHERE is_active = true ORDER BY id'
  );

  console.log('\n' + '─'.repeat(60));
  console.log(`Recalculando preços das cases (house edge: ${(HOUSE_EDGE * 100).toFixed(0)}%)`);
  console.log('─'.repeat(60));

  for (const c of cases) {
    const { rows: skins } = await pool.query(`
      SELECT cs.weight,
             COALESCE(s.site_price, s.market_price) AS price
      FROM case_skins cs
      JOIN skins s ON cs.skin_id = s.id
      WHERE cs.case_id = $1
    `, [c.id]);

    if (skins.length === 0) {
      console.log(`  ⚠️  Case "${c.name}" sem skins — ignorada`);
      continue;
    }

    const totalWeight = skins.reduce((sum, s) => sum + Number(s.weight), 0);
    const ev = skins.reduce((sum, s) => sum + (Number(s.weight) / totalWeight) * Number(s.price), 0);

    // Preço = EV / (1 - house_edge), arredondado para o múltiplo de 10 centavos mais próximo
    const rawPrice = ev / (1 - HOUSE_EDGE);
    const newPrice = Math.max(100, Math.round(rawPrice / 10) * 10); // mínimo R$1,00

    const oldPrice = Number(c.price);
    const edge = ((newPrice - ev) / newPrice * 100).toFixed(1);

    console.log(
      `  Case #${String(c.id).padStart(2)} "${c.name.padEnd(30)}" ` +
      `EV=R$${(ev / 100).toFixed(2).padStart(7)}  ` +
      `Preço: R$${(oldPrice / 100).toFixed(2).padStart(7)} → R$${(newPrice / 100).toFixed(2).padStart(7)}  ` +
      `(edge ${edge}%)`
    );

    if (!DRY_RUN) {
      await pool.query('UPDATE cases SET price = $1 WHERE id = $2', [newPrice, c.id]);
    }
  }
}

// ─────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────
async function main() {
  try {
    // 1. Câmbio
    console.log('\n[1/4] Buscando taxa de câmbio USD/BRL...');
    const usdBrl = await fetchUsdBrl();
    if (!usdBrl) {
      console.error('❌ Não foi possível obter taxa USD/BRL. Verifique sua conexão.');
      process.exit(1);
    }
    console.log(`      USD/BRL: ${usdBrl.toFixed(4)}`);

    // 2. Preços
    console.log('\n[2/4] Buscando preços de mercado...');
    let priceMap = await fetchWaxpeerPrices(usdBrl);
    if (!priceMap || Object.keys(priceMap).length === 0) {
      console.warn('      Waxpeer falhou. Tentando Pricempire...');
      priceMap = await fetchPricempirePrices();
    }
    if (!priceMap || Object.keys(priceMap).length === 0) {
      console.error('❌ Nenhuma fonte de preços disponível. Verifique sua conexão.');
      process.exit(1);
    }

    // 3. Atualizar skins
    console.log('\n[3/4] Atualizando market_price e site_price das skins...');
    console.log('─'.repeat(60));
    const stats = await updateSkinPrices(priceMap);
    console.log(`\n      ✅ ${stats.updated}/${stats.total} skins atualizadas`);
    if (stats.notFound > 0) {
      console.log(`      ⚠️  ${stats.notFound} skins sem preço (mantidas com valor anterior)`);
    }

    // 4. Recalcular cases
    console.log('\n[4/4] Recalculando preços das cases...');
    await recalculateCasePrices();

    console.log('\n' + '='.repeat(60));
    if (DRY_RUN) {
      console.log('✅ Simulação concluída — nenhuma alteração foi salva.');
      console.log('   Rode sem --dry-run para aplicar as mudanças.');
    } else {
      console.log('✅ Concluído! Preços e cases atualizados com sucesso.');
    }
    console.log('='.repeat(60));

  } catch (err) {
    console.error('\n❌ Erro inesperado:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
