/**
 * Popula a Legendary Case (id=4) com as skins dos prints fornecidos.
 * Dados de raridade e peso: imagem 1.
 * Dados de preço por wear: imagem 2.
 * Imagens: buscadas via priceService (Skinport) na próxima atualização.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const CASE_ID      = 4;
const WEIGHT_SCALE = 100000; // 100% = 100000
const WEAR_FULL    = { FN: 'Factory New', MW: 'Minimal Wear', FT: 'Field-Tested', WW: 'Well-Worn', BS: 'Battle-Scarred' };

// Distribuição de drop por wear dentro de cada skin (soma = 1.0)
const WEAR_DIST = { FN: 0.05, MW: 0.15, FT: 0.28, WW: 0.24, BS: 0.28 };

// ─── Imagem 1 — skins, raridade e % de drop total ──────────────────────────
const SKINS = [
  // Covert
  { weapon: 'Glock-18',     skin: 'Gold Toof',            rarity: 'covert',     color: '#eb4b4b', pct: 0.045 },
  { weapon: 'MAC-10',       skin: 'Toybox',               rarity: 'covert',     color: '#eb4b4b', pct: 0.114 },
  { weapon: 'SSG 08',       skin: 'Turbo Peek',           rarity: 'covert',     color: '#eb4b4b', pct: 0.090 },
  { weapon: 'USP-S',        skin: 'Cortex',               rarity: 'covert',     color: '#eb4b4b', pct: 0.343 },
  { weapon: 'AK-47',        skin: 'Phantom Disruptor',    rarity: 'covert',     color: '#eb4b4b', pct: 0.207 },
  { weapon: 'M4A1-S',       skin: 'Leaded Glass',         rarity: 'covert',     color: '#eb4b4b', pct: 0.169 },
  { weapon: 'Desert Eagle', skin: 'Conspiracy',           rarity: 'covert',     color: '#eb4b4b', pct: 0.068 },
  // Classified
  { weapon: 'Galil AR',     skin: 'Chromatic Aberration', rarity: 'classified', color: '#d32ce6', pct: 0.347 },
  { weapon: 'P250',         skin: 'Muertos',              rarity: 'classified', color: '#d32ce6', pct: 0.139 },
  { weapon: 'M4A4',         skin: 'Tooth Fairy',          rarity: 'classified', color: '#d32ce6', pct: 0.336 },
  { weapon: 'P90',          skin: 'Shallow Grave',        rarity: 'classified', color: '#d32ce6', pct: 0.141 },
  { weapon: 'FAMAS',        skin: 'Rapid Eye Movement',   rarity: 'classified', color: '#d32ce6', pct: 0.318 },
  { weapon: 'AUG',          skin: 'Stymphalian',          rarity: 'classified', color: '#d32ce6', pct: 0.461 },
  { weapon: 'AWP',          skin: 'Duality',              rarity: 'classified', color: '#d32ce6', pct: 0.289 },
  // Restricted
  { weapon: 'M4A1-S',       skin: 'Flashback',            rarity: 'restricted', color: '#8847ff', pct: 0.539  },
  { weapon: 'M4A4',         skin: 'Etch Lord',            rarity: 'restricted', color: '#8847ff', pct: 15.135 },
  { weapon: 'SCAR-20',      skin: 'Enforcer',             rarity: 'restricted', color: '#8847ff', pct: 20.326 },
  { weapon: 'MP9',          skin: 'Goo',                  rarity: 'restricted', color: '#8847ff', pct: 8.808  },
  { weapon: 'SG 553',       skin: 'Dragon Tech',          rarity: 'restricted', color: '#8847ff', pct: 28.437 },
  { weapon: 'UMP-45',       skin: 'Exposure',             rarity: 'restricted', color: '#8847ff', pct: 13.794 },
  { weapon: 'AK-47',        skin: 'Uncharted',            rarity: 'restricted', color: '#8847ff', pct: 9.894  },
];

// ─── Imagem 2 — preços em BRL centavos por wear (FN/MW/FT/WW/BS) ───────────
// Wears não listados = skin não disponível nesse desgaste
const PRICES = {
  'Glock-18 | Gold Toof':            { FN: 122860, MW: 38553, FT: 26222, WW: 27736, BS: 25567 },
  'MAC-10 | Toybox':                 { FN: 65335,  MW: 50455, FT: 13156, WW: 12531, BS: 12811 },
  'SSG 08 | Turbo Peek':             { FN: 50455,  MW: 21350, FT: 13815, WW: 13241, BS: 12396 },
  'USP-S | Cortex':                  { FN: 17448,  MW: 15039, FT: 6162,  WW: 5616,  BS: 2913  },
  'AK-47 | Phantom Disruptor':       { FN: 17048,  MW: 15039, FT: 7615,  WW: 6115,  BS: 5136  },
  'M4A1-S | Leaded Glass':           { FN: 26057,  MW: 17428, FT: 11187, WW: 8389,  BS: 7245  },
  'Desert Eagle | Conspiracy':       { FN: 15509,  MW: 17485, FT: 15939, WW: 5027,  BS: 5001  },
  'Galil AR | Chromatic Aberration': { FN: 11787,  MW: 6436,  FT: 3473,  WW: 2948,  BS: 2903  },
  'P250 | Muertos':                  { FN: 17178,  MW: 16244, FT: 10493, WW: 7005,  BS: 10083 },
  'M4A4 | Tooth Fairy':              { FN: 37689,  MW: 26871, FT: 18083, WW: 5671,  BS: 3128  },
  'P90 | Shallow Grave':             { FN: 40887,  MW: 37623, FT: 18997, WW: 18097, BS: 7565  },
  'FAMAS | Rapid Eye Movement':      { FN: 25008,  MW: 15864, FT: 4647,  WW: 4025,  BS: 4625  },
  'AUG | Stymphalian':               { FN: 15509,  MW: 6990,  FT: 3398,  WW: 2998,  BS: 2993  },
  'AWP | Duality':                   { FN: 15509,  MW: 9513,  FT: 4441,  WW: 3243,  BS: 3173  },
  'M4A1-S | Flashback':              { FN: 40432,  MW: 14660, FT: 2713,  WW: 2748,  BS: 2458  },
  'M4A4 | Etch Lord':                { FN: 2448,   MW: 1319,  FT: 729,   WW: 984,   BS: 410   },
  'SCAR-20 | Enforcer':              { FN: 1684,   MW: 1089,  FT: 809,   WW: 595,   BS: 475   },
  'MP9 | Goo':                       { FN: 2019,   MW: 1394,  FT: 789,   WW: 784,   BS: 720   },
  'SG 553 | Dragon Tech':            { FN: 1039,   MW: 680,   FT: 560,   WW: 545,   BS: 400   },
  'UMP-45 | Exposure':               { FN: 1194,   MW: 894,   FT: 874,   WW: 724,   BS: 700   },
  'AK-47 | Uncharted':               { FN: 2913,   MW: 2288,  FT: 2283,  WW: 869,   BS: 585   },
};

async function main() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Remove links existentes e skins exclusivas desta case
    const { rows: oldLinks } = await client.query(
      'SELECT skin_id FROM case_skins WHERE case_id = $1', [CASE_ID]
    );
    await client.query('DELETE FROM case_skins WHERE case_id = $1', [CASE_ID]);

    for (const { skin_id } of oldLinks) {
      const { rows } = await client.query(
        'SELECT 1 FROM case_skins WHERE skin_id = $1 LIMIT 1', [skin_id]
      );
      if (rows.length === 0) {
        // Remove dependências antes de deletar a skin
        await client.query('DELETE FROM battle_openings WHERE skin_id = $1', [skin_id]);
        await client.query('DELETE FROM openings        WHERE skin_id = $1', [skin_id]);
        await client.query('DELETE FROM skins           WHERE id      = $1', [skin_id]);
      }
    }

    console.log(`Antigos removidos. Inserindo ${SKINS.length} skins × 5 wears...\n`);

    let inserted = 0;

    for (const s of SKINS) {
      const fullName    = `${s.weapon} | ${s.skin}`;
      const totalWeight = Math.round(s.pct * WEIGHT_SCALE / 100);
      const prices      = PRICES[fullName] || {};

      for (const [wear, wearFull] of Object.entries(WEAR_FULL)) {
        const mhn        = `${s.weapon} | ${s.skin} (${wearFull})`;
        const wearWeight = Math.max(1, Math.round(totalWeight * WEAR_DIST[wear]));
        const price      = prices[wear] || 100;

        const { rows: [row] } = await client.query(
          `INSERT INTO skins
             (name, weapon, skin_name, wear, rarity, rarity_color,
              image_url, market_price, site_price, market_hash_name, price_updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,'', $7,$7,$8, NOW())
           RETURNING id`,
          [fullName, s.weapon, s.skin, wear, s.rarity, s.color, price, mhn]
        );

        await client.query(
          'INSERT INTO case_skins (case_id, skin_id, weight) VALUES ($1,$2,$3)',
          [CASE_ID, row.id, wearWeight]
        );

        console.log(`  ✓ [${wear}] ${fullName}  weight:${wearWeight}  R$${(price/100).toFixed(2)}`);
        inserted++;
      }
      console.log('');
    }

    await client.query('COMMIT');
    console.log('─'.repeat(60));
    console.log(`Pronto: ${inserted} registros inseridos.`);
    console.log('As imagens serão preenchidas automaticamente pelo priceService\nno próximo ciclo (reinicie o servidor).');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ERRO:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
