-- tradex-GG
-- @author willSolareviczz
-- @github https://github.com/willSolareviczz/tradex-GG
-- @section database
-- =====================================================
-- tradexGG — rename-cases.sql
-- Renomeia as cases com nomes temáticos estilizados.
-- Execute: psql $DATABASE_URL -f database/rename-cases.sql
-- =====================================================

-- ─── Rifles (AK + M4) ──────────────────────────────
UPDATE cases SET name = 'Inferno'      WHERE id = 1;  -- AK Safari   → fogo/vermelho
UPDATE cases SET name = 'Blitzkrieg'   WHERE id = 2;  -- AK Redline  → relâmpago
UPDATE cases SET name = 'Phantom'      WHERE id = 3;  -- AK Vulcan   → sombra/azul
UPDATE cases SET name = 'Easy Start'   WHERE id = 4;  -- M4 Starter  → iniciante
UPDATE cases SET name = 'Dragon'       WHERE id = 5;  -- M4 Dragon   → laranja
UPDATE cases SET name = 'Printstream'  WHERE id = 6;  -- M4 Print    → neon

-- ─── Snipers (AWP) ─────────────────────────────────
UPDATE cases SET name = 'Venom'        WHERE id = 7;  -- AWP Starter → verde
UPDATE cases SET name = 'Hyper Beast'  WHERE id = 8;  -- AWP HB      → roxo
UPDATE cases SET name = 'Asiimov'      WHERE id = 9;  -- AWP Asiimov → laranja

-- ─── SMG ───────────────────────────────────────────
UPDATE cases SET name = 'Neon Rush'    WHERE id = 10; -- SMG Starter → ciano
UPDATE cases SET name = 'Overdrive'    WHERE id = 11; -- SMG Pack    → amarelo
UPDATE cases SET name = 'Asiimov X'    WHERE id = 12; -- P90 Asiimov → teal

-- ─── Pistolas ──────────────────────────────────────
UPDATE cases SET name = 'First Strike' WHERE id = 13; -- Pistol Start → amarelo
UPDATE cases SET name = 'Mil-Spec'     WHERE id = 14; -- Pistol Pack  → roxo
UPDATE cases SET name = 'Ghost'        WHERE id = 15; -- USP-S        → branco
UPDATE cases SET name = 'Hell'         WHERE id = 16; -- Deagle Blaze → fogo

-- ─── Facas ─────────────────────────────────────────
UPDATE cases SET name = 'Shadow'       WHERE id = 17; -- Gut/Navaja   → roxo escuro
UPDATE cases SET name = 'Ruby'         WHERE id = 18; -- Flip Knife   → vermelho
UPDATE cases SET name = 'Butterfly'    WHERE id = 19; -- Butterfly    → ouro
UPDATE cases SET name = 'Karambit'     WHERE id = 20; -- Karambit     → crimson

-- Confirmação
SELECT id, name, category FROM cases ORDER BY id;
