#!/usr/bin/env node
// =====================================================
// tradexGG — fix-prices.js
//
// Busca preços reais da Skinport API (BRL) e atualiza
// site_price de TODAS as skins. Recalcula o preço de
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

const SKINPORT_URL = 'https://api.skinport.com/v1/items?app_id=730&currency=BRL';

// Argumentos CLI
const args       = process.argv.slice(2);
const DRY_RUN    = args.includes('--dry-run');
const edgeArg    = args.find(a => a.startsWith('--edge=') || a === '--edge');
const HOUSE_EDGE = edgeArg
  ? parseFloat(args[args.indexOf(edgeArg) + (edgeArg.includes('=') ? 0 : 1)]?.replace('--edge=', '') ?? '0.10')
  : parseFloat(process.env.HOUSE_EDGE || '0.10');

const PRICE_ADJUST = parseFloat(process.env.PRICE_ADJUST_FACTOR || '1.0');

console.log('='.repeat(60));
console.log('tradexGG — Correção de Preços e Cases (Skinport)');
console.log('='.repeat(60));
console.log(`House edge: ${(HOUSE_EDGE * 100).toFixed(0)}%`);
console.log(`Fator de ajuste: ${PRICE_ADJUST}`);
if (DRY_RUN) console.log('⚠️  DRY RUN — nenhuma alteração será salva\n');

// ─────────────────────────────────────────────────────
// 1. Preços Skinport (bulk, BRL nativo)
// ─────────────────────────────────────────────────────
async function fetchSkinportPrices() {
  console.log('[skinport] Buscando preços...');
  const res = await fetch(SKINPORT_URL, {
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip,br,deflate',
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Skinport retornou HTTP ${res.status}`);
  const items = await res.json();
  if (!Array.isArray(items)) throw new Error('Skinport retornou resposta inesperada');

  const map = new Map();
  for (const item of items) {
    if (item.market_hash_name && item.min_price != null && item.min_price > 0) {
      map.set(item.market_hash_name, Math.max(1, Math.round(item.min_price * 100 * PRICE_ADJUST)));
    }
  }
  console.log(`[skinport] ✓ ${map.size} itens recebidos\n`);
  return map;
}

// ─────────────────────────────────────────────────────
// 2. Atualizar site_price das skins
// ─────────────────────────────────────────────────────
async function updateSkinPrices(priceMap) {
  const { rows: skins } = await pool.query(
    'SELECT id, name, market_hash_name, market_price, site_price FROM skins WHERE market_hash_name IS NOT NULL ORDER BY id'
  );

  let updated = 0, notFound = 0;
  const notFoundList = [];

  for (const skin of skins) {
    const newPrice = priceMap.get(skin.market_hash_name);
    if (newPrice && newPrice > 0) {
      if (!DRY_RUN) {
        await pool.query(
          'UPDATE skins SET site_price = $1, price_updated_at = NOW() WHERE id = $2',
          [newPrice, skin.id]
        );
      }
      const old = skin.site_price || skin.market_price;
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
    console.log('\n  ⚠️  Skins não encontradas na Skinport:');
    notFoundList.forEach(n => console.log(`     - ${n}`));
  }

  return { updated, notFound, total: skins.length };
}

// ─────────────────────────────────────────────────────
// 3. Recalcular preço das cases com base no EV real
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

    const rawPrice = ev / (1 - HOUSE_EDGE);
    const newPrice = Math.max(100, Math.round(rawPrice / 10) * 10);

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
    console.log('\n[1/3] Buscando preços da Skinport API...');
    const priceMap = await fetchSkinportPrices();

    console.log('[2/3] Atualizando site_price das skins...');
    console.log('─'.repeat(60));
    const stats = await updateSkinPrices(priceMap);
    console.log(`\n      ✅ ${stats.updated}/${stats.total} skins atualizadas`);
    if (stats.notFound > 0) {
      console.log(`      ⚠️  ${stats.notFound} skins sem preço (mantidas com valor anterior)`);
    }

    console.log('\n[3/3] Recalculando preços das cases...');
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
