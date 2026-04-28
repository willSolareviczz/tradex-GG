#!/usr/bin/env node
/**
 * add-budget-cases.js
 *
 * Adiciona cases baratas ao banco SEM remover as existentes.
 * Usa skins baratas (consumer/industrial/mil-spec em desgastes piores)
 * e calcula o preço automaticamente com ~12% de margem.
 *
 * Uso:
 *   node scripts/add-budget-cases.js            (executa de verdade)
 *   node scripts/add-budget-cases.js --dry-run  (só simula)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const { Pool } = require('pg');

const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
const DRY_RUN = process.argv.includes('--dry-run');

const WAXPEER_URL = 'https://api.waxpeer.com/v1/prices?game=csgo';
const FX_URL      = 'https://api.frankfurter.app/latest?from=USD&to=BRL';
const CDN_BASE    = 'https://images.waxpeer.com/i/';

const WEAR_DIST = { FN: 7, MW: 8, FT: 23, WW: 7, BS: 55 };
const WEAR_LABELS = {
  'Factory New':    'FN',
  'Minimal Wear':   'MW',
  'Field-Tested':   'FT',
  'Well-Worn':      'WW',
  'Battle-Scarred': 'BS',
};
const WEAR_FULL = {
  FN: 'Factory New', MW: 'Minimal Wear', FT: 'Field-Tested',
  WW: 'Well-Worn',   BS: 'Battle-Scarred',
};
const RARITY_COLOR = {
  extraordinary: '#e4ae39',
  covert:        '#eb4b4b',
  classified:    '#d32ce6',
  restricted:    '#8847ff',
  milspec:       '#4b69ff',
  industrial:    '#5e98d9',
  consumer:      '#b0c3d9',
};

// ─────────────────────────────────────────────────────────────────────────────
// Definição das cases baratas
//
// bw    = baseWeight por rarity (multiplicado pelo WEAR_DIST de cada desgaste)
// wears = filtro opcional de desgastes. Se omitido, usa TODOS disponíveis.
//         Útil para incluir só os desgastes mais baratos (WW, BS) nas cases baratas.
// ─────────────────────────────────────────────────────────────────────────────
const BUDGET_CASES = [

  // ──────────────────────────────────────────────────────
  // 1. BEGINNER BOX  — somente skins consumer/industrial
  //    Preço esperado: ~R$5–R$10
  // ──────────────────────────────────────────────────────
  {
    name: 'Beginner Box',
    slug: 'beginner-box',
    category: 'rifles',
    targetMargin: 0.12,
    skins: [
      // Consumer (floor)
      { base: 'P250 | Sand Dune',           rarity: 'consumer',   bw: 800 },
      { base: 'Tec-9 | Groundwater',        rarity: 'consumer',   bw: 800 },
      { base: 'PP-Bizon | Sand Dashed',     rarity: 'consumer',   bw: 700 },
      { base: 'FAMAS | Colony',             rarity: 'consumer',   bw: 600 },
      { base: 'Galil AR | Sage Spray',      rarity: 'consumer',   bw: 600 },
      { base: 'SG 553 | Pulse',             rarity: 'consumer',   bw: 600 },
      // Industrial (mid)
      { base: 'AK-47 | Safari Mesh',        rarity: 'industrial', bw: 400 },
      { base: 'M4A1-S | Boreal Forest',     rarity: 'industrial', bw: 400 },
      { base: 'Negev | Army Sheen',         rarity: 'industrial', bw: 350 },
      // Mil-spec (jackpot pequeno)
      { base: 'P250 | Franklin',            rarity: 'milspec',    bw: 20  },
      { base: 'G3SG1 | Flux',              rarity: 'restricted', bw: 5,  wears: ['WW','BS'] },
    ],
  },

  // ──────────────────────────────────────────────────────
  // 2. BRONZE PACK  — industrial + mil-spec em desgastes piores
  //    Preço esperado: ~R$15–R$30
  // ──────────────────────────────────────────────────────
  {
    name: 'Bronze Pack',
    slug: 'bronze-pack',
    category: 'rifles',
    targetMargin: 0.12,
    skins: [
      // Floor
      { base: 'AK-47 | Safari Mesh',        rarity: 'industrial', bw: 500 },
      { base: 'M4A1-S | Boreal Forest',     rarity: 'industrial', bw: 500 },
      { base: 'Negev | Army Sheen',         rarity: 'industrial', bw: 400 },
      // Mid
      { base: 'P250 | Franklin',            rarity: 'milspec',    bw: 80  },
      { base: 'Five-SeveN | Monkey Business',rarity: 'milspec',   bw: 60, wears: ['WW','BS'] },
      { base: 'Nova | Hyper Beast',         rarity: 'milspec',    bw: 50, wears: ['WW','BS'] },
      // Jackpot
      { base: 'G3SG1 | Flux',              rarity: 'restricted', bw: 20, wears: ['FT','WW','BS'] },
      { base: 'AK-47 | Phantom Disruptor',  rarity: 'restricted', bw: 8,  wears: ['WW','BS'] },
      { base: 'P250 | Asiimov',             rarity: 'milspec',    bw: 30, wears: ['WW','BS'] },
    ],
  },

  // ──────────────────────────────────────────────────────
  // 3. SILVER PACK  — mil-spec médio + restricted WW/BS
  //    Preço esperado: ~R$40–R$80
  // ──────────────────────────────────────────────────────
  {
    name: 'Silver Pack',
    slug: 'silver-pack',
    category: 'rifles',
    targetMargin: 0.12,
    skins: [
      // Floor (mil-spec desgaste ruim)
      { base: 'FAMAS | Commemoration',      rarity: 'milspec',    bw: 100, wears: ['WW','BS'] },
      { base: 'Tec-9 | Fuel Injector',      rarity: 'milspec',    bw: 100, wears: ['WW','BS'] },
      { base: 'P250 | Asiimov',             rarity: 'milspec',    bw: 100, wears: ['WW','BS'] },
      { base: 'M4A4 | In Living Color',     rarity: 'milspec',    bw: 80,  wears: ['WW','BS'] },
      { base: 'AK-47 | Frontside Misty',    rarity: 'milspec',    bw: 80,  wears: ['WW','BS'] },
      // Mid (restricted desgaste ruim)
      { base: 'AK-47 | Phantom Disruptor',  rarity: 'restricted', bw: 25,  wears: ['WW','BS'] },
      { base: 'M4A4 | Neo-Noir',            rarity: 'restricted', bw: 25,  wears: ['WW','BS'] },
      { base: 'USP-S | Blueprint',          rarity: 'restricted', bw: 20,  wears: ['WW','BS'] },
      // Jackpot
      { base: 'AK-47 | Redline',            rarity: 'classified', bw: 5,   wears: ['WW','BS'] },
      { base: 'M4A1-S | Mecha Industries',  rarity: 'restricted', bw: 12,  wears: ['WW','BS'] },
    ],
  },

  // ──────────────────────────────────────────────────────
  // 4. PISTOL STARTER  — pistolas baratas + jackpot pistola
  //    Preço esperado: ~R$20–R$40
  // ──────────────────────────────────────────────────────
  {
    name: 'Pistol Starter',
    slug: 'pistol-starter',
    category: 'pistols',
    targetMargin: 0.12,
    skins: [
      // Floor barato
      { base: 'P250 | Sand Dune',           rarity: 'consumer',   bw: 600 },
      { base: 'Tec-9 | Groundwater',        rarity: 'consumer',   bw: 500 },
      // Mid
      { base: 'P250 | Franklin',            rarity: 'milspec',    bw: 100 },
      { base: 'Five-SeveN | Monkey Business',rarity: 'milspec',   bw: 80  },
      { base: 'Tec-9 | Fuel Injector',      rarity: 'milspec',    bw: 60, wears: ['FT','WW','BS'] },
      // Jackpot pistola
      { base: 'Glock-18 | Water Elemental', rarity: 'restricted', bw: 20, wears: ['FT','WW','BS'] },
      { base: 'Desert Eagle | Kumicho Dragon', rarity: 'restricted', bw: 10, wears: ['FT','WW','BS'] },
      { base: 'USP-S | Blueprint',          rarity: 'restricted', bw: 8,  wears: ['WW','BS'] },
    ],
  },

  // ──────────────────────────────────────────────────────
  // 5. SNIPER STARTER  — snipers baratas + jackpot AWP
  //    Preço esperado: ~R$30–R$60
  // ──────────────────────────────────────────────────────
  {
    name: 'Sniper Starter',
    slug: 'sniper-starter',
    category: 'snipers',
    targetMargin: 0.12,
    skins: [
      // Floor
      { base: 'Negev | Army Sheen',         rarity: 'industrial', bw: 400 },
      { base: 'Galil AR | Sage Spray',      rarity: 'consumer',   bw: 400 },
      // Mid
      { base: 'Nova | Hyper Beast',         rarity: 'milspec',    bw: 80, wears: ['FT','WW','BS'] },
      { base: 'G3SG1 | Flux',              rarity: 'restricted', bw: 30, wears: ['FT','WW','BS'] },
      { base: 'P250 | Asiimov',             rarity: 'milspec',    bw: 60, wears: ['FT','WW','BS'] },
      // Jackpot AWP
      { base: 'AWP | Asiimov',              rarity: 'restricted', bw: 8,  wears: ['WW','BS'] },
      { base: 'AWP | Electric Hive',        rarity: 'classified', bw: 3,  wears: ['WW'] },
      { base: 'SSG 08 | Blood in the Water',rarity: 'classified', bw: 4,  wears: ['FT'] },
    ],
  },

];

// ─────────────────────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase()
    .replace(/[★\s]+/g, '-')
    .replace(/[|]/g, '')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function roundNice(v) {
  const r = Math.ceil(v / 100) * 100;
  return r - 10;
}

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('[waxpeer] Buscando preços...');
  const wRes  = await fetch(WAXPEER_URL, {
    signal: AbortSignal.timeout(30000),
    headers: { 'User-Agent': 'tradexGG/1.0' },
  });
  const wData = await wRes.json();
  if (!wData.success) throw new Error('Waxpeer falhou');

  const fxRes  = await fetch(FX_URL, { signal: AbortSignal.timeout(8000) });
  const fxData = await fxRes.json();
  const usdBrl = fxData.rates.BRL;
  console.log(`[fx] USD/BRL = ${usdBrl.toFixed(4)} | ${wData.items.length} itens no Waxpeer\n`);

  // Mapa Waxpeer: hashName → { price, img }
  const waxMap = {};
  for (const item of wData.items) {
    if (!item.name || !item.steam_price) continue;
    waxMap[item.name] = {
      price: Math.round(item.steam_price * usdBrl / 10),
      img:   item.img || '',
    };
  }

  if (DRY_RUN) console.log('[dry-run] Simulação ativa — nada será salvo.\n');

  const client = await pool.connect();

  try {
    let totalCases = 0;
    let totalSkins = 0;
    const summary  = [];

    for (const def of BUDGET_CASES) {
      console.log(`\n${'═'.repeat(60)}`);
      console.log(`  ${def.name.toUpperCase()} (${def.category})`);
      console.log('─'.repeat(60));

      // Verificar se case já existe
      const existing = await client.query(
        'SELECT id FROM cases WHERE slug = $1', [def.slug]
      );
      if (existing.rows.length > 0) {
        console.log(`  ↷  Case já existe (slug="${def.slug}"), pulando.`);
        continue;
      }

      const caseSkins = []; // { skinId, weight, price }

      for (const skinDef of def.skins) {
        const parts    = skinDef.base.split(' | ');
        const weapon   = parts[0].trim();
        const skinName = parts[1]?.trim() || '';
        const color    = RARITY_COLOR[skinDef.rarity] || '#b0c3d9';

        // Filtro de desgastes
        const allowedWears = skinDef.wears
          ? new Set(skinDef.wears)
          : new Set(['FN','MW','FT','WW','BS']);

        const found = [];
        for (const [wearLabel, wearCode] of Object.entries(WEAR_LABELS)) {
          if (!allowedWears.has(wearCode)) continue;
          const hashName = `${skinDef.base} (${wearLabel})`;
          if (waxMap[hashName]) {
            found.push({
              wearCode,
              hashName,
              price: waxMap[hashName].price,
              img:   waxMap[hashName].img,
            });
          }
        }

        if (found.length === 0) {
          console.log(`  ⚠  NÃO ENCONTRADO: ${skinDef.base}`);
          continue;
        }

        console.log(`  ✓  ${skinDef.base} → ${found.length} desgaste(s)`);

        for (const w of found) {
          const fullName = `${skinDef.base.replace(/★\s*/g, '').trim()} (${w.wearCode})`;
          const imgSlug  = slugify(w.hashName.replace(/★\s*/g, ''));
          const imageUrl = w.img.startsWith('http')
            ? w.img
            : `${CDN_BASE}730-${imgSlug}.webp`;
          const weight   = Math.max(1, skinDef.bw * WEAR_DIST[w.wearCode]);

          if (!DRY_RUN) {
            // Verificar se skin já existe pelo market_hash_name
            const existSkin = await client.query(
              'SELECT id FROM skins WHERE market_hash_name = $1', [w.hashName]
            );

            let skinId;
            if (existSkin.rows.length > 0) {
              skinId = existSkin.rows[0].id;
              // Atualizar preço
              await client.query(
                `UPDATE skins SET site_price=$1, market_price=$1, price_updated_at=NOW(),
                 image_url=CASE WHEN image_url='GENERATED' OR image_url='' THEN $2 ELSE image_url END
                 WHERE id=$3`,
                [w.price, imageUrl, skinId]
              );
            } else {
              const res = await client.query(
                `INSERT INTO skins
                  (name, weapon, skin_name, wear, rarity, rarity_color, image_url,
                   market_price, site_price, price_updated_at, market_hash_name)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,NOW(),$9) RETURNING id`,
                [fullName, weapon, skinName, w.wearCode,
                 skinDef.rarity, color, imageUrl, w.price, w.hashName]
              );
              skinId = res.rows[0].id;
              totalSkins++;
            }
            caseSkins.push({ skinId, weight, price: w.price });
          } else {
            caseSkins.push({ skinId: null, weight, price: w.price });
            console.log(`     ${w.wearCode}: R$${(w.price / 100).toFixed(2).padStart(10)}  peso=${weight}`);
          }
        }
      }

      if (caseSkins.length === 0) {
        console.log('  ✗  Nenhuma skin encontrada — case ignorada.');
        continue;
      }

      // Calcular EV e preço
      const totalWeight = caseSkins.reduce((s, x) => s + x.weight, 0);
      const ev          = caseSkins.reduce((s, x) => s + (x.weight / totalWeight) * x.price, 0);
      const casePrice   = roundNice(ev / (1 - def.targetMargin));
      const margin      = (1 - ev / casePrice) * 100;

      console.log(`\n  EV     = R$${(ev / 100).toFixed(2)}`);
      console.log(`  Preço  = R$${(casePrice / 100).toFixed(2)}  (margem ${margin.toFixed(1)}%)`);
      console.log(`  Skins  = ${caseSkins.length} variante(s)`);

      if (!DRY_RUN) {
        const caseRes = await client.query(
          `INSERT INTO cases (name, slug, image_url, price, category)
           VALUES ($1,$2,'GENERATED',$3,$4) RETURNING id`,
          [def.name, def.slug, casePrice, def.category]
        );
        const caseId = caseRes.rows[0].id;

        for (const cs of caseSkins) {
          await client.query(
            'INSERT INTO case_skins (case_id, skin_id, weight) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
            [caseId, cs.skinId, cs.weight]
          );
        }
        totalCases++;
      }

      summary.push({ name: def.name, price: casePrice, skins: caseSkins.length, margin });
    }

    // Resumo
    console.log(`\n${'═'.repeat(60)}`);
    console.log('RESUMO\n');
    console.log('Case'.padEnd(22) + 'Preço'.padEnd(16) + 'Skins'.padEnd(8) + 'Margem');
    console.log('─'.repeat(54));
    for (const r of summary) {
      console.log(
        r.name.padEnd(22) +
        `R$${(r.price / 100).toFixed(2)}`.padEnd(16) +
        String(r.skins).padEnd(8) +
        `${r.margin.toFixed(1)}%`
      );
    }
    console.log('─'.repeat(54));

    if (!DRY_RUN) {
      console.log(`\n✔  ${totalCases} cases adicionadas | ${totalSkins} novas skins inseridas`);
    } else {
      console.log('\n[dry-run] Nada foi salvo.');
    }

  } finally {
    client.release();
  }

  await pool.end();
}

main().catch(err => {
  console.error('\n[ERRO]', err.message);
  process.exit(1);
});
