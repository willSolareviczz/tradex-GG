/**
 * Script standalone para forcar atualizacao de todos os precos via Steam API.
 * Uso: node scripts/force-price-update.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PRICE_ADJUST_FACTOR = parseFloat(process.env.PRICE_ADJUST_FACTOR || '1.0');
const STEAM_DELAY_MS = 3500;

async function fetchSteamPrice(marketHashName) {
  try {
    const encoded = encodeURIComponent(marketHashName);
    const url = `https://steamcommunity.com/market/priceoverview/?currency=7&appid=730&market_hash_name=${encoded}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!res.ok) {
      console.log(`  HTTP ${res.status} para ${marketHashName}`);
      return null;
    }
    const data = await res.json();
    if (!data.success) return null;
    const rawStr = data.median_price || data.lowest_price || '';
    const cleaned = rawStr.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    const value = Math.round(parseFloat(cleaned) * 100);
    return isNaN(value) || value <= 0 ? null : value;
  } catch (e) {
    console.log(`  Erro: ${e.message}`);
    return null;
  }
}

async function main() {
  const result = await pool.query(
    `SELECT id, name, market_hash_name, market_price, site_price FROM skins
     WHERE market_hash_name IS NOT NULL ORDER BY id`
  );

  const skins = result.rows;
  console.log(`\nAtualizando ${skins.length} skins...\n`);

  let updated = 0, failed = 0;

  for (const skin of skins) {
    process.stdout.write(`[${skin.id}] ${skin.name}... `);
    const price = await fetchSteamPrice(skin.market_hash_name);

    if (price !== null) {
      const sitePrice = Math.max(1, Math.round(price * PRICE_ADJUST_FACTOR));
      await pool.query(
        `UPDATE skins SET site_price = $1, price_updated_at = NOW() WHERE id = $2`,
        [sitePrice, skin.id]
      );
      console.log(`R$ ${(sitePrice / 100).toFixed(2)}`);
      updated++;
    } else {
      console.log(`FALHOU (mantendo R$ ${(skin.site_price / 100).toFixed(2)})`);
      failed++;
    }

    await new Promise(r => setTimeout(r, STEAM_DELAY_MS));
  }

  console.log(`\nConcluido: ${updated} atualizadas, ${failed} falhas\n`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
