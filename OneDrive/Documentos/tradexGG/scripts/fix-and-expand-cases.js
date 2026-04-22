#!/usr/bin/env node
/**
 * fix-and-expand-cases.js
 *
 * 1. Corrige categorias erradas das cases existentes
 * 2. Remove skins do tipo errado das cases (ex: AWP em case de fuzil)
 * 3. Adiciona 7 novas cases bem categorizadas
 *
 * Uso:
 *   node scripts/fix-and-expand-cases.js            (executa)
 *   node scripts/fix-and-expand-cases.js --dry-run  (simula)
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
  'Factory New':    'FN', 'Minimal Wear':   'MW', 'Field-Tested':   'FT',
  'Well-Worn':      'WW', 'Battle-Scarred': 'BS',
};
const WEAR_FULL = {
  FN: 'Factory New', MW: 'Minimal Wear', FT: 'Field-Tested',
  WW: 'Well-Worn',   BS: 'Battle-Scarred',
};
const RARITY_COLOR = {
  extraordinary: '#e4ae39', covert: '#eb4b4b', classified: '#d32ce6',
  restricted: '#8847ff',    milspec: '#4b69ff', industrial: '#5e98d9',
  consumer: '#b0c3d9',
};

// ─────────────────────────────────────────────────────────────────────────────
// Correções nas cases existentes
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_FIXES = [
  // Fire Serpent tem AK-47 Fire Serpent + AWP Medusa + M4A4 → case mista → premium
  { slug: 'fire-serpent',    newCategory: 'premium' },
  // Sniper Starter tinha Galil AR e Negev como floor → será corrigido abaixo
  // Silver Pack tem skins mistas (AK-47 + USP-S + P250) → premium
  { slug: 'silver-pack',     newCategory: 'premium' },
];

// Skins a remover de cases específicas (por slug da case + arma da skin)
const SKIN_REMOVALS = [
  // Starter Pack (rifles) NÃO deve ter AWP
  { caseSlug: 'starter-pack',    removeWeapons: ['AWP'] },
  // Sniper Starter (snipers) NÃO deve ter Galil AR, Negev (rifles baratos de enchimento)
  { caseSlug: 'sniper-starter',  removeWeapons: ['Galil AR', 'Negev'] },
];

// ─────────────────────────────────────────────────────────────────────────────
// Novas cases (7)
// ─────────────────────────────────────────────────────────────────────────────
const NEW_CASES = [

  // ── RIFLES ─────────────────────────────────────────────────────────────────

  {
    name: 'AK-47 Box',
    slug: 'ak47-box',
    category: 'rifles',
    targetMargin: 0.12,
    skins: [
      { base: 'AK-47 | Wild Lotus',          rarity: 'covert',     bw: 1   },
      { base: 'AK-47 | Gold Arabesque',      rarity: 'covert',     bw: 1   },
      { base: 'AK-47 | Vulcan',              rarity: 'classified', bw: 5   },
      { base: 'AK-47 | Bloodsport',          rarity: 'classified', bw: 5   },
      { base: 'AK-47 | Neon Rider',          rarity: 'classified', bw: 5   },
      { base: 'AK-47 | Redline',             rarity: 'classified', bw: 5   },
      { base: 'AK-47 | Phantom Disruptor',   rarity: 'restricted', bw: 22  },
      { base: 'AK-47 | Point Disarray',      rarity: 'restricted', bw: 22  },
      { base: 'AK-47 | Frontside Misty',     rarity: 'milspec',    bw: 90  },
      { base: 'AK-47 | Safari Mesh',         rarity: 'industrial', bw: 360 },
    ],
  },

  {
    name: 'M4 Box',
    slug: 'm4-box',
    category: 'rifles',
    targetMargin: 0.12,
    skins: [
      { base: 'M4A1-S | Knight',             rarity: 'classified', bw: 4   },
      { base: 'M4A1-S | Blue Phosphor',      rarity: 'classified', bw: 4   },
      { base: 'M4A4 | Desolate Space',       rarity: 'classified', bw: 4   },
      { base: 'M4A4 | Royal Paladin',        rarity: 'classified', bw: 4   },
      { base: 'M4A4 | Neo-Noir',             rarity: 'restricted', bw: 18  },
      { base: 'M4A1-S | Mecha Industries',   rarity: 'restricted', bw: 18  },
      { base: 'M4A4 | Buzz Kill',            rarity: 'restricted', bw: 18  },
      { base: 'M4A4 | In Living Color',      rarity: 'milspec',    bw: 80  },
      { base: 'FAMAS | Commemoration',       rarity: 'milspec',    bw: 80  },
      { base: 'M4A1-S | Boreal Forest',      rarity: 'industrial', bw: 350 },
    ],
  },

  {
    name: 'SMG Rush',
    slug: 'smg-rush',
    category: 'rifles',
    targetMargin: 0.12,
    skins: [
      { base: 'MP9 | Wild Lily',             rarity: 'restricted', bw: 8,  wears: ['FN','MW'] },
      { base: 'MP7 | Fade',                  rarity: 'milspec',    bw: 40  },
      { base: 'UMP-45 | Primal Saber',       rarity: 'milspec',    bw: 60  },
      { base: 'MAC-10 | Candy Apple',        rarity: 'milspec',    bw: 80  },
      { base: 'MP5-SD | Phosphor',           rarity: 'milspec',    bw: 80  },
      { base: 'PP-Bizon | Sand Dashed',      rarity: 'consumer',   bw: 300 },
      { base: 'Negev | Army Sheen',          rarity: 'industrial', bw: 250 },
    ],
  },

  // ── SNIPERS ────────────────────────────────────────────────────────────────

  {
    name: 'AWP Dreams',
    slug: 'awp-dreams',
    category: 'snipers',
    targetMargin: 0.12,
    skins: [
      { base: 'AWP | Dragon Lore',           rarity: 'covert',     bw: 1   },
      { base: 'AWP | Medusa',                rarity: 'classified', bw: 5   },
      { base: 'AWP | Hyper Beast',           rarity: 'classified', bw: 5   },
      { base: 'AWP | Electric Hive',         rarity: 'classified', bw: 5   },
      { base: 'AWP | Fade',                  rarity: 'classified', bw: 4   },
      { base: 'SSG 08 | Blood in the Water', rarity: 'classified', bw: 5   },
      { base: 'AWP | Asiimov',               rarity: 'restricted', bw: 22  },
      { base: 'G3SG1 | Flux',               rarity: 'restricted', bw: 22  },
      { base: 'Nova | Hyper Beast',          rarity: 'milspec',    bw: 90  },
    ],
  },

  // ── PISTOLS ────────────────────────────────────────────────────────────────

  {
    name: 'Pistol Legend',
    slug: 'pistol-legend',
    category: 'pistols',
    targetMargin: 0.12,
    skins: [
      { base: 'Desert Eagle | Blaze',        rarity: 'classified', bw: 3   },
      { base: 'Glock-18 | Fade',             rarity: 'classified', bw: 3   },
      { base: 'USP-S | Orion',               rarity: 'classified', bw: 4   },
      { base: 'Desert Eagle | Kumicho Dragon',rarity: 'restricted', bw: 15  },
      { base: 'Glock-18 | Water Elemental',  rarity: 'restricted', bw: 15  },
      { base: 'USP-S | Blueprint',           rarity: 'restricted', bw: 15  },
      { base: 'P250 | Asiimov',              rarity: 'milspec',    bw: 60  },
      { base: 'Tec-9 | Fuel Injector',       rarity: 'milspec',    bw: 60  },
      { base: 'Five-SeveN | Monkey Business',rarity: 'milspec',    bw: 60  },
      { base: 'P250 | Franklin',             rarity: 'milspec',    bw: 80  },
    ],
  },

  // ── KNIVES ─────────────────────────────────────────────────────────────────

  {
    name: 'Budget Knife Box',
    slug: 'budget-knife-box',
    category: 'knives',
    targetMargin: 0.12,
    skins: [
      { base: '★ Gut Knife | Tiger Tooth',       rarity: 'extraordinary', bw: 5,  wears: ['FN','MW'] },
      { base: '★ Bowie Knife | Doppler',         rarity: 'extraordinary', bw: 8,  wears: ['FN','MW'] },
      { base: '★ Shadow Daggers | Doppler',      rarity: 'extraordinary', bw: 12, wears: ['FN','MW'] },
      { base: '★ Navaja Knife | Doppler',        rarity: 'extraordinary', bw: 15, wears: ['FN','MW'] },
      { base: '★ Paracord Knife | Doppler',      rarity: 'extraordinary', bw: 18, wears: ['FN','MW'] },
      { base: '★ Survival Knife | Doppler',      rarity: 'extraordinary', bw: 18, wears: ['FN','MW'] },
      { base: '★ Nomad Knife | Doppler',         rarity: 'extraordinary', bw: 20, wears: ['FN','MW'] },
      { base: '★ Ursus Knife | Doppler',         rarity: 'extraordinary', bw: 20, wears: ['FN','MW'] },
      { base: '★ Talon Knife | Tiger Tooth',     rarity: 'extraordinary', bw: 22, wears: ['FN','MW'] },
      { base: '★ Skeleton Knife | Tiger Tooth',  rarity: 'extraordinary', bw: 22, wears: ['FN','MW'] },
      { base: '★ Stiletto Knife | Tiger Tooth',  rarity: 'extraordinary', bw: 25, wears: ['FN','MW'] },
      { base: '★ Huntsman Knife | Tiger Tooth',  rarity: 'extraordinary', bw: 30, wears: ['FN','MW'] },
      { base: '★ Falchion Knife | Tiger Tooth',  rarity: 'extraordinary', bw: 35, wears: ['FN','MW'] },
    ],
  },

  // ── PREMIUM ────────────────────────────────────────────────────────────────

  {
    name: 'Mythic Box',
    slug: 'mythic-box',
    category: 'premium',
    targetMargin: 0.10,
    skins: [
      { base: 'AWP | Dragon Lore',           rarity: 'covert',        bw: 1  },
      { base: 'AK-47 | Wild Lotus',          rarity: 'covert',        bw: 1  },
      { base: 'AK-47 | Gold Arabesque',      rarity: 'covert',        bw: 1  },
      { base: '★ Karambit | Doppler',        rarity: 'extraordinary', bw: 2  },
      { base: '★ M9 Bayonet | Fade',         rarity: 'extraordinary', bw: 2  },
      { base: 'AWP | Medusa',                rarity: 'classified',    bw: 6  },
      { base: 'M4A1-S | Knight',             rarity: 'classified',    bw: 6  },
      { base: 'AK-47 | Vulcan',              rarity: 'classified',    bw: 6  },
      { base: 'AWP | Fade',                  rarity: 'classified',    bw: 6  },
      { base: 'AK-47 | Bloodsport',          rarity: 'classified',    bw: 6  },
      { base: 'M4A4 | Desolate Space',       rarity: 'classified',    bw: 6  },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase()
    .replace(/[★\s]+/g, '-').replace(/[|]/g, '')
    .replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
function roundNice(v) {
  const r = Math.ceil(v / 100) * 100;
  return r - 10;
}
async function recalcAndUpdatePrice(client, caseSlug, margin = 0.12) {
  const { rows } = await client.query(`
    SELECT cs.weight, COALESCE(s.site_price, s.market_price) AS price
    FROM case_skins cs
    JOIN skins s ON s.id = cs.skin_id
    JOIN cases c ON c.id = cs.case_id
    WHERE c.slug = $1
  `, [caseSlug]);
  if (rows.length === 0) return null;
  const totalW   = rows.reduce((s, x) => s + Number(x.weight), 0);
  const ev       = rows.reduce((s, x) => s + (Number(x.weight) / totalW) * Number(x.price), 0);
  const newPrice = roundNice(ev / (1 - margin));
  await client.query('UPDATE cases SET price=$1 WHERE slug=$2', [newPrice, caseSlug]);
  return { ev, newPrice };
}

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('[waxpeer] Buscando preços...');
  const wRes  = await fetch(WAXPEER_URL, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'tradexGG/1.0' } });
  const wData = await wRes.json();
  if (!wData.success) throw new Error('Waxpeer falhou');

  const fxRes  = await fetch(FX_URL, { signal: AbortSignal.timeout(8000) });
  const fxData = await fxRes.json();
  const usdBrl = fxData.rates.BRL;
  console.log(`[fx] USD/BRL = ${usdBrl.toFixed(4)} | ${wData.items.length} itens\n`);

  const waxMap = {};
  for (const item of wData.items) {
    if (!item.name || !item.steam_price) continue;
    waxMap[item.name] = {
      price: Math.round(item.steam_price * usdBrl / 10),
      img:   item.img || '',
    };
  }

  if (DRY_RUN) console.log('[dry-run] Simulação — nada será salvo.\n');

  const client = await pool.connect();

  try {
    // ── Fase 1: Corrigir categorias ──────────────────────────────────────────
    console.log('━━━ FASE 1: Corrigindo categorias ━━━\n');
    for (const fix of CATEGORY_FIXES) {
      const { rows } = await client.query('SELECT id, category FROM cases WHERE slug=$1', [fix.slug]);
      if (rows.length === 0) { console.log(`  ✗ Não encontrada: ${fix.slug}`); continue; }
      const old = rows[0].category;
      if (old === fix.newCategory) { console.log(`  ✓ ${fix.slug}: já é "${fix.newCategory}"`); continue; }
      console.log(`  ✎ ${fix.slug}: "${old}" → "${fix.newCategory}"`);
      if (!DRY_RUN) await client.query('UPDATE cases SET category=$1 WHERE slug=$2', [fix.newCategory, fix.slug]);
    }

    // ── Fase 2: Remover skins erradas ─────────────────────────────────────────
    console.log('\n━━━ FASE 2: Removendo skins erradas ━━━\n');
    for (const removal of SKIN_REMOVALS) {
      const caseRow = await client.query('SELECT id, name FROM cases WHERE slug=$1', [removal.caseSlug]);
      if (caseRow.rows.length === 0) { console.log(`  ✗ Case não encontrada: ${removal.caseSlug}`); continue; }
      const caseId = caseRow.rows[0].id;

      for (const weapon of removal.removeWeapons) {
        const check = await client.query(`
          SELECT cs.id, s.name FROM case_skins cs
          JOIN skins s ON s.id = cs.skin_id
          WHERE cs.case_id=$1 AND s.weapon=$2`, [caseId, weapon]);

        if (check.rows.length === 0) {
          console.log(`  ✓ "${caseRow.rows[0].name}" já não tem ${weapon}`);
          continue;
        }
        console.log(`  ✂  "${caseRow.rows[0].name}" — removendo ${check.rows.length} skins de ${weapon}:`);
        check.rows.forEach(r => console.log(`       - ${r.name}`));
        if (!DRY_RUN) {
          await client.query(`
            DELETE FROM case_skins WHERE case_id=$1
            AND skin_id IN (SELECT id FROM skins WHERE weapon=$2)`, [caseId, weapon]);
        }
      }

      if (!DRY_RUN) {
        const result = await recalcAndUpdatePrice(client, removal.caseSlug);
        if (result) {
          console.log(`  ↻  Preço recalculado: EV R$${(result.ev/100).toFixed(2)} → novo preço R$${(result.newPrice/100).toFixed(2)}`);
        }
      }
    }

    // ── Fase 3: Adicionar novas cases ─────────────────────────────────────────
    console.log('\n━━━ FASE 3: Adicionando novas cases ━━━');
    let totalCases = 0, totalSkins = 0;
    const summary = [];

    for (const def of NEW_CASES) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`  ${def.name.toUpperCase()} [${def.category}]`);
      console.log('─'.repeat(60));

      const existing = await client.query('SELECT id FROM cases WHERE slug=$1', [def.slug]);
      if (existing.rows.length > 0) {
        console.log('  ↷  Já existe — pulando.');
        continue;
      }

      const caseSkins = [];

      for (const skinDef of def.skins) {
        const [weapon, skinName] = skinDef.base.split(' | ').map(s => s.trim());
        const color = RARITY_COLOR[skinDef.rarity] || '#b0c3d9';
        const allowedWears = skinDef.wears ? new Set(skinDef.wears) : new Set(['FN','MW','FT','WW','BS']);

        const found = [];
        for (const [label, code] of Object.entries(WEAR_LABELS)) {
          if (!allowedWears.has(code)) continue;
          const hashName = `${skinDef.base} (${label})`;
          if (waxMap[hashName]) found.push({ code, hashName, price: waxMap[hashName].price, img: waxMap[hashName].img });
        }

        if (found.length === 0) { console.log(`  ⚠  NÃO ENCONTRADO: ${skinDef.base}`); continue; }
        console.log(`  ✓  ${skinDef.base} → ${found.length} desgaste(s)`);

        for (const w of found) {
          const fullName = `${skinDef.base.replace(/★\s*/g,'').trim()} (${w.code})`;
          const imgSlug  = slugify(w.hashName.replace(/★\s*/g,''));
          const imageUrl = w.img.startsWith('http') ? w.img : `${CDN_BASE}730-${imgSlug}.webp`;
          const weight   = Math.max(1, skinDef.bw * WEAR_DIST[w.code]);

          if (!DRY_RUN) {
            const ex = await client.query('SELECT id FROM skins WHERE market_hash_name=$1', [w.hashName]);
            let skinId;
            if (ex.rows.length > 0) {
              skinId = ex.rows[0].id;
              await client.query(
                'UPDATE skins SET site_price=$1, market_price=$1, price_updated_at=NOW() WHERE id=$2',
                [w.price, skinId]
              );
            } else {
              const ins = await client.query(
                `INSERT INTO skins (name,weapon,skin_name,wear,rarity,rarity_color,image_url,market_price,site_price,price_updated_at,market_hash_name)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,NOW(),$9) RETURNING id`,
                [fullName, weapon, skinName||'', w.code, skinDef.rarity, color, imageUrl, w.price, w.hashName]
              );
              skinId = ins.rows[0].id;
              totalSkins++;
            }
            caseSkins.push({ skinId, weight, price: w.price });
          } else {
            caseSkins.push({ skinId: null, weight, price: w.price });
          }
        }
      }

      if (caseSkins.length === 0) { console.log('  ✗  Nenhuma skin — case ignorada.'); continue; }

      const totalW   = caseSkins.reduce((s, x) => s + x.weight, 0);
      const ev       = caseSkins.reduce((s, x) => s + (x.weight / totalW) * x.price, 0);
      const casePrice = roundNice(ev / (1 - def.targetMargin));
      const margin   = (1 - ev / casePrice) * 100;

      console.log(`\n  EV = R$${(ev/100).toFixed(2)} | Preço = R$${(casePrice/100).toFixed(2)} | Margem = ${margin.toFixed(1)}% | Skins = ${caseSkins.length}`);

      if (!DRY_RUN) {
        const caseRes = await client.query(
          `INSERT INTO cases (name,slug,image_url,price,category) VALUES ($1,$2,'GENERATED',$3,$4) RETURNING id`,
          [def.name, def.slug, casePrice, def.category]
        );
        const caseId = caseRes.rows[0].id;
        for (const cs of caseSkins)
          await client.query('INSERT INTO case_skins (case_id,skin_id,weight) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [caseId, cs.skinId, cs.weight]);
        totalCases++;
      }
      summary.push({ name: def.name, category: def.category, price: casePrice, skins: caseSkins.length, margin });
    }

    // ── Resumo ────────────────────────────────────────────────────────────────
    console.log(`\n${'━'.repeat(60)}`);
    console.log('RESUMO — NOVAS CASES\n');
    console.log('Case'.padEnd(22) + 'Categoria'.padEnd(12) + 'Preço'.padEnd(14) + 'Skins'.padEnd(7) + 'Margem');
    console.log('─'.repeat(60));
    for (const r of summary) {
      console.log(
        r.name.padEnd(22) + r.category.padEnd(12) +
        `R$${(r.price/100).toFixed(2)}`.padEnd(14) +
        String(r.skins).padEnd(7) + `${r.margin.toFixed(1)}%`
      );
    }
    if (!DRY_RUN) console.log(`\n✔  ${totalCases} novas cases | ${totalSkins} novas skins`);
    else          console.log('\n[dry-run] Nada foi salvo.');

  } finally {
    client.release();
  }
  await pool.end();
}

main().catch(err => { console.error('\n[ERRO]', err.message); process.exit(1); });
