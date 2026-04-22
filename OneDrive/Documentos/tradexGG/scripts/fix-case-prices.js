#!/usr/bin/env node
/**
 * fix-case-prices.js — Recalcula o preco de cada case para atingir ~10% de margem
 *
 * Formula: preco_case = EV / (1 - margem_alvo / 100)
 * EV = Σ(weight_i / totalWeight × site_price_i)
 *
 * Uso: node scripts/fix-case-prices.js [--dry-run]
 *
 *   --dry-run   Mostra os precos calculados sem salvar no banco
 */

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const DRY_RUN = process.argv.includes('--dry-run');
const TARGET_MARGIN = 10; // %

// Arredonda para cima ao multiplo de 10 centavos mais proximo
// e subtrai 10 para ficar com terminal .90 (ex: 4890 -> 4890, depois formata como R$48,90)
function roundToNice(centavos) {
  // Round up to nearest 100 centavos (R$1), then -10 for .90 ending
  const rounded = Math.ceil(centavos / 100) * 100 - 10;
  return rounded < 90 ? 90 : rounded; // minimum R$0,90
}

async function main() {
  const { rows: cases } = await pool.query(`
    SELECT c.id, c.name, c.price,
      json_agg(json_build_object(
        'weight', cs.weight,
        'price', COALESCE(s.site_price, s.market_price)
      )) as skins
    FROM cases c
    JOIN case_skins cs ON cs.case_id = c.id
    JOIN skins s ON cs.skin_id = s.id
    GROUP BY c.id, c.name, c.price
    ORDER BY c.id
  `);

  if (cases.length === 0) {
    console.log('Nenhuma case com skins encontrada.');
    await pool.end();
    return;
  }

  console.log(`\nRecalculando precos de ${cases.length} cases (margem alvo: ${TARGET_MARGIN}%)\n`);
  console.log('─'.repeat(70));

  for (const c of cases) {
    const totalWeight = c.skins.reduce((s, x) => s + x.weight, 0);
    const ev = c.skins.reduce((s, x) => s + (x.weight / totalWeight) * x.price, 0);
    const currentMargin = ((1 - ev / c.price) * 100).toFixed(1);

    // preco = EV / (1 - margem/100)
    const newPriceRaw = ev / (1 - TARGET_MARGIN / 100);
    const newPrice = roundToNice(Math.ceil(newPriceRaw));
    const actualMargin = ((1 - ev / newPrice) * 100).toFixed(1);

    console.log(`Case ${c.id}: ${c.name}`);
    console.log(`  EV atual:      R$ ${(ev / 100).toFixed(2)}`);
    console.log(`  Preco atual:   R$ ${(c.price / 100).toFixed(2)}  (margem: ${currentMargin}%)`);
    console.log(`  Preco sugerido: R$ ${(newPrice / 100).toFixed(2)}  (margem: ${actualMargin}%)`);

    if (!DRY_RUN) {
      await pool.query('UPDATE cases SET price = $1 WHERE id = $2', [newPrice, c.id]);
      console.log(`  ✓ Atualizado!`);
    } else {
      console.log(`  [dry-run] Nao salvo`);
    }
    console.log();
  }

  console.log('─'.repeat(70));
  if (DRY_RUN) {
    console.log('\n[dry-run] Nenhuma alteracao salva. Remova --dry-run para aplicar.\n');
  } else {
    console.log(`\n✓ ${cases.length} cases atualizadas com sucesso!\n`);
  }

  await pool.end();
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
