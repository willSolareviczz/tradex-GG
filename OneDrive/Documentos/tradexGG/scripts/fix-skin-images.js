#!/usr/bin/env node
/**
 * fix-skin-images.js — Corrige image_url de todas as skins usando dados do Waxpeer
 *
 * O Waxpeer API retorna o campo `img` com o hash da imagem Steam CDN
 * para cada item. Este script atualiza o banco com as imagens corretas.
 *
 * Uso: node scripts/fix-skin-images.js [--dry-run]
 */

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const DRY_RUN = process.argv.includes('--dry-run');

const WAXPEER_URL  = 'https://api.waxpeer.com/v1/prices?game=csgo';
const CDN_BASE     = 'https://community.akamai.steamstatic.com/economy/image/';
const CDN_SUFFIX   = '/256fx256f';

async function main() {
  // 1. Fetch Waxpeer bulk data (includes img field)
  console.log('[images] Buscando dados do Waxpeer...');
  const res = await fetch(WAXPEER_URL, {
    signal: AbortSignal.timeout(30000),
    headers: { 'User-Agent': 'tradexGG/1.0' },
  });

  if (!res.ok) throw new Error('Waxpeer HTTP ' + res.status);
  const data = await res.json();

  if (!data.success || !Array.isArray(data.items)) {
    throw new Error('Resposta invalida do Waxpeer');
  }

  // Build map: market_hash_name → full CDN image URL
  const imgMap = {};
  for (const item of data.items) {
    if (item.name && item.img) {
      // img pode ser hash puro ou URL completa
      const imgUrl = item.img.startsWith('http')
        ? item.img
        : CDN_BASE + item.img + CDN_SUFFIX;
      imgMap[item.name] = imgUrl;
    }
  }
  console.log('[images] ' + Object.keys(imgMap).length + ' imagens recebidas do Waxpeer');

  // 2. Buscar todas as skins com market_hash_name no banco
  const { rows: skins } = await pool.query(
    'SELECT id, name, market_hash_name, image_url FROM skins WHERE market_hash_name IS NOT NULL ORDER BY id'
  );

  console.log('[images] ' + skins.length + ' skins para verificar\n');

  let updated = 0, notFound = 0, unchanged = 0;

  for (const skin of skins) {
    const newUrl = imgMap[skin.market_hash_name];

    if (!newUrl) {
      console.warn('[images] ✗ ' + skin.name + ' — nao encontrado no Waxpeer');
      notFound++;
      continue;
    }

    if (skin.image_url === newUrl) {
      unchanged++;
      continue;
    }

    console.log('[images] ✓ ' + skin.name);
    console.log('          ANTES: ' + (skin.image_url || '').substring(0, 70));
    console.log('          APOS:  ' + newUrl.substring(0, 70));

    if (!DRY_RUN) {
      await pool.query('UPDATE skins SET image_url = $1 WHERE id = $2', [newUrl, skin.id]);
    }
    updated++;
  }

  console.log('\n' + '─'.repeat(60));
  console.log('Atualizadas: ' + updated);
  console.log('Sem mudanca: ' + unchanged);
  console.log('Nao encontradas: ' + notFound);
  if (DRY_RUN) console.log('\n[dry-run] Nenhuma alteracao salva.');

  await pool.end();
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
