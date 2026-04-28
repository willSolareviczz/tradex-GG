#!/usr/bin/env node
/**
 * update-prices-to-min.js
 *
 * Atualiza market_price e site_price de todas as skins do banco
 * usando o preço `min` da API Waxpeer (menor listagem real de venda),
 * em vez do steam_price (preço inflado da Steam Community Market).
 *
 * Em seguida, recalcula o preço de todas as cases com base no novo EV.
 *
 * Uso:
 *   node scripts/update-prices-to-min.js            (executa)
 *   node scripts/update-prices-to-min.js --dry-run  (só mostra)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const { Pool } = require('pg');

const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
const DRY_RUN = process.argv.includes('--dry-run');

const WAXPEER_URL = 'https://api.waxpeer.com/v1/prices?game=csgo';
const FX_URL      = 'https://api.frankfurter.app/latest?from=USD&to=BRL';
const TARGET_MARGIN = 0.12;

function roundNice(v) {
  const r = Math.ceil(v / 100) * 100;
  return r - 10; // ex: 6590
}

async function main() {
  // 1. Buscar Waxpeer
  console.log('[waxpeer] Buscando preços...');
  const wRes  = await fetch(WAXPEER_URL, {
    signal: AbortSignal.timeout(120000),
    headers: { 'User-Agent': 'tradexGG/1.0' },
  });
  const wData = await wRes.json();
  if (!wData.success) throw new Error('Waxpeer falhou');

  // 2. Taxa de câmbio
  const fxRes  = await fetch(FX_URL, { signal: AbortSignal.timeout(8000) });
  const fxData = await fxRes.json();
  const usdBrl = fxData.rates.BRL;
  console.log(`[fx] USD/BRL = ${usdBrl.toFixed(4)} | ${wData.items.length} itens\n`);

  // 3. Montar mapa: market_hash_name → { min, steam_price, img }
  const waxMap = {};
  for (const item of wData.items) {
    if (!item.name) continue;
    waxMap[item.name] = {
      min:   item.min         ? Math.round(item.min         * usdBrl / 10) : null,
      steam: item.steam_price ? Math.round(item.steam_price * usdBrl / 10) : null,
      img:   item.img || '',
    };
  }

  // 4. Buscar todas as skins do banco
  const client = await pool.connect();
  try {
    const { rows: skins } = await client.query(
      'SELECT id, name, market_hash_name, market_price, site_price FROM skins'
    );

    console.log(`Atualizando ${skins.length} skins...\n`);

    let updated = 0, notFound = 0, noMin = 0;
    const changes = [];

    for (const skin of skins) {
      // Tenta pelo market_hash_name primeiro, depois pelo name
      const entry = waxMap[skin.market_hash_name] || waxMap[skin.name];

      if (!entry) {
        notFound++;
        continue;
      }

      // Usa min; se não tiver min, usa steam_price como fallback
      const newPrice = entry.min ?? entry.steam;
      if (!newPrice) { noMin++; continue; }

      const oldPrice = skin.market_price;
      if (newPrice === oldPrice) continue; // sem mudança

      changes.push({ id: skin.id, name: skin.name, oldPrice, newPrice });
      updated++;

      if (!DRY_RUN) {
        await client.query(
          'UPDATE skins SET market_price = $1, site_price = $1 WHERE id = $2',
          [newPrice, skin.id]
        );
      }
    }

    // 5. Mostrar diferenças
    console.log('Skin'.padEnd(48) + 'Antes (R$)'.padEnd(14) + 'Depois (R$)'.padEnd(14) + 'Variação');
    console.log('-'.repeat(90));
    for (const c of changes.sort((a, b) => b.newPrice - a.newPrice).slice(0, 30)) {
      const antes  = 'R$' + (c.oldPrice / 100).toFixed(2);
      const depois = 'R$' + (c.newPrice / 100).toFixed(2);
      const pct    = ((c.newPrice - c.oldPrice) / c.oldPrice * 100).toFixed(0);
      const sinal  = pct > 0 ? '+' : '';
      console.log(c.name.substring(0, 47).padEnd(48) + antes.padEnd(14) + depois.padEnd(14) + sinal + pct + '%');
    }
    if (changes.length > 30) console.log(`  ... e mais ${changes.length - 30} skins`);

    console.log(`\n✓ Atualizadas: ${updated} | Não encontradas na API: ${notFound} | Sem min price: ${noMin}`);

    if (DRY_RUN) {
      console.log('\n[dry-run] Nada foi salvo.');
      return;
    }

    // 6. Recalcular preço de todas as cases com o novo EV
    console.log('\nRecalculando preços das cases...');
    const { rows: cases } = await client.query(
      "SELECT id, name, slug FROM cases WHERE is_active = true"
    );

    console.log('\n' + 'Case'.padEnd(30) + 'Preço anterior'.padEnd(18) + 'Novo preço'.padEnd(18) + 'Novo EV');
    console.log('-'.repeat(75));

    for (const c of cases) {
      const { rows: cSkins } = await client.query(`
        SELECT cs.weight, COALESCE(s.site_price, s.market_price) AS price
        FROM case_skins cs
        JOIN skins s ON s.id = cs.skin_id
        WHERE cs.case_id = $1
      `, [c.id]);

      if (cSkins.length === 0) continue;

      const totalW = cSkins.reduce((s, x) => s + Number(x.weight), 0);
      const ev     = cSkins.reduce((s, x) => s + (Number(x.weight) / totalW) * Number(x.price), 0);
      const newCasePrice = roundNice(ev / (1 - TARGET_MARGIN));

      const { rows: old } = await client.query('SELECT price FROM cases WHERE id = $1', [c.id]);
      const oldCasePrice = old[0]?.price || 0;

      console.log(
        c.name.substring(0, 29).padEnd(30) +
        ('R$' + (oldCasePrice / 100).toFixed(2)).padEnd(18) +
        ('R$' + (newCasePrice / 100).toFixed(2)).padEnd(18) +
        'EV R$' + (ev / 100).toFixed(2)
      );

      await client.query('UPDATE cases SET price = $1 WHERE id = $2', [newCasePrice, c.id]);
    }

    console.log('\n✔ Preços das cases recalculados com margem de', (TARGET_MARGIN * 100) + '%');

  } finally {
    client.release();
    pool.end();
  }
}

main().catch(err => {
  console.error('Erro:', err.message);
  pool.end();
  process.exit(1);
});
