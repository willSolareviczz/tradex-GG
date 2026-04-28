-- tradex-GG
-- @author willSolareviczz
-- @github https://github.com/willSolareviczz/tradex-GG
-- @section database
-- =====================================================
-- tradexGG — patch-cases-images.sql
-- Corrige image_url e category de todas as cases.
-- Execute este arquivo no banco existente:
--   psql $DATABASE_URL -f database/patch-cases-images.sql
-- =====================================================

-- ─── AK-47 → category: rifles ──────────────────────
UPDATE cases SET image_url = '/assets/images/cases/iniciante.svg',   category = 'rifles'  WHERE id = 1;
UPDATE cases SET image_url = '/assets/images/cases/revolution.svg',  category = 'rifles'  WHERE id = 2;
UPDATE cases SET image_url = '/assets/images/cases/kilowatt.svg',    category = 'rifles'  WHERE id = 3;

-- ─── M4 → category: rifles ─────────────────────────
UPDATE cases SET image_url = '/assets/images/cases/bronze.svg',      category = 'rifles'  WHERE id = 4;
UPDATE cases SET image_url = '/assets/images/cases/clutch.svg',      category = 'rifles'  WHERE id = 5;
UPDATE cases SET image_url = '/assets/images/cases/fracture.svg',    category = 'rifles'  WHERE id = 6;

-- ─── AWP → category: snipers ───────────────────────
UPDATE cases SET image_url = '/assets/images/cases/iniciante.svg',   category = 'snipers' WHERE id = 7;
UPDATE cases SET image_url = '/assets/images/cases/dreams-nightmares.svg', category = 'snipers' WHERE id = 8;
UPDATE cases SET image_url = '/assets/images/cases/valor.svg',       category = 'snipers' WHERE id = 9;

-- ─── SMG → category: smg ───────────────────────────
UPDATE cases SET image_url = '/assets/images/cases/bronze.svg',      category = 'smg'     WHERE id = 10;
UPDATE cases SET image_url = '/assets/images/cases/clutch.svg',      category = 'smg'     WHERE id = 11;
UPDATE cases SET image_url = '/assets/images/cases/revolution.svg',  category = 'smg'     WHERE id = 12;

-- ─── Pistolas → category: pistols ──────────────────
UPDATE cases SET image_url = '/assets/images/cases/bronze.svg',      category = 'pistols' WHERE id = 13;
UPDATE cases SET image_url = '/assets/images/cases/clutch.svg',      category = 'pistols' WHERE id = 14;
UPDATE cases SET image_url = '/assets/images/cases/fracture.svg',    category = 'pistols' WHERE id = 15;
UPDATE cases SET image_url = '/assets/images/cases/kilowatt.svg',    category = 'pistols' WHERE id = 16;

-- ─── Facas → category: knives ──────────────────────
UPDATE cases SET image_url = '/assets/images/cases/clutch.svg',      category = 'knives'  WHERE id = 17;
UPDATE cases SET image_url = '/assets/images/cases/fracture.svg',    category = 'knives'  WHERE id = 18;
UPDATE cases SET image_url = '/assets/images/cases/dreams-nightmares.svg', category = 'knives' WHERE id = 19;
UPDATE cases SET image_url = '/assets/images/cases/kukri-knife.svg', category = 'knives'  WHERE id = 20;

-- Confirmação
SELECT id, name, category, image_url FROM cases ORDER BY id;
