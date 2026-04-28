#!/usr/bin/env node
/**
 * populate-clash-cases.js
 *
 * Cria 10 cases no estilo clash.gg com skins reais do CS2 via Waxpeer API.
 * Limpa todos os cases/skins existentes e reconstrói do zero com preços reais.
 *
 * Uso:
 *   node scripts/populate-clash-cases.js            (executa de verdade)
 *   node scripts/populate-clash-cases.js --dry-run  (só mostra o que faria)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const { Pool } = require('pg');

const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
const DRY_RUN = process.argv.includes('--dry-run');

// ── APIs ──────────────────────────────────────────────────────────────────────
const WAXPEER_URL = 'https://api.waxpeer.com/v1/prices?game=csgo';
const FX_URL      = 'https://api.frankfurter.app/latest?from=USD&to=BRL';
const CDN_BASE    = 'https://images.waxpeer.com/i/';

// ── Constantes ────────────────────────────────────────────────────────────────
const WEAR_DIST = { FN: 7, MW: 8, FT: 23, WW: 7, BS: 55 };
const WEAR_LABELS = {
  'Factory New': 'FN', 'Minimal Wear': 'MW', 'Field-Tested': 'FT',
  'Well-Worn':   'WW', 'Battle-Scarred': 'BS',
};
const WEAR_FULL = {
  FN: 'Factory New', MW: 'Minimal Wear', FT: 'Field-Tested',
  WW: 'Well-Worn',   BS: 'Battle-Scarred',
};
const RARITY_COLOR = {
  extraordinary: '#e4ae39',   // facas / gloves
  covert:        '#eb4b4b',   // vermelho
  classified:    '#d32ce6',   // rosa/roxo
  restricted:    '#8847ff',   // roxo
  milspec:       '#4b69ff',   // azul
  industrial:    '#5e98d9',   // azul claro
  consumer:      '#b0c3d9',   // cinza
};

// ── Definição dos 10 cases ────────────────────────────────────────────────────
// bw = baseWeight por rarity (antes de multiplicar pelo WEAR_DIST)
// Para ter odds reais de CS2:  covert~1, classified~5, restricted~25, milspec~100
const CASE_DEFS = [
  // ────────────────────────────────────────────────────
  // 1. STARTER PACK  (budget ~R$15-25)
  // ────────────────────────────────────────────────────
  {
    name: 'Starter Pack',
    slug: 'starter-pack',
    category: 'rifles',
    targetMargin: 0.13,
    skins: [
      { base: 'AK-47 | Redline',            rarity: 'classified', bw: 5   },
      { base: 'M4A4 | Buzz Kill',            rarity: 'restricted', bw: 25  },
      { base: 'AWP | Asiimov',               rarity: 'restricted', bw: 25  },
      { base: 'AK-47 | Frontside Misty',     rarity: 'milspec',    bw: 100 },
      { base: 'P250 | Asiimov',              rarity: 'milspec',    bw: 100 },
      { base: 'MP7 | Fade',                  rarity: 'milspec',    bw: 100 },
      { base: 'M4A1-S | Boreal Forest',      rarity: 'industrial', bw: 400 },
      { base: 'AK-47 | Safari Mesh',         rarity: 'industrial', bw: 400 },
    ],
  },

  // ────────────────────────────────────────────────────
  // 2. PISTOL PACK  (~R$40-70)
  // ────────────────────────────────────────────────────
  {
    name: 'Pistol Pack',
    slug: 'pistol-pack',
    category: 'pistols',
    targetMargin: 0.12,
    skins: [
      { base: 'Desert Eagle | Blaze',        rarity: 'classified', bw: 4  },
      { base: 'Glock-18 | Fade',             rarity: 'classified', bw: 4  },
      { base: 'USP-S | Blueprint',           rarity: 'restricted', bw: 18 },
      { base: 'Glock-18 | Water Elemental',  rarity: 'restricted', bw: 18 },
      { base: 'Desert Eagle | Kumicho Dragon',rarity: 'restricted', bw: 18 },
      { base: 'P250 | Asiimov',              rarity: 'milspec',    bw: 80 },
      { base: 'Tec-9 | Fuel Injector',       rarity: 'milspec',    bw: 80 },
      { base: 'P250 | Franklin',             rarity: 'milspec',    bw: 80 },
      { base: 'Five-SeveN | Monkey Business',rarity: 'milspec',    bw: 80 },
    ],
  },

  // ────────────────────────────────────────────────────
  // 3. BLUE STEEL  (~R$60-100)
  // ────────────────────────────────────────────────────
  {
    name: 'Blue Steel',
    slug: 'blue-steel',
    category: 'rifles',
    targetMargin: 0.12,
    skins: [
      { base: 'M4A1-S | Blue Phosphor',      rarity: 'classified', bw: 4  },
      { base: 'AK-47 | Bloodsport',          rarity: 'classified', bw: 4  },
      { base: 'M4A4 | Neo-Noir',             rarity: 'restricted', bw: 18 },
      { base: 'USP-S | Neo-Noir',            rarity: 'restricted', bw: 18 },
      { base: 'AK-47 | Phantom Disruptor',   rarity: 'restricted', bw: 18 },
      { base: 'M4A1-S | Mecha Industries',   rarity: 'restricted', bw: 18 },
      { base: 'P250 | Asiimov',              rarity: 'milspec',    bw: 80 },
      { base: 'FAMAS | Commemoration',       rarity: 'milspec',    bw: 80 },
      { base: 'MP7 | Fade',                  rarity: 'milspec',    bw: 80 },
    ],
  },

  // ────────────────────────────────────────────────────
  // 4. NEON CYBER  (~R$100-200)
  // ────────────────────────────────────────────────────
  {
    name: 'Neon Cyber',
    slug: 'neon-cyber',
    category: 'premium',
    targetMargin: 0.12,
    skins: [
      { base: 'AWP | Neon Rider',            rarity: 'classified', bw: 4  },
      { base: 'AK-47 | Neon Rider',          rarity: 'classified', bw: 4  },
      { base: 'M4A4 | Neo-Noir',             rarity: 'restricted', bw: 16 },
      { base: 'M4A1-S | Mecha Industries',   rarity: 'restricted', bw: 16 },
      { base: 'USP-S | Blueprint',           rarity: 'restricted', bw: 16 },
      { base: 'AK-47 | Asiimov',             rarity: 'restricted', bw: 16 },
      { base: 'MP9 | Wild Lily',             rarity: 'restricted', bw: 16 },
      { base: 'P250 | Asiimov',              rarity: 'milspec',    bw: 64 },
      { base: 'FAMAS | Commemoration',       rarity: 'milspec',    bw: 64 },
      { base: 'Nova | Hyper Beast',          rarity: 'milspec',    bw: 64 },
    ],
  },

  // ────────────────────────────────────────────────────
  // 5. FIRE SERPENT  (~R$100-200)
  // ────────────────────────────────────────────────────
  {
    name: 'Fire Serpent',
    slug: 'fire-serpent',
    category: 'rifles',
    targetMargin: 0.12,
    skins: [
      { base: 'AK-47 | Fire Serpent',        rarity: 'covert',     bw: 1  },
      { base: 'AWP | Medusa',                rarity: 'classified', bw: 5  },
      { base: 'M4A4 | Royal Paladin',        rarity: 'classified', bw: 5  },
      { base: 'AK-47 | Point Disarray',      rarity: 'restricted', bw: 22 },
      { base: 'M4A4 | Buzz Kill',            rarity: 'restricted', bw: 22 },
      { base: 'MP9 | Wild Lily',             rarity: 'restricted', bw: 22 },
      { base: 'AK-47 | Frontside Misty',     rarity: 'milspec',    bw: 90 },
      { base: 'M4A4 | In Living Color',      rarity: 'milspec',    bw: 90 },
      { base: 'Tec-9 | Fuel Injector',       rarity: 'milspec',    bw: 90 },
    ],
  },

  // ────────────────────────────────────────────────────
  // 6. AWP COLLECTION  (~R$150-300)
  // ────────────────────────────────────────────────────
  {
    name: 'AWP Collection',
    slug: 'awp-collection',
    category: 'snipers',
    targetMargin: 0.12,
    skins: [
      { base: 'AWP | Hyper Beast',           rarity: 'classified', bw: 4  },
      { base: 'AWP | Fade',                  rarity: 'classified', bw: 4  },
      { base: 'AWP | Neon Rider',            rarity: 'classified', bw: 4  },
      { base: 'AWP | Electric Hive',         rarity: 'classified', bw: 4  },
      { base: 'SSG 08 | Blood in the Water', rarity: 'classified', bw: 5  },
      { base: 'AWP | Asiimov',               rarity: 'restricted', bw: 20 },
      { base: 'G3SG1 | Flux',               rarity: 'restricted', bw: 20 },
      { base: 'P250 | Asiimov',              rarity: 'milspec',    bw: 80 },
      { base: 'Nova | Hyper Beast',          rarity: 'milspec',    bw: 80 },
    ],
  },

  // ────────────────────────────────────────────────────
  // 7. GOLDEN DRAGON  (~R$200-400)
  // ────────────────────────────────────────────────────
  {
    name: 'Golden Dragon',
    slug: 'golden-dragon',
    category: 'premium',
    targetMargin: 0.12,
    skins: [
      { base: 'AK-47 | Gold Arabesque',      rarity: 'covert',     bw: 1  },
      { base: 'Desert Eagle | Blaze',        rarity: 'classified', bw: 5  },
      { base: 'USP-S | Orion',               rarity: 'classified', bw: 5  },
      { base: 'Desert Eagle | Kumicho Dragon',rarity: 'restricted', bw: 22 },
      { base: 'Glock-18 | Water Elemental',  rarity: 'restricted', bw: 22 },
      { base: 'M4A4 | Neo-Noir',             rarity: 'restricted', bw: 22 },
      { base: 'Tec-9 | Fuel Injector',       rarity: 'milspec',    bw: 90 },
      { base: 'P250 | Franklin',             rarity: 'milspec',    bw: 90 },
      { base: 'Nova | Hyper Beast',          rarity: 'milspec',    bw: 90 },
    ],
  },

  // ────────────────────────────────────────────────────
  // 8. ELITE RIFLES  (~R$200-500)
  // ────────────────────────────────────────────────────
  {
    name: 'Elite Rifles',
    slug: 'elite-rifles',
    category: 'premium',
    targetMargin: 0.12,
    skins: [
      { base: 'AK-47 | Wild Lotus',          rarity: 'covert',     bw: 1  },
      { base: 'M4A1-S | Knight',             rarity: 'classified', bw: 5  },
      { base: 'AK-47 | Vulcan',              rarity: 'classified', bw: 5  },
      { base: 'M4A4 | Desolate Space',       rarity: 'classified', bw: 5  },
      { base: 'AK-47 | Bloodsport',          rarity: 'classified', bw: 5  },
      { base: 'M4A4 | Neo-Noir',             rarity: 'restricted', bw: 22 },
      { base: 'AK-47 | Phantom Disruptor',   rarity: 'restricted', bw: 22 },
      { base: 'USP-S | Blueprint',           rarity: 'restricted', bw: 22 },
      { base: 'P250 | Asiimov',              rarity: 'milspec',    bw: 90 },
      { base: 'FAMAS | Commemoration',       rarity: 'milspec',    bw: 90 },
    ],
  },

  // ────────────────────────────────────────────────────
  // 9. KNIFE VAULT  (~R$300-800)
  // ────────────────────────────────────────────────────
  {
    name: 'Knife Vault',
    slug: 'knife-vault',
    category: 'knives',
    targetMargin: 0.12,
    skins: [
      { base: '★ Karambit | Doppler',        rarity: 'extraordinary', bw: 3  },
      { base: '★ M9 Bayonet | Fade',         rarity: 'extraordinary', bw: 4  },
      { base: '★ Butterfly Knife | Marble Fade', rarity: 'extraordinary', bw: 5  },
      { base: '★ Bayonet | Tiger Tooth',     rarity: 'extraordinary', bw: 8  },
      { base: '★ Flip Knife | Marble Fade',  rarity: 'extraordinary', bw: 10 },
      { base: '★ Gut Knife | Tiger Tooth',   rarity: 'extraordinary', bw: 18 },
      { base: '★ Bowie Knife | Doppler',     rarity: 'extraordinary', bw: 25 },
      { base: '★ Shadow Daggers | Doppler',  rarity: 'extraordinary', bw: 35 },
      { base: '★ Navaja Knife | Doppler',    rarity: 'extraordinary', bw: 40 },
    ],
  },

  // ────────────────────────────────────────────────────
  // 10. ULTRA PREMIUM  (~R$500-2000)
  // ────────────────────────────────────────────────────
  {
    name: 'Ultra Premium',
    slug: 'ultra-premium',
    category: 'premium',
    targetMargin: 0.10,
    skins: [
      { base: 'AWP | Dragon Lore',           rarity: 'covert',     bw: 1  },
      { base: 'AK-47 | Wild Lotus',          rarity: 'covert',     bw: 1  },
      { base: '★ Karambit | Doppler',        rarity: 'extraordinary', bw: 2  },
      { base: '★ M9 Bayonet | Fade',         rarity: 'extraordinary', bw: 2  },
      { base: 'M4A1-S | Knight',             rarity: 'classified', bw: 6  },
      { base: 'AWP | Fade',                  rarity: 'classified', bw: 6  },
      { base: 'AK-47 | Vulcan',              rarity: 'classified', bw: 6  },
      { base: 'M4A4 | Desolate Space',       rarity: 'classified', bw: 6  },
      { base: 'M4A4 | Neo-Noir',             rarity: 'restricted', bw: 25 },
      { base: 'AK-47 | Bloodsport',          rarity: 'classified', bw: 6  },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase()
    .replace(/[★\s]+/g, '-')
    .replace(/[|]/g, '')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function roundNice(v) {
  // Arredonda para terminações .90 como os preços atuais
  const r = Math.ceil(v / 100) * 100;
  return r - 10;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Buscar Waxpeer
  console.log('[waxpeer] Buscando preços...');
  const wRes  = await fetch(WAXPEER_URL, {
    signal: AbortSignal.timeout(30000),
    headers: { 'User-Agent': 'tradexGG/1.0' },
  });
  const wData = await wRes.json();
  if (!wData.success) throw new Error('Waxpeer falhou');

  // 2. Taxa de câmbio USD → BRL
  const fxRes  = await fetch(FX_URL, { signal: AbortSignal.timeout(8000) });
  const fxData = await fxRes.json();
  const usdBrl = fxData.rates.BRL;
  console.log(`[fx] USD/BRL = ${usdBrl.toFixed(4)} | ${wData.items.length} itens no Waxpeer\n`);

  // 3. Montar mapa: hashName → { price (centavos BRL), img }
  const waxMap = {};
  for (const item of wData.items) {
    if (!item.name || !item.steam_price) continue;
    waxMap[item.name] = {
      price: Math.round(item.steam_price * usdBrl / 10),
      img:   item.img || '',
    };
  }

  if (DRY_RUN) {
    console.log('[dry-run] Modo simulação ativo — nada será salvo.\n');
  }

  const client = await pool.connect();

  try {
    if (!DRY_RUN) {
      // 4. Limpar tudo
      await client.query('BEGIN');
      await client.query('TRUNCATE case_skins, openings, transactions RESTART IDENTITY CASCADE');
      await client.query('DELETE FROM cases');
      await client.query('DELETE FROM skins');
      await client.query("SELECT setval('cases_id_seq', 1, false)");
      await client.query("SELECT setval('skins_id_seq', 1, false)");
      await client.query('COMMIT');
      console.log('[db] Banco limpo.\n');
    }

    let totalCases = 0;
    let totalSkins = 0;
    const caseResults = [];

    // 5. Processar cada case
    for (const def of CASE_DEFS) {
      console.log(`\n${'═'.repeat(60)}`);
      console.log(`  ${def.name.toUpperCase()} (${def.category})`);
      console.log('─'.repeat(60));

      const caseSkins = []; // { skinId, weight, price }

      for (const skinDef of def.skins) {
        const [weaponPart, skinNamePart] = skinDef.base.split(' | ');
        const weapon   = weaponPart.trim();
        const skinName = skinNamePart?.trim() || '';
        const color    = RARITY_COLOR[skinDef.rarity] || '#b0c3d9';

        // Encontrar todos os desgastes disponíveis no Waxpeer
        const found = [];
        for (const [wearLabel, wearCode] of Object.entries(WEAR_LABELS)) {
          const hashName = `${skinDef.base} (${wearLabel})`;
          if (waxMap[hashName]) {
            found.push({
              wearCode,
              wearFull: WEAR_FULL[wearCode],
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

        console.log(`  ✓  ${skinDef.base} → ${found.length} desgastes`);

        // Inserir cada wear no banco
        for (const w of found) {
          const fullName = `${skinDef.base.replace(/★\s*/g, '').trim()} (${w.wearCode})`;
          const imgSlug  = slugify(w.hashName.replace(/★\s*/g, ''));
          const imageUrl = w.img.startsWith('http')
            ? w.img
            : `${CDN_BASE}730-${imgSlug}.webp`;

          const weight = Math.max(1, skinDef.bw * WEAR_DIST[w.wearCode]);

          if (!DRY_RUN) {
            // Inserir skin (banco foi limpo no início)
            const res = await client.query(
              `INSERT INTO skins
                (name, weapon, skin_name, wear, rarity, rarity_color, image_url,
                 market_price, site_price, price_updated_at, market_hash_name)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,NOW(),$9)
               RETURNING id`,
              [
                fullName, weapon, skinName, w.wearCode,
                skinDef.rarity, color, imageUrl,
                w.price, w.hashName,
              ]
            );
            const skinId = res.rows[0].id;
            caseSkins.push({ skinId, weight, price: w.price });
            totalSkins++;
          } else {
            // dry-run: apenas estima o preço
            caseSkins.push({ skinId: null, weight, price: w.price });
            console.log(`       ${w.wearCode}: R$${(w.price / 100).toFixed(2)}  peso=${weight}`);
          }
        }
      }

      if (caseSkins.length === 0) {
        console.log('  ✗  Nenhuma skin encontrada, case ignorada.');
        continue;
      }

      // 6. Calcular EV e preço da case
      const totalWeight = caseSkins.reduce((s, x) => s + x.weight, 0);
      const ev = caseSkins.reduce((s, x) => s + (x.weight / totalWeight) * x.price, 0);
      const rawPrice   = ev / (1 - def.targetMargin);
      const casePrice  = roundNice(rawPrice);
      const margin     = (1 - ev / casePrice) * 100;

      console.log(`\n  EV     = R$${(ev / 100).toFixed(2)}`);
      console.log(`  Preço  = R$${(casePrice / 100).toFixed(2)}  (margem ${margin.toFixed(1)}%)`);
      console.log(`  Skins  = ${caseSkins.length} variantes`);

      if (!DRY_RUN) {
        // 7. Inserir case
        const caseRes = await client.query(
          `INSERT INTO cases (name, slug, image_url, price, category)
           VALUES ($1, $2, 'GENERATED', $3, $4)
           RETURNING id`,
          [def.name, def.slug, casePrice, def.category]
        );
        const caseId = caseRes.rows[0].id;

        // 8. Inserir case_skins
        for (const cs of caseSkins) {
          await client.query(
            'INSERT INTO case_skins (case_id, skin_id, weight) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
            [caseId, cs.skinId, cs.weight]
          );
        }

        caseResults.push({ name: def.name, price: casePrice, skins: caseSkins.length, margin });
        totalCases++;
      } else {
        caseResults.push({ name: def.name, price: casePrice, skins: caseSkins.length, margin });
      }
    }

    // 9. Resumo final
    console.log(`\n${'═'.repeat(60)}`);
    console.log('RESUMO\n');
    console.log('Case'.padEnd(22) + 'Preço'.padEnd(16) + 'Skins'.padEnd(8) + 'Margem');
    console.log('─'.repeat(54));
    for (const r of caseResults) {
      console.log(
        r.name.padEnd(22) +
        `R$${(r.price / 100).toFixed(2)}`.padEnd(16) +
        String(r.skins).padEnd(8) +
        `${r.margin.toFixed(1)}%`
      );
    }
    console.log('─'.repeat(54));
    if (!DRY_RUN) {
      console.log(`\n✔  ${totalCases} cases criadas | ${totalSkins} skins inseridas`);
    } else {
      console.log('\n[dry-run] Nada foi salvo.');
    }

  } catch (err) {
    if (!DRY_RUN) await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }

  await pool.end();
}

main().catch(err => {
  console.error('\n[ERRO]', err.message);
  process.exit(1);
});
