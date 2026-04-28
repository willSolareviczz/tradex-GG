/**
 * Corrige image_url de skins com imagem quebrada ou usando CDN antigo (waxpeer).
 * Busca a URL correta da Skinport e atualiza no banco.
 *
 * Uso: node scripts/fix-broken-images.js
 * Para corrigir uma skin específica: node scripts/fix-broken-images.js "AK-47 | Nightwish"
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SKINPORT_URL = 'https://api.skinport.com/v1/items?app_id=730&currency=BRL';
const TARGET_NAME  = process.argv[2] || null;

async function fetchSkinportImages() {
  console.log('Buscando imagens da Skinport API...');
  const res = await fetch(SKINPORT_URL, {
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Skinport retornou HTTP ${res.status}`);
  const items = await res.json();
  const imageMap = new Map();
  for (const item of items) {
    if (item.market_hash_name && item.icon_url) {
      imageMap.set(item.market_hash_name, `https://community.akamai.steamstatic.com/economy/image/${item.icon_url}/960fx960f`);
    }
  }
  console.log(`Skinport: ${imageMap.size} imagens carregadas\n`);
  return imageMap;
}

async function main() {
  const whereClause = TARGET_NAME
    ? `WHERE market_hash_name IS NOT NULL AND name ILIKE $1`
    : `WHERE market_hash_name IS NOT NULL AND (
         image_url IS NULL OR
         image_url LIKE '%waxpeer%' OR
         image_url LIKE '%placeholder%' OR
         image_url = ''
       )`;
  const queryArgs = TARGET_NAME ? [`%${TARGET_NAME}%`] : [];

  const { rows: skins } = await pool.query(
    `SELECT id, name, market_hash_name, image_url FROM skins ${whereClause} ORDER BY id`,
    queryArgs
  );

  if (skins.length === 0) {
    console.log('Nenhuma skin encontrada para corrigir.');
    await pool.end();
    return;
  }

  console.log(`Corrigindo imagens de ${skins.length} skin(s)...\n`);
  skins.forEach(s => console.log(`  [${s.id}] ${s.name} — URL atual: ${s.image_url || 'NULL'}`));
  console.log('');

  const imageMap = await fetchSkinportImages();

  let fixed = 0, notFound = 0;

  for (const skin of skins) {
    const newUrl = imageMap.get(skin.market_hash_name);
    if (newUrl) {
      await pool.query(
        `UPDATE skins SET image_url = $1, price_updated_at = NOW() WHERE id = $2`,
        [newUrl, skin.id]
      );
      console.log(`✓ [${skin.id}] ${skin.name}`);
      console.log(`     ${newUrl}`);
      fixed++;
    } else {
      console.log(`✗ [${skin.id}] ${skin.name}: nao encontrado na Skinport`);
      notFound++;
    }
  }

  console.log(`\nConcluido: ${fixed} corrigidas, ${notFound} nao encontradas na Skinport`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
