/**
 * Script standalone para forcar atualizacao de todos os precos via Skinport API.
 * Uso: node scripts/force-price-update.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SKINPORT_URL     = 'https://api.skinport.com/v1/items?app_id=730&currency=BRL';
const PRICE_ADJUST_FACTOR = parseFloat(process.env.PRICE_ADJUST_FACTOR || '1.0');

async function fetchSkinportPrices() {
  console.log('Buscando precos da Skinport API...');
  const res = await fetch(SKINPORT_URL, {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://skinport.com/',
      'Origin': 'https://skinport.com',
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Skinport retornou HTTP ${res.status}`);
  const items = await res.json();
  const priceMap = new Map();
  for (const item of items) {
    if (item.market_hash_name && item.min_price != null && item.min_price > 0) {
      const price    = Math.max(1, Math.round(item.min_price * 100 * PRICE_ADJUST_FACTOR));
      const imageUrl = item.icon_url
        ? `https://community.akamai.steamstatic.com/economy/image/${item.icon_url}/960fx960f`
        : null;
      priceMap.set(item.market_hash_name, { price, imageUrl });
    }
  }
  console.log(`Skinport: ${priceMap.size} itens carregados\n`);
  return priceMap;
}

async function main() {
  const { rows: skins } = await pool.query(
    `SELECT id, name, market_hash_name, site_price, image_url FROM skins
     WHERE market_hash_name IS NOT NULL ORDER BY id`
  );

  console.log(`Atualizando ${skins.length} skins...\n`);

  const priceMap = await fetchSkinportPrices();

  let updated = 0, notFound = 0;

  for (const skin of skins) {
    const entry = priceMap.get(skin.market_hash_name);
    if (entry != null) {
      const { price, imageUrl } = entry;
      if (imageUrl) {
        await pool.query(
          `UPDATE skins SET site_price = $1, image_url = $2, price_updated_at = NOW() WHERE id = $3`,
          [price, imageUrl, skin.id]
        );
      } else {
        await pool.query(
          `UPDATE skins SET site_price = $1, price_updated_at = NOW() WHERE id = $2`,
          [price, skin.id]
        );
      }
      console.log(`✓ [${skin.id}] ${skin.name}: R$ ${(price / 100).toFixed(2)}`);
      updated++;
    } else {
      console.log(`✗ [${skin.id}] ${skin.name}: nao encontrado na Skinport`);
      notFound++;
    }
  }

  console.log(`\nConcluido: ${updated} atualizadas, ${notFound} nao encontradas\n`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
