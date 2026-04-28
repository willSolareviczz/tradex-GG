/**
 * Busca imagens das skins da Legendary Case (id=4)
 * via ByMykel CSGO-API (API comunitária, não é a Steam API).
 * Atualiza image_url no banco para todas as skins sem imagem.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const CSGO_API_URL = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json';
const CASE_ID = 4;

async function fetchSkinsData() {
  console.log('Buscando dados da CSGO-API (ByMykel)...');
  const res = await fetch(CSGO_API_URL, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`CSGO-API retornou HTTP ${res.status}`);
  const data = await res.json();
  console.log(`API: ${data.length} skins carregadas\n`);
  return data;
}

function normalizeStr(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findSkinImage(apiData, weaponName, skinName) {
  const targetWeapon = normalizeStr(weaponName);
  const targetSkin   = normalizeStr(skinName);

  for (const item of apiData) {
    if (!item.name) continue;
    const itemName = normalizeStr(item.name);
    if (itemName.includes(targetWeapon) && itemName.includes(targetSkin)) {
      let img = item.image || null;
      if (img && img.includes('community.akamai.steamstatic.com') && !img.includes('fx')) {
        img += '/960fx960f';
      }
      return img;
    }
  }
  return null;
}

async function main() {
  const { rows: skins } = await pool.query(
    `SELECT DISTINCT s.weapon, s.skin_name, MIN(s.id) AS sample_id
     FROM skins s
     JOIN case_skins cs ON cs.skin_id = s.id
     WHERE cs.case_id = $1
     GROUP BY s.weapon, s.skin_name
     ORDER BY s.weapon`,
    [CASE_ID]
  );

  console.log(`Skins únicas na Legendary Case: ${skins.length}\n`);

  const apiData = await fetchSkinsData();

  let updated = 0, notFound = 0;

  for (const { weapon, skin_name } of skins) {
    const imageUrl = findSkinImage(apiData, weapon, skin_name);

    if (imageUrl) {
      // Atualiza todas as variantes de desgaste desta skin
      const result = await pool.query(
        `UPDATE skins SET image_url = $1
         WHERE weapon = $2 AND skin_name = $3
           AND id IN (SELECT skin_id FROM case_skins WHERE case_id = $4)`,
        [imageUrl, weapon, skin_name, CASE_ID]
      );
      console.log(`✓ ${weapon} | ${skin_name} → ${result.rowCount} wears atualizados`);
      updated += result.rowCount;
    } else {
      console.log(`✗ ${weapon} | ${skin_name}: imagem não encontrada`);
      notFound++;
    }
  }

  console.log(`\nConcluído: ${updated} registros com imagem, ${notFound} skins sem imagem`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
