/**
 * Corrige market_hash_names das facas (★ prefix obrigatorio na Steam)
 * e define site_price manual para skins que a API nao retorna.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  // 1. Corrigir market_hash_names das facas com prefixo ★
  const knifeHashFixes = [
    { id: 55, hash: '★ Navaja Knife | Safari Mesh (Field-Tested)' },
    { id: 56, hash: '★ Gut Knife | Night (Field-Tested)' },
    { id: 57, hash: '★ Gut Knife | Doppler (Factory New)' },
    { id: 58, hash: '★ Flip Knife | Rust Coat (Battle-Scarred)' },
    { id: 59, hash: '★ Flip Knife | Doppler (Factory New)' },
    { id: 60, hash: '★ Butterfly Knife | Crimson Web (Field-Tested)' },
    { id: 61, hash: '★ M9 Bayonet | Doppler (Factory New)' },
    { id: 62, hash: '★ Karambit | Fade (Factory New)' },
  ];

  console.log('Corrigindo market_hash_names das facas...');
  for (const k of knifeHashFixes) {
    await pool.query(
      `UPDATE skins SET market_hash_name = $1, price_updated_at = NULL WHERE id = $2`,
      [k.hash, k.id]
    );
    console.log(`  [${k.id}] -> ${k.hash}`);
  }

  // 2. Definir site_price manualmente para skins que a Steam nao retorna preco
  // Precos em centavos BRL (aproximados, baseados no mercado atual)
  const manualPrices = [
    // M4A4 Dragon King - steam nao retornou preco (~$18 USD = ~R$105)
    { id: 15, site_price: 10500, note: 'M4A4 Dragon King FT ~R$105' },
    { id: 16, site_price: 13500, note: 'M4A4 Dragon King MW ~R$135' },
    // Skins que falharam por rate limit - reset para o service pegar depois
    { id: 9,  site_price: 55,    note: 'AK-47 Safari Mesh WW ~R$0.55' },
    { id: 10, site_price: 72,    note: 'M4A1-S Boreal Forest FT ~R$0.72' },
    { id: 11, site_price: 42,    note: 'M4A1-S Boreal Forest WW ~R$0.42' },
    { id: 12, site_price: 17,    note: 'Nova Predator FT ~R$0.17' },
    { id: 13, site_price: 450,   note: 'MAC-10 Candy Apple FN ~R$4.50' },
    { id: 37, site_price: 135000, note: 'AK-47 Redline FN ~R$1350' },
  ];

  console.log('\nDefinindo site_prices manuais...');
  for (const s of manualPrices) {
    await pool.query(
      `UPDATE skins SET site_price = $1, price_updated_at = NOW() WHERE id = $2`,
      [s.site_price, s.id]
    );
    console.log(`  [${s.id}] ${s.note}`);
  }

  console.log('\nDone!');
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
