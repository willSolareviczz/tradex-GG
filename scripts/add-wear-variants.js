#!/usr/bin/env node
/**
 * add-wear-variants.js
 *
 * Para cada skin no banco, busca todos os desgastes disponíveis no Waxpeer
 * e adiciona os que estão faltando. Redistribui os pesos nas cases usando
 * a distribuição de float do CS2.
 *
 * Uso: node scripts/add-wear-variants.js [--dry-run]
 */

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const { Pool } = require('pg');

const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
const DRY_RUN = process.argv.includes('--dry-run');

const WAXPEER_URL = 'https://api.waxpeer.com/v1/prices?game=csgo';
const CDN_BASE    = 'https://images.waxpeer.com/i/';

// Distribuição de float CS2 (% de itens em cada desgaste)
const WEAR_DIST = { FN: 7, MW: 8, FT: 23, WW: 7, BS: 55 };

const WEAR_LABELS = {
  'Factory New':    'FN',
  'Minimal Wear':   'MW',
  'Field-Tested':   'FT',
  'Well-Worn':      'WW',
  'Battle-Scarred': 'BS',
};

const WEAR_FULL = {
  FN: 'Factory New',
  MW: 'Minimal Wear',
  FT: 'Field-Tested',
  WW: 'Well-Worn',
  BS: 'Battle-Scarred',
};

function stripWear(hashName) {
  return hashName.replace(/ \((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/, '').trim();
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/[★\s]+/g, '-')
    .replace(/[|]/g, '')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  // 1. Fetch Waxpeer bulk data
  console.log('[waxpeer] Buscando precos...');
  const res  = await fetch(WAXPEER_URL, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'tradexGG/1.0' } });
  const data = await res.json();
  if (!data.success) throw new Error('Waxpeer falhou');

  // Taxa USD/BRL
  const fxRes  = await fetch('https://api.frankfurter.app/latest?from=USD&to=BRL', { signal: AbortSignal.timeout(8000) });
  const fxData = await fxRes.json();
  const usdBrl = fxData.rates.BRL;
  console.log(`[waxpeer] USD/BRL: ${usdBrl.toFixed(4)}, ${data.items.length} itens\n`);

  // Mapa: hashName → { price (centavos BRL), img }
  const waxMap = {};
  for (const item of data.items) {
    if (!item.name || !item.steam_price) continue;
    waxMap[item.name] = {
      price: Math.round(item.steam_price * usdBrl / 10),
      img:   item.img || '',
    };
  }

  // 2. Carregar skins do banco
  const { rows: dbSkins } = await pool.query(
    'SELECT id, name, weapon, skin_name, wear, rarity, rarity_color, market_hash_name, market_price, site_price FROM skins WHERE market_hash_name IS NOT NULL ORDER BY id'
  );

  // Agrupar por nome base (sem desgaste)
  const groups = {};
  for (const s of dbSkins) {
    const base = stripWear(s.market_hash_name);
    if (!groups[base]) groups[base] = [];
    groups[base].push(s);
  }

  // 3. Para cada grupo, descobrir quais desgastes existem no Waxpeer
  let totalAdded = 0;

  for (const [baseName, skins] of Object.entries(groups)) {
    const existingWears = new Set(skins.map(s => s.wear));
    const ref = skins[0]; // referência para rarity, weapon, etc.

    // Achar todos os desgastes disponíveis no Waxpeer para este item
    const available = {};
    for (const [label, code] of Object.entries(WEAR_LABELS)) {
      const hashName = `${baseName} (${label})`;
      if (waxMap[hashName]) {
        available[code] = { hashName, ...waxMap[hashName] };
      }
    }

    const missing = Object.keys(available).filter(w => !existingWears.has(w));
    if (missing.length === 0) continue;

    console.log(`\n${baseName}`);
    console.log(`  Existentes: [${[...existingWears].join(', ')}]  |  Adicionando: [${missing.join(', ')}]`);

    for (const wear of missing) {
      const info   = available[wear];
      const wearFull = WEAR_FULL[wear];

      // Montar nome e image_url
      const skinName = `${ref.name.replace(/ \((FN|MW|FT|WW|BS)\)$/, '')} (${wear})`;
      const imgSlug  = slugify(info.hashName.replace(/★\s*/g, ''));
      const imageUrl = info.img.startsWith('http')
        ? info.img
        : `${CDN_BASE}730-${imgSlug}.webp`;

      console.log(`  + ${skinName}: R$${(info.price/100).toFixed(2)}`);

      if (!DRY_RUN) {
        // Inserir nova skin
        const ins = await pool.query(
          `INSERT INTO skins (name, weapon, skin_name, wear, rarity, rarity_color, image_url, market_price, site_price, price_updated_at, market_hash_name)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,NOW(),$9)
           ON CONFLICT DO NOTHING RETURNING id`,
          [skinName, ref.weapon, ref.skin_name, wear, ref.rarity, ref.rarity_color,
           imageUrl, info.price, info.hashName]
        );

        if (ins.rows.length === 0) {
          // Já existe (ON CONFLICT) — busca o id
          const ex = await pool.query('SELECT id FROM skins WHERE market_hash_name = $1', [info.hashName]);
          if (ex.rows.length > 0) ins.rows.push(ex.rows[0]);
        }

        if (ins.rows.length > 0) {
          totalAdded++;
          const newId = ins.rows[0].id;

          // Adicionar nas mesmas cases que já têm algum desgaste deste grupo
          // com peso proporcional à distribuição de float
          for (const existingSkin of skins) {
            const casesResult = await pool.query(
              'SELECT case_id, weight FROM case_skins WHERE skin_id = $1', [existingSkin.id]
            );

            for (const cs of casesResult.rows) {
              // Verificar se este wear já está na case
              const already = await pool.query(
                'SELECT 1 FROM case_skins WHERE case_id = $1 AND skin_id = $2', [cs.case_id, newId]
              );
              if (already.rows.length > 0) continue;

              // Peso proporcional à distribuição de float do CS2
              // Usando o peso existente como base para o desgaste de referência
              const refWear   = existingSkin.wear;
              const refDist   = WEAR_DIST[refWear] || 23;
              const newDist   = WEAR_DIST[wear]     || 23;
              const newWeight = Math.max(1, Math.round(cs.weight * (newDist / refDist)));

              await pool.query(
                'INSERT INTO case_skins (case_id, skin_id, weight) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
                [cs.case_id, newId, newWeight]
              );
            }
          }
        }
      }
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Novas skins adicionadas: ${totalAdded}`);
  if (DRY_RUN) console.log('[dry-run] Nada foi salvo.');

  await pool.end();
}

main().catch(err => { console.error('Erro:', err.message); process.exit(1); });
