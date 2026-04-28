#!/usr/bin/env node
/**
 * add-hellcase-style.js
 *
 * Adiciona cases no estilo hellcase.com:
 * skins BONITAS e COLORIDAS (anime, tech, neon) em desgastes WW/BS
 * para manter preço baixo mas com aparência premium.
 *
 * Coleções usadas: Revolution, Dreams & Nightmares, Recoil, Kilowatt, Fracture
 *
 * Uso: node scripts/add-hellcase-style.js [--dry-run]
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
const RARITY_COLOR = {
  extraordinary: '#e4ae39', covert: '#eb4b4b', classified: '#d32ce6',
  restricted: '#8847ff',    milspec: '#4b69ff', industrial: '#5e98d9',
  consumer: '#b0c3d9',
};

// ═══════════════════════════════════════════════════════════════════════════
// CASES NO ESTILO HELLCASE
// Cada case é temática e usa skins bonitas de coleções recentes.
// wears: restringe desgastes para manter preço baixo mas visual bonito.
// ═══════════════════════════════════════════════════════════════════════════
const HELLCASE_CASES = [

  // ──────────────────────────────────────────────────────────────────────
  // 1. COLOR BURST  — skins MIL-SPEC coloridas em BS/WW (case mais barata)
  //    Objetivo: R$8–R$20 | Skins bonitas e baratas
  // ──────────────────────────────────────────────────────────────────────
  {
    name: 'Color Burst',
    slug: 'color-burst',
    category: 'rifles',
    targetMargin: 0.12,
    skins: [
      // Mil-spec coloridas de várias coleções — desgaste pior = preço baixo
      { base: 'P250 | Visions',             rarity: 'milspec',    bw: 120, wears: ['FT','WW','BS'] },
      { base: 'SSG 08 | Parallax',          rarity: 'milspec',    bw: 100, wears: ['FT','WW','BS'] },
      { base: 'Five-SeveN | Hybrid',        rarity: 'milspec',    bw: 100, wears: ['FT','WW','BS'] },
      { base: 'Negev | Hex',               rarity: 'milspec',    bw: 120, wears: ['FT','WW','BS'] },
      { base: 'MP9 | Starlight Protector',  rarity: 'milspec',    bw: 100, wears: ['FT','WW','BS'] },
      { base: 'M4A1-S | Emphorosaur-S',    rarity: 'milspec',    bw: 100, wears: ['FT','WW','BS'] },
      { base: 'MP9 | Featherweight',        rarity: 'milspec',    bw: 100, wears: ['FT','WW','BS'] },
      { base: 'SG 553 | Cyberforce',        rarity: 'milspec',    bw: 100, wears: ['FT','WW','BS'] },
      { base: 'MAC-10 | Monkeyflage',       rarity: 'milspec',    bw: 100, wears: ['FT','WW','BS'] },
      { base: 'UMP-45 | Momentum',          rarity: 'milspec',    bw: 80,  wears: ['FT','WW','BS'] },
      { base: 'Glock-18 | Off World',       rarity: 'milspec',    bw: 80,  wears: ['FT','WW','BS'] },
      // Jackpot pequeno: restricted em BS
      { base: 'USP-S | Caiman',             rarity: 'restricted', bw: 12,  wears: ['WW','BS'] },
      { base: 'FAMAS | Wraith',             rarity: 'restricted', bw: 12,  wears: ['WW','BS'] },
      { base: 'MP5-SD | Lab Rats',          rarity: 'restricted', bw: 10,  wears: ['WW','BS'] },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // 2. DREAMS & NIGHTMARES  — skins escuras, neon e mágicas
  //    Objetivo: R$30–R$80
  // ──────────────────────────────────────────────────────────────────────
  {
    name: 'Dreams & Nightmares',
    slug: 'dreams-nightmares',
    category: 'premium',
    targetMargin: 0.12,
    skins: [
      // Jackpots (Classified)
      { base: 'AK-47 | Nightwish',          rarity: 'classified', bw: 4  },
      { base: 'M4A1-S | Night Terror',      rarity: 'classified', bw: 4  },
      { base: 'Glock-18 | Dreamflier',      rarity: 'classified', bw: 4  },
      // Mid (Restricted)
      { base: 'P90 | Vividly Vivid',        rarity: 'restricted', bw: 18 },
      { base: 'FAMAS | Wraith',             rarity: 'restricted', bw: 18 },
      { base: 'AUG | Stymphalian',          rarity: 'restricted', bw: 18 },
      { base: 'MP9 | Starlight Protector',  rarity: 'milspec',    bw: 20 },
      // Floor (Mil-spec)
      { base: 'UMP-45 | Momentum',          rarity: 'milspec',    bw: 80 },
      { base: 'MAC-10 | Pipe Down',         rarity: 'milspec',    bw: 80 },
      { base: 'Tec-9 | Rebel',              rarity: 'milspec',    bw: 80 },
      { base: 'P250 | Visions',             rarity: 'milspec',    bw: 80 },
      { base: 'Negev | Hex',               rarity: 'milspec',    bw: 80 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // 3. REVOLUTION PACK  — skins anime coloridas
  //    Objetivo: R$30–R$80
  // ──────────────────────────────────────────────────────────────────────
  {
    name: 'Revolution Pack',
    slug: 'revolution-pack',
    category: 'rifles',
    targetMargin: 0.12,
    skins: [
      // Jackpots raros
      { base: 'MAC-10 | Sakkaku',           rarity: 'classified', bw: 4  },
      { base: 'AWP | Duality',              rarity: 'classified', bw: 4  },
      { base: 'P90 | Neoqueen',             rarity: 'classified', bw: 4  },
      // Mid
      { base: 'Glock-18 | Umbral Rabbit',   rarity: 'restricted', bw: 18 },
      { base: 'SCAR-20 | Fragments',        rarity: 'restricted', bw: 18 },
      { base: 'MP5-SD | Liquidation',       rarity: 'restricted', bw: 18 },
      { base: 'AUG | Momentum',             rarity: 'restricted', bw: 18 },
      // Floor colorido (Mil-spec)
      { base: 'MP9 | Featherweight',        rarity: 'milspec',    bw: 80 },
      { base: 'SG 553 | Cyberforce',        rarity: 'milspec',    bw: 80 },
      { base: 'M4A1-S | Emphorosaur-S',    rarity: 'milspec',    bw: 80 },
      { base: 'MAC-10 | Monkeyflage',       rarity: 'milspec',    bw: 80 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // 4. RECOIL PACK  — skins tech/cyber do Recoil Case
  //    Objetivo: R$50–R$100
  // ──────────────────────────────────────────────────────────────────────
  {
    name: 'Recoil Pack',
    slug: 'recoil-pack',
    category: 'rifles',
    targetMargin: 0.12,
    skins: [
      // Jackpot (Covert)
      { base: 'AK-47 | Calm',               rarity: 'covert',     bw: 1  },
      // Classified
      { base: 'Glock-18 | Bullet Queen',    rarity: 'classified', bw: 5  },
      { base: 'M4A1-S | Restless',          rarity: 'classified', bw: 5  },
      { base: 'Desert Eagle | Trigger Discipline', rarity: 'classified', bw: 5 },
      // Restricted coloridas
      { base: 'USP-S | Caiman',             rarity: 'restricted', bw: 22 },
      { base: 'MP5-SD | Lab Rats',          rarity: 'restricted', bw: 22 },
      { base: 'P250 | Visions',             rarity: 'milspec',    bw: 80 },
      { base: 'Five-SeveN | Hybrid',        rarity: 'milspec',    bw: 80 },
      { base: 'SSG 08 | Parallax',          rarity: 'milspec',    bw: 80 },
      { base: 'Negev | Hex',               rarity: 'milspec',    bw: 80 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // 5. KILOWATT PACK  — skins do Kilowatt Case (2024)
  //    Objetivo: R$100–R$250
  // ──────────────────────────────────────────────────────────────────────
  {
    name: 'Kilowatt Pack',
    slug: 'kilowatt-pack',
    category: 'rifles',
    targetMargin: 0.12,
    skins: [
      // Jackpot raro
      { base: 'AK-47 | Inheritance',        rarity: 'covert',     bw: 1  },
      // Classified
      { base: 'M4A1-S | Black Lotus',       rarity: 'classified', bw: 5  },
      { base: 'UMP-45 | Wild Child',        rarity: 'classified', bw: 5  },
      // Restricted
      { base: 'Desert Eagle | Mecha Industries', rarity: 'restricted', bw: 22 },
      { base: 'AWP | Chrome Cannon',        rarity: 'restricted', bw: 20 },
      { base: 'XM1014 | Irezumi',           rarity: 'restricted', bw: 22 },
      { base: 'Glock-18 | Umbral Rabbit',   rarity: 'restricted', bw: 20 },
      { base: 'AUG | Death by Puppy',       rarity: 'restricted', bw: 20 },
      // Mil-spec
      { base: 'MP9 | Featherweight',        rarity: 'milspec',    bw: 80 },
      { base: 'Five-SeveN | Angry Mob',     rarity: 'milspec',    bw: 80 },
      { base: 'P250 | Visions',             rarity: 'milspec',    bw: 80 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // 6. FRACTURE PACK  — skins do Fracture Case, Printstream etc
  //    Objetivo: R$80–R$200
  // ──────────────────────────────────────────────────────────────────────
  {
    name: 'Fracture Pack',
    slug: 'fracture-pack',
    category: 'rifles',
    targetMargin: 0.12,
    skins: [
      // Jackpots lindos
      { base: 'Desert Eagle | Printstream',  rarity: 'classified', bw: 4  },
      { base: 'AK-47 | Legion of Anubis',   rarity: 'classified', bw: 4  },
      { base: 'AK-47 | Magnet',             rarity: 'classified', bw: 4  },
      // Restricted coloridas
      { base: 'Glock-18 | Warhawk',         rarity: 'restricted', bw: 18 },
      { base: 'AUG | Death by Puppy',       rarity: 'restricted', bw: 18 },
      { base: 'P90 | Run and Hide',         rarity: 'restricted', bw: 18 },
      { base: 'R8 Revolver | Crimson Web',  rarity: 'restricted', bw: 18 },
      { base: 'CZ75-Auto | Circaetus',      rarity: 'restricted', bw: 18 },
      // Mil-spec
      { base: 'Five-SeveN | Angry Mob',     rarity: 'milspec',    bw: 80 },
      { base: 'MP7 | Akoben',              rarity: 'milspec',    bw: 80 },
      { base: 'SG 553 | Cyberforce',        rarity: 'milspec',    bw: 80 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // 7. ANIME ATTACK  — as skins mais coloridas e anime do CS2
  //    Objetivo: R$60–R$150
  // ──────────────────────────────────────────────────────────────────────
  {
    name: 'Anime Attack',
    slug: 'anime-attack',
    category: 'premium',
    targetMargin: 0.12,
    skins: [
      // Top tier anime/coloridas
      { base: 'MAC-10 | Sakkaku',           rarity: 'classified', bw: 4  },
      { base: 'P90 | Neoqueen',             rarity: 'classified', bw: 4  },
      { base: 'Glock-18 | Dreamflier',      rarity: 'classified', bw: 4  },
      // Restricted coloridas
      { base: 'Glock-18 | Umbral Rabbit',   rarity: 'restricted', bw: 18 },
      { base: 'P90 | Vividly Vivid',        rarity: 'restricted', bw: 18 },
      { base: 'AUG | Stymphalian',          rarity: 'restricted', bw: 18 },
      { base: 'AUG | Death by Puppy',       rarity: 'restricted', bw: 18 },
      { base: 'XM1014 | Irezumi',           rarity: 'restricted', bw: 18 },
      // Mil-spec anime
      { base: 'M4A1-S | Emphorosaur-S',    rarity: 'milspec',    bw: 80 },
      { base: 'MAC-10 | Monkeyflage',       rarity: 'milspec',    bw: 80 },
      { base: 'MP9 | Featherweight',        rarity: 'milspec',    bw: 80 },
      { base: 'MP9 | Starlight Protector',  rarity: 'milspec',    bw: 80 },
      { base: 'UMP-45 | Wild Child',        rarity: 'classified', bw: 5  },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // 8. NEON OVERDRIVE  — skins neon e futuristas
  //    Objetivo: R$15–R$40
  // ──────────────────────────────────────────────────────────────────────
  {
    name: 'Neon Overdrive',
    slug: 'neon-overdrive',
    category: 'rifles',
    targetMargin: 0.12,
    skins: [
      // Jackpot
      { base: 'AK-47 | Neon Revolution',    rarity: 'restricted', bw: 8,  wears: ['FT','WW','BS'] },
      { base: 'MAC-10 | Neon Rider',        rarity: 'restricted', bw: 10, wears: ['FT','WW','BS'] },
      { base: 'CZ75-Auto | Neon Kimono',    rarity: 'restricted', bw: 10, wears: ['FT','WW','BS'] },
      { base: 'MP9 | Hypnotic',             rarity: 'restricted', bw: 10, wears: ['FT','WW','BS'] },
      // Floor colorido
      { base: 'SG 553 | Cyberforce',        rarity: 'milspec',    bw: 80, wears: ['FT','WW','BS'] },
      { base: 'Glock-18 | Off World',       rarity: 'milspec',    bw: 80, wears: ['FT','WW','BS'] },
      { base: 'MP9 | Featherweight',        rarity: 'milspec',    bw: 80, wears: ['FT','WW','BS'] },
      { base: 'P250 | Visions',             rarity: 'milspec',    bw: 80, wears: ['FT','WW','BS'] },
      { base: 'SSG 08 | Parallax',          rarity: 'milspec',    bw: 80, wears: ['FT','WW','BS'] },
      { base: 'Five-SeveN | Hybrid',        rarity: 'milspec',    bw: 80, wears: ['FT','WW','BS'] },
      { base: 'Negev | Hex',               rarity: 'milspec',    bw: 80, wears: ['FT','WW','BS'] },
      { base: 'M4A1-S | Emphorosaur-S',    rarity: 'milspec',    bw: 60, wears: ['FT','WW','BS'] },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // 9. PRINTSTREAM COLLECTION  — skins Printstream (branco/preto elegante)
  //    Objetivo: R$200–R$500
  // ──────────────────────────────────────────────────────────────────────
  {
    name: 'Printstream Collection',
    slug: 'printstream-collection',
    category: 'premium',
    targetMargin: 0.12,
    skins: [
      { base: 'M4A1-S | Printstream',       rarity: 'classified', bw: 4  },
      { base: 'USP-S | Printstream',        rarity: 'classified', bw: 4  },
      { base: 'Desert Eagle | Printstream', rarity: 'classified', bw: 4  },
      { base: 'P250 | Printstream',         rarity: 'classified', bw: 4  },
      { base: 'Glock-18 | Neo-Noir',        rarity: 'restricted', bw: 20 },
      { base: 'M4A4 | Neo-Noir',            rarity: 'restricted', bw: 20 },
      { base: 'USP-S | Neo-Noir',           rarity: 'restricted', bw: 20 },
      { base: 'AK-47 | Neo-Noir',           rarity: 'restricted', bw: 20 },
      { base: 'P250 | Asiimov',             rarity: 'milspec',    bw: 80 },
      { base: 'FAMAS | Commemoration',      rarity: 'milspec',    bw: 80 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // 10. SPECTRUM BOX  — skins do Spectrum + Spectrum 2 Case
  //     Objetivo: R$30–R$70
  // ──────────────────────────────────────────────────────────────────────
  {
    name: 'Spectrum Box',
    slug: 'spectrum-box',
    category: 'rifles',
    targetMargin: 0.12,
    skins: [
      { base: 'AK-47 | Asiimov',            rarity: 'restricted', bw: 5  },
      { base: 'M4A4 | Neo-Noir',            rarity: 'restricted', bw: 8  },
      { base: 'USP-S | Neo-Noir',           rarity: 'restricted', bw: 8  },
      { base: 'Glock-18 | Neo-Noir',        rarity: 'restricted', bw: 8  },
      { base: 'CZ75-Auto | Circaetus',      rarity: 'restricted', bw: 15 },
      { base: 'MP9 | Hypnotic',             rarity: 'restricted', bw: 15 },
      { base: 'Tec-9 | Fuel Injector',      rarity: 'milspec',    bw: 60, wears: ['WW','BS'] },
      { base: 'Five-SeveN | Hybrid',        rarity: 'milspec',    bw: 80 },
      { base: 'P250 | Visions',             rarity: 'milspec',    bw: 80 },
      { base: 'Negev | Hex',               rarity: 'milspec',    bw: 80 },
      { base: 'SSG 08 | Parallax',          rarity: 'milspec',    bw: 80 },
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

async function main() {
  console.log('[waxpeer] Buscando preços...');
  const wRes  = await fetch(WAXPEER_URL, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'tradexGG/1.0' } });
  const wData = await wRes.json();
  if (!wData.success) throw new Error('Waxpeer falhou');

  const fxRes  = await fetch(FX_URL, { signal: AbortSignal.timeout(8000) });
  const fxData = await fxRes.json();
  const usdBrl = fxData.rates.BRL;
  console.log(`[fx] USD/BRL = ${usdBrl.toFixed(4)} | ${wData.items.length} itens\n`);

  // Mapa Waxpeer
  const waxMap = {};
  for (const item of wData.items) {
    if (!item.name || !item.steam_price) continue;
    waxMap[item.name] = {
      price: Math.round(item.steam_price * usdBrl / 10),
      img:   item.img || '',
    };
  }

  if (DRY_RUN) console.log('[dry-run] Simulação ativa.\n');

  const client = await pool.connect();
  let totalCases = 0, totalSkins = 0;
  const summary = [];

  try {
    for (const def of HELLCASE_CASES) {
      console.log(`\n${'═'.repeat(62)}`);
      console.log(`  ${def.name.toUpperCase()}  [${def.category}]`);
      console.log('─'.repeat(62));

      // Verificar se já existe
      const ex = await client.query('SELECT id FROM cases WHERE slug=$1', [def.slug]);
      if (ex.rows.length > 0) { console.log('  ↷ Já existe — pulando.'); continue; }

      const caseSkins = [];
      let foundCount = 0, missingCount = 0;

      for (const skinDef of def.skins) {
        const [weapon, skinName] = skinDef.base.split(' | ').map(s => s.trim());
        const color = RARITY_COLOR[skinDef.rarity] || '#b0c3d9';
        const allowed = skinDef.wears ? new Set(skinDef.wears) : new Set(['FN','MW','FT','WW','BS']);

        const found = [];
        for (const [label, code] of Object.entries(WEAR_LABELS)) {
          if (!allowed.has(code)) continue;
          const hash = `${skinDef.base} (${label})`;
          if (waxMap[hash]) found.push({ code, hash, price: waxMap[hash].price, img: waxMap[hash].img });
        }

        if (found.length === 0) {
          console.log(`  ⚠  NÃO ENCONTRADO: ${skinDef.base}`);
          missingCount++;
          continue;
        }

        foundCount++;
        // Mostrar apenas jackpots e skins encontradas por categoria
        const minPrice = Math.min(...found.map(f => f.price));
        const maxPrice = Math.max(...found.map(f => f.price));
        console.log(`  ✓  ${skinDef.base.padEnd(36)} R$${(minPrice/100).toFixed(0).padStart(5)}–R$${(maxPrice/100).toFixed(0)} (${found.length} desgastes)`);

        for (const w of found) {
          const fullName = `${skinDef.base.replace(/★\s*/g,'').trim()} (${w.code})`;
          const imgSlug  = slugify(w.hash.replace(/★\s*/g,''));
          const imageUrl = w.img.startsWith('http') ? w.img : `${CDN_BASE}730-${imgSlug}.webp`;
          const weight   = Math.max(1, skinDef.bw * WEAR_DIST[w.code]);

          if (!DRY_RUN) {
            const exSkin = await client.query('SELECT id FROM skins WHERE market_hash_name=$1', [w.hash]);
            let skinId;
            if (exSkin.rows.length > 0) {
              skinId = exSkin.rows[0].id;
              await client.query(
                'UPDATE skins SET site_price=$1, market_price=$1, price_updated_at=NOW() WHERE id=$2',
                [w.price, skinId]
              );
            } else {
              const ins = await client.query(
                `INSERT INTO skins (name,weapon,skin_name,wear,rarity,rarity_color,image_url,market_price,site_price,price_updated_at,market_hash_name)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,NOW(),$9) RETURNING id`,
                [fullName, weapon, skinName||'', w.code, skinDef.rarity, color, imageUrl, w.price, w.hash]
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

      if (caseSkins.length === 0) {
        console.log('  ✗  Nenhuma skin encontrada — ignorada.');
        continue;
      }

      const totalW    = caseSkins.reduce((s, x) => s + x.weight, 0);
      const ev        = caseSkins.reduce((s, x) => s + (x.weight / totalW) * x.price, 0);
      const casePrice = roundNice(ev / (1 - def.targetMargin));
      const margin    = (1 - ev / casePrice) * 100;

      console.log(`\n  ┌ Skins encontradas: ${foundCount}  |  Não encontradas: ${missingCount}`);
      console.log(`  ├ EV = R$${(ev/100).toFixed(2)}  |  Preço = R$${(casePrice/100).toFixed(2)}  |  Margem = ${margin.toFixed(1)}%`);
      console.log(`  └ Total de variantes: ${caseSkins.length}`);

      if (!DRY_RUN) {
        const caseRes = await client.query(
          `INSERT INTO cases (name,slug,image_url,price,category) VALUES ($1,$2,'GENERATED',$3,$4) RETURNING id`,
          [def.name, def.slug, casePrice, def.category]
        );
        const caseId = caseRes.rows[0].id;
        for (const cs of caseSkins)
          await client.query(
            'INSERT INTO case_skins (case_id,skin_id,weight) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
            [caseId, cs.skinId, cs.weight]
          );
        totalCases++;
      }
      summary.push({ name: def.name, cat: def.category, price: casePrice, skins: caseSkins.length, margin, missing: missingCount });
    }

    // Resumo
    console.log(`\n${'═'.repeat(62)}`);
    console.log('RESUMO\n');
    console.log('Case'.padEnd(26) + 'Categoria'.padEnd(11) + 'Preço'.padEnd(12) + 'Skins'.padEnd(7) + 'Margem');
    console.log('─'.repeat(62));
    for (const r of summary) {
      const warn = r.missing > 0 ? ` (⚠${r.missing})` : '';
      console.log(
        (r.name + warn).padEnd(26) + r.cat.padEnd(11) +
        `R$${(r.price/100).toFixed(2)}`.padEnd(12) +
        String(r.skins).padEnd(7) + `${r.margin.toFixed(1)}%`
      );
    }
    console.log('─'.repeat(62));
    if (!DRY_RUN) console.log(`\n✔  ${totalCases} cases adicionadas | ${totalSkins} novas skins`);
    else          console.log('\n[dry-run] Nada foi salvo.');

  } finally {
    client.release();
  }
  await pool.end();
}

main().catch(e => { console.error('[ERRO]', e.message); process.exit(1); });
