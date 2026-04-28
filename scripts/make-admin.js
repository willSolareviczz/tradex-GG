#!/usr/bin/env node
/**
 * make-admin.js — Promove um usuário para role='admin'
 *
 * Uso:
 *   node scripts/make-admin.js <username_ou_email>
 *
 * Exemplo:
 *   node scripts/make-admin.js wills
 */

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Uso: node scripts/make-admin.js <username_ou_email>');
    process.exit(1);
  }

  const result = await pool.query(
    `UPDATE users SET role = 'admin'
     WHERE username = $1 OR email = $1
     RETURNING id, username, email, role`,
    [target]
  );

  if (result.rowCount === 0) {
    console.error(`Usuário "${target}" não encontrado.`);
    process.exit(1);
  }

  const u = result.rows[0];
  console.log(`✓ Usuário promovido a admin:`);
  console.log(`  ID:       ${u.id}`);
  console.log(`  Username: ${u.username}`);
  console.log(`  Email:    ${u.email}`);
  console.log(`  Role:     ${u.role}`);

  await pool.end();
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
