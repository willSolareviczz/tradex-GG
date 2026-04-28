/**
 * Adiciona as skins da Royal Case (id=5) ao banco de dados.
 * Preços e pesos baseados nas imagens fornecidas.
 * Uso: node scripts/add-royal-case-skins.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const CASE_ID = 5;

// Formato: { weapon, skin_name, rarity, rarity_color, wears: [{wear, price_brl, weight}] }
// price_brl em centavos. weight proporcional ao drop% da imagem.
const SKINS = [

  // ── EXTRAORDINARY (faca) ───────────────────────────────────────
  {
    weapon: '★ Gut Knife', skin_name: 'Black Laminate',
    rarity: 'extraordinary', rarity_color: '#e4ae39',
    wears: [
      { wear: 'FN', price: 73459, weight: 22 },
      { wear: 'MW', price: 42455, weight: 39 },
      { wear: 'FT', price: 38057, weight: 43 },
      { wear: 'WW', price: 48082, weight: 34 },
      { wear: 'BS', price: 50008, weight: 32 },
    ],
  },

  // ── COVERT ─────────────────────────────────────────────────────
  {
    weapon: 'AK-47', skin_name: 'Head Shot',
    rarity: 'covert', rarity_color: '#eb4b4b',
    wears: [
      { wear: 'FN', price: 101026, weight: 16 },
      { wear: 'MW', price: 39298, weight: 42 },
      { wear: 'FT', price: 26137, weight: 62 },
      { wear: 'BS', price: 21305, weight: 76 },
    ],
  },
  {
    weapon: 'M4A4', skin_name: 'Buzz Kill',
    rarity: 'covert', rarity_color: '#eb4b4b',
    wears: [
      { wear: 'FN', price: 356329, weight: 4  },
      { wear: 'MW', price: 95804,  weight: 17 },
      { wear: 'FT', price: 108945, weight: 15 },
      { wear: 'WW', price: 209641, weight: 8  },
      { wear: 'BS', price: 69562,  weight: 23 },
    ],
  },
  {
    weapon: 'FAMAS', skin_name: 'Commemoration',
    rarity: 'covert', rarity_color: '#eb4b4b',
    wears: [
      { wear: 'FN', price: 61373, weight: 26 },
      { wear: 'MW', price: 31775, weight: 52 },
      { wear: 'FT', price: 40359, weight: 40 },
      { wear: 'WW', price: 39843, weight: 41 },
      { wear: 'BS', price: 26837, weight: 61 },
    ],
  },

  // ── CLASSIFIED ─────────────────────────────────────────────────
  {
    weapon: 'AWP', skin_name: 'Chromatic Aberration',
    rarity: 'classified', rarity_color: '#d32ce6',
    wears: [
      { wear: 'FN', price: 76570, weight: 21 },
      { wear: 'MW', price: 26337, weight: 62 },
      { wear: 'FT', price: 20494, weight: 79 },
      { wear: 'WW', price: 23641, weight: 69 },
      { wear: 'BS', price: 20079, weight: 81 },
    ],
  },
  {
    weapon: 'M4A4', skin_name: 'The Battlestar',
    rarity: 'classified', rarity_color: '#d32ce6',
    wears: [
      { wear: 'FN', price: 138454, weight: 12 },
      { wear: 'MW', price: 25782,  weight: 63 },
      { wear: 'FT', price: 17683,  weight: 92 },
      { wear: 'WW', price: 26697,  weight: 60 },
      { wear: 'BS', price: 34476,  weight: 48 },
    ],
  },
  {
    weapon: 'AUG', skin_name: 'Chameleon',
    rarity: 'classified', rarity_color: '#d32ce6',
    wears: [
      { wear: 'FN', price: 59761, weight: 30 },
      { wear: 'MW', price: 54785, weight: 29 },
      { wear: 'FT', price: 57186, weight: 28 },
      { wear: 'WW', price: 63844, weight: 26 },
      { wear: 'BS', price: 66110, weight: 25 },
    ],
  },
  {
    weapon: 'AWP', skin_name: 'Elite Build',
    rarity: 'classified', rarity_color: '#d32ce6',
    wears: [
      { wear: 'MW', price: 23176, weight: 70 },
      { wear: 'FT', price: 11145, weight: 146 },
      { wear: 'WW', price: 10560, weight: 155 },
      { wear: 'BS', price: 10460, weight: 155 },
    ],
  },
  {
    weapon: 'M4A1-S', skin_name: 'Black Lotus',
    rarity: 'classified', rarity_color: '#d32ce6',
    wears: [
      { wear: 'MW', price: 7138,  weight: 228 },
      { wear: 'FT', price: 4492,  weight: 362 },
      { wear: 'WW', price: 5207,  weight: 312 },
      { wear: 'BS', price: 4442,  weight: 367 },
    ],
  },

  // ── RESTRICTED ─────────────────────────────────────────────────
  {
    weapon: 'SCAR-20', skin_name: 'Splash Jam',
    rarity: 'restricted', rarity_color: '#8847ff',
    wears: [
      { wear: 'FT', price: 12341, weight: 132 },
      { wear: 'WW', price: 11770, weight: 138 },
      { wear: 'BS', price: 10285, weight: 158 },
    ],
  },
  {
    weapon: 'Desert Eagle', skin_name: 'Mecha Industries',
    rarity: 'restricted', rarity_color: '#8847ff',
    wears: [
      { wear: 'FN', price: 13171, weight: 124 },
      { wear: 'MW', price: 6673,  weight: 244 },
      { wear: 'FT', price: 4792,  weight: 339 },
      { wear: 'WW', price: 5212,  weight: 312 },
      { wear: 'BS', price: 4827,  weight: 337 },
    ],
  },
  {
    weapon: 'Five-SeveN', skin_name: 'Fowl Play',
    rarity: 'restricted', rarity_color: '#8847ff',
    wears: [
      { wear: 'FN', price: 27813, weight: 59  },
      { wear: 'MW', price: 16543, weight: 98  },
      { wear: 'FT', price: 12926, weight: 126 },
      { wear: 'WW', price: 14016, weight: 116 },
      { wear: 'BS', price: 16052, weight: 101 },
    ],
  },
  {
    weapon: 'Tec-9', skin_name: 'Remote Control',
    rarity: 'restricted', rarity_color: '#8847ff',
    wears: [
      { wear: 'MW', price: 5883, weight: 276 },
      { wear: 'FT', price: 1551, weight: 747 },
      { wear: 'WW', price: 2201, weight: 526 },
      { wear: 'BS', price: 1516, weight: 765 },
    ],
  },

  // ── MIL-SPEC ───────────────────────────────────────────────────
  {
    weapon: 'MP9', skin_name: 'Food Chain',
    rarity: 'mil_spec', rarity_color: '#4b69ff',
    wears: [
      { wear: 'MW', price: 5938, weight: 274 },
      { wear: 'FT', price: 3367, weight: 483 },
      { wear: 'WW', price: 2741, weight: 593 },
      { wear: 'BS', price: 2696, weight: 604 },
    ],
  },
  {
    weapon: 'P2000', skin_name: 'Handgun',
    rarity: 'mil_spec', rarity_color: '#4b69ff',
    wears: [
      { wear: 'FT', price: 2090, weight: 1272 },
      { wear: 'WW', price: 775,  weight: 1494 },
      { wear: 'BS', price: 610,  weight: 1898 },
    ],
  },
  {
    weapon: 'Desert Eagle', skin_name: 'Trigger Discipline',
    rarity: 'mil_spec', rarity_color: '#4b69ff',
    wears: [
      { wear: 'FT', price: 660,  weight: 1754 },
      { wear: 'WW', price: 535,  weight: 2164 },
      { wear: 'BS', price: 505,  weight: 2293 },
    ],
  },
  {
    weapon: 'Five-SeveN', skin_name: 'Retrobution',
    rarity: 'mil_spec', rarity_color: '#4b69ff',
    wears: [
      { wear: 'FT', price: 1080, weight: 1072 },
      { wear: 'WW', price: 775,  weight: 1494 },
      { wear: 'BS', price: 765,  weight: 1514 },
    ],
  },
  {
    weapon: 'USP-S', skin_name: 'Alpine Camo',
    rarity: 'mil_spec', rarity_color: '#4b69ff',
    wears: [
      { wear: 'FN', price: 3181, weight: 512  },
      { wear: 'MW', price: 875,  weight: 1323 },
      { wear: 'FT', price: 490,  weight: 2363 },
      { wear: 'WW', price: 475,  weight: 2437 },
      { wear: 'BS', price: 420,  weight: 2757 },
    ],
  },
  {
    weapon: 'Galil AR', skin_name: 'Connexion',
    rarity: 'mil_spec', rarity_color: '#4b69ff',
    wears: [
      { wear: 'FT', price: 580, weight: 1963 },
      { wear: 'WW', price: 450, weight: 2573 },
      { wear: 'BS', price: 430, weight: 2692 },
    ],
  },
  {
    weapon: 'Tec-9', skin_name: 'Brother',
    rarity: 'mil_spec', rarity_color: '#4b69ff',
    wears: [
      { wear: 'FT', price: 530, weight: 2184 },
      { wear: 'WW', price: 440, weight: 2631 },
      { wear: 'BS', price: 400, weight: 2895 },
    ],
  },
  {
    weapon: 'G3SG1', skin_name: 'Dream Glade',
    rarity: 'mil_spec', rarity_color: '#4b69ff',
    wears: [
      { wear: 'FT', price: 550, weight: 2105 },
      { wear: 'WW', price: 580, weight: 1996 },
      { wear: 'BS', price: 510, weight: 2184 },
    ],
  },
];

const WEAR_FULL = { FN: 'Factory New', MW: 'Minimal Wear', FT: 'Field-Tested', WW: 'Well-Worn', BS: 'Battle-Scarred' };

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Remove existing skins from this case (clean slate)
    await client.query('DELETE FROM case_skins WHERE case_id = $1', [CASE_ID]);
    console.log(`Skins anteriores da case ${CASE_ID} removidas.\n`);

    let totalInserted = 0;

    for (const skin of SKINS) {
      for (const { wear, price, weight } of skin.wears) {
        const name = `${skin.weapon} | ${skin.skin_name} (${WEAR_FULL[wear]})`;
        const marketHashName = `${skin.weapon} | ${skin.skin_name} (${WEAR_FULL[wear]})`;

        // Check if skin already exists
        let skinRes = await client.query(
          'SELECT id FROM skins WHERE market_hash_name = $1 LIMIT 1',
          [marketHashName]
        );
        let res;
        if (skinRes.rows.length > 0) {
          await client.query(
            'UPDATE skins SET market_price=$1, rarity=$2, rarity_color=$3 WHERE id=$4',
            [price, skin.rarity, skin.rarity_color, skinRes.rows[0].id]
          );
          res = skinRes;
        } else {
          res = await client.query(`
            INSERT INTO skins (name, weapon, skin_name, wear, rarity, rarity_color, market_price, market_hash_name, image_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '') RETURNING id
          `, [name, skin.weapon, skin.skin_name, wear, skin.rarity, skin.rarity_color, price, marketHashName]);
        }

        const skinId = res.rows[0].id;

        await client.query(
          'INSERT INTO case_skins (case_id, skin_id, weight) VALUES ($1, $2, $3)',
          [CASE_ID, skinId, weight]
        );

        console.log(`✓ [w=${weight}] ${name}: R$ ${(price/100).toFixed(2)}`);
        totalInserted++;
      }
    }

    await client.query('COMMIT');
    console.log(`\n✅ ${totalInserted} entradas inseridas na Royal Case.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
