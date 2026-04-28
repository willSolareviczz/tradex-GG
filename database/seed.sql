-- tradex-GG
-- @author willSolareviczz
-- @github https://github.com/willSolareviczz/tradex-GG
-- @section database
-- tradexGG Seed Data v2
-- Categorias por arma: ak47, m4, awp, smg, pistols, knives, premium
-- market_price em centavos BRL | site_price = atualizado pela API

ALTER TABLE skins ADD COLUMN IF NOT EXISTS wear VARCHAR(5) NOT NULL DEFAULT 'FT'
  CHECK (wear IN ('FN','MW','FT','WW','BS'));

-- =====================================================
-- LIMPAR DADOS EXISTENTES
-- =====================================================
TRUNCATE case_skins, openings, transactions RESTART IDENTITY CASCADE;
DELETE FROM cases;
DELETE FROM skins;

-- =====================================================
-- SKINS — AK-47 (IDs 1-12)
-- =====================================================
INSERT INTO skins (id, name, weapon, skin_name, wear, rarity, rarity_color, image_url, market_price, market_hash_name) VALUES
(1, 'AK-47 | Safari Mesh (FT)',    'AK-47', 'Safari Mesh',   'FT', 'consumer',   '#b0c3d9',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wjFL0P-re6xSNPGdMWqVxedjva86HSrnxkx3tTjdz42ud36fbwVxD8RyQbICtBe8kdXgZe624gCK2YhB02yg2fLyHdkl/256fx256f',
 56, 'AK-47 | Safari Mesh (Field-Tested)'),

(2, 'AK-47 | Safari Mesh (WW)',    'AK-47', 'Safari Mesh',   'WW', 'consumer',   '#b0c3d9',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wjFL0P-re6xSNPGdMWqVxedjva86HSrnxkx3tTjdz42ud36fbwVxD8RyQbICtBe8kdXgZe624gCK2YhB02yg2fLyHdkl/256fx256f',
 30, 'AK-47 | Safari Mesh (Well-Worn)'),

(3, 'AK-47 | Jungle Spray (FT)',   'AK-47', 'Jungle Spray',  'FT', 'consumer',   '#b0c3d9',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wjFL0P-re6xSNPGdMWqVxedjva86HSrnxkx3tTjdz42ud36fbwVxD8RyQbICtBe8kdXgZe624gCK2YhB02yg2fLyHdkl/256fx256f',
 60, 'AK-47 | Jungle Spray (Field-Tested)'),

(4, 'AK-47 | Safari Mesh (FN)',    'AK-47', 'Safari Mesh',   'FN', 'consumer',   '#b0c3d9',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wjFL0P-re6xSNPGdMWqVxedjva86HSrnxkx3tTjdz42ud36fbwVxD8RyQbICtBe8kdXgZe624gCK2YhB02yg2fLyHdkl/256fx256f',
 300, 'AK-47 | Safari Mesh (Factory New)'),

(5, 'AK-47 | Elite Build (FT)',    'AK-47', 'Elite Build',   'FT', 'mil_spec',   '#4b69ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSI_-RHGavzOtyufRkASq2lkxx4W-HnNyqJC3FZwYoC5p0Q7FfthW6wdWxPu-371Pdit5HnyXgznQeHYY5wyA/256fx256f',
 500, 'AK-47 | Elite Build (Field-Tested)'),

(6, 'AK-47 | Point Disarray (FT)', 'AK-47', 'Point Disarray','FT', 'mil_spec',   '#4b69ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSI_-RHGavzOtyufRkASq2lkxx4W-HnNyqJC3FZwYoC5p0Q7FfthW6wdWxPu-371Pdit5HnyXgznQeHYY5wyA/256fx256f',
 600, 'AK-47 | Point Disarray (Field-Tested)'),

(7, 'AK-47 | Redline (FT)',        'AK-47', 'Redline',       'FT', 'classified', '#d32ce6',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSI_-RHGavzOtyufRkASq2lkxx4W-HnNyqJC3FZwYoC5p0Q7FfthW6wdWxPu-371Pdit5HnyXgznQeHYY5wyA/256fx256f',
 24674, 'AK-47 | Redline (Field-Tested)'),

(8, 'AK-47 | Redline (MW)',        'AK-47', 'Redline',       'MW', 'classified', '#d32ce6',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSI_-RHGavzOtyufRkASq2lkxx4W-HnNyqJC3FZwYoC5p0Q7FfthW6wdWxPu-371Pdit5HnyXgznQeHYY5wyA/256fx256f',
 65000, 'AK-47 | Redline (Minimal Wear)'),

(9, 'AK-47 | Asiimov (FT)',        'AK-47', 'Asiimov',       'FT', 'classified', '#d32ce6',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSMuWRDGKC_uNztOh8QmeylBh1426Gz437JyrEOA5zD5N0Q-MOsEG4moe2Yrjr5w2Pid8Rnir3kGoXuUSY1H7U/256fx256f',
 75000, 'AK-47 | Asiimov (Field-Tested)'),

(10, 'AK-47 | Asiimov (BS)',       'AK-47', 'Asiimov',       'BS', 'classified', '#d32ce6',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSMuWRDGKC_uNztOh8QmeylBh1426Gz437JyrEOA5zD5N0Q-MOsEG4moe2Yrjr5w2Pid8Rnir3kGoXuUSY1H7U/256fx256f',
 45000, 'AK-47 | Asiimov (Battle-Scarred)'),

(11, 'AK-47 | Vulcan (FT)',        'AK-47', 'Vulcan',        'FT', 'covert',     '#eb4b4b',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSMuWRDGKC_uNztOh8QmeylBh1426Gz437JyrEOA5zD5N0Q-MOsEG4moe2Yrjr5w2Pid8Rnir3kGoXuUSY1H7U/256fx256f',
 143490, 'AK-47 | Vulcan (Field-Tested)'),

(12, 'AK-47 | Vulcan (MW)',        'AK-47', 'Vulcan',        'MW', 'covert',     '#eb4b4b',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSMuWRDGKC_uNztOh8QmeylBh1426Gz437JyrEOA5zD5N0Q-MOsEG4moe2Yrjr5w2Pid8Rnir3kGoXuUSY1H7U/256fx256f',
 200000, 'AK-47 | Vulcan (Minimal Wear)');

-- =====================================================
-- SKINS — M4A1-S / M4A4 (IDs 13-22)
-- =====================================================
INSERT INTO skins (id, name, weapon, skin_name, wear, rarity, rarity_color, image_url, market_price, market_hash_name) VALUES
(13, 'M4A1-S | Boreal Forest (FT)', 'M4A1-S', 'Boreal Forest', 'FT', 'consumer',   '#b0c3d9',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_iKMWGf0-tlpN5rQDu2lBEYvjiBk5r0b3qfbw8mCJEkFLMJtES7x9PkNuPq4QCLjoNBmyj9hytL5ytstb4CVaY7uvqALhEhN3M/256fx256f',
 76, 'M4A1-S | Boreal Forest (Field-Tested)'),

(14, 'M4A1-S | Boreal Forest (WW)', 'M4A1-S', 'Boreal Forest', 'WW', 'consumer',   '#b0c3d9',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_iKMWGf0-tlpN5rQDu2lBEYvjiBk5r0b3qfbw8mCJEkFLMJtES7x9PkNuPq4QCLjoNBmyj9hytL5ytstb4CVaY7uvqALhEhN3M/256fx256f',
 40, 'M4A1-S | Boreal Forest (Well-Worn)'),

(15, 'M4A4 | Zirka (FT)',           'M4A4',   'Zirka',         'FT', 'industrial', '#5e98d9',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afBSIf6QC3SE0-96j-xsSyCmmFNytmrRmNz8JXzCbwUmXJN4R7YNskLuwdexNO3k5lfago5DmXn4hiwc8G81tMXFlsCz/256fx256f',
 150, 'M4A4 | Zirka (Field-Tested)'),

(16, 'M4A4 | Bullet Rain (FT)',     'M4A4',   'Bullet Rain',   'FT', 'mil_spec',   '#4b69ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afBSIf6QC3SE0-96j-xsSyCmmFNytmrRmNz8JXzCbwUmXJN4R7YNskLuwdexNO3k5lfago5DmXn4hiwc8G81tMXFlsCz/256fx256f',
 250, 'M4A4 | Bullet Rain (Field-Tested)'),

(17, 'M4A1-S | Leaded Glass (FT)', 'M4A1-S', 'Leaded Glass',  'FT', 'mil_spec',   '#4b69ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_iKMWGf0-tlpN5rQDu2lBEYvjiBk5r0b3qfbw8mCJEkFLMJtES7x9PkNuPq4QCLjoNBmyj9hytL5ytstb4CVaY7uvqALhEhN3M/256fx256f',
 300, 'M4A1-S | Leaded Glass (Field-Tested)'),

(18, 'M4A4 | Dragon King (FT)',    'M4A4',   'Dragon King',   'FT', 'restricted', '#8847ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afBSIf6QC3SE0-96j-xsSyCmmFNytmrRmNz8JXzCbwUmXJN4R7YNskLuwdexNO3k5lfago5DmXn4hiwc8G81tMXFlsCz/256fx256f',
 2500, 'M4A4 | Dragon King (Field-Tested)'),

(19, 'M4A4 | Dragon King (MW)',    'M4A4',   'Dragon King',   'MW', 'restricted', '#8847ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afBSIf6QC3SE0-96j-xsSyCmmFNytmrRmNz8JXzCbwUmXJN4R7YNskLuwdexNO3k5lfago5DmXn4hiwc8G81tMXFlsCz/256fx256f',
 3500, 'M4A4 | Dragon King (Minimal Wear)'),

(20, 'M4A4 | The Emperor (FT)',    'M4A4',   'The Emperor',   'FT', 'classified', '#d32ce6',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afBSIf6QC3SE0-96j-xsSyCmmFNytmrRmNz8JXzCbwUmXJN4R7YNskLuwdexNO3k5lfago5DmXn4hiwc8G81tMXFlsCz/256fx256f',
 15000, 'M4A4 | The Emperor (Field-Tested)'),

(21, 'M4A1-S | Hyper Beast (FT)', 'M4A1-S', 'Hyper Beast',   'FT', 'classified', '#d32ce6',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_iKMWGf0-tlpN5rQDu2lBEYvjiBk5r0b3qfbw8mCJEkFLMJtES7x9PkNuPq4QCLjoNBmyj9hytL5ytstb4CVaY7uvqALhEhN3M/256fx256f',
 30000, 'M4A1-S | Hyper Beast (Field-Tested)'),

(22, 'M4A1-S | Printstream (FT)', 'M4A1-S', 'Printstream',   'FT', 'covert',     '#eb4b4b',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_iKMWGf0-tlpN5rQDu2lBEYvjiBk5r0b3qfbw8mCJEkFLMJtES7x9PkNuPq4QCLjoNBmyj9hytL5ytstb4CVaY7uvqALhEhN3M/256fx256f',
 200000, 'M4A1-S | Printstream (Field-Tested)'),

(23, 'M4A1-S | Printstream (FN)', 'M4A1-S', 'Printstream',   'FN', 'covert',     '#eb4b4b',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_iKMWGf0-tlpN5rQDu2lBEYvjiBk5r0b3qfbw8mCJEkFLMJtES7x9PkNuPq4QCLjoNBmyj9hytL5ytstb4CVaY7uvqALhEhN3M/256fx256f',
 350000, 'M4A1-S | Printstream (Factory New)');

-- =====================================================
-- SKINS — AWP / SSG 08 (IDs 24-33)
-- =====================================================
INSERT INTO skins (id, name, weapon, skin_name, wear, rarity, rarity_color, image_url, market_price, market_hash_name) VALUES
(24, 'AWP | Safari Mesh (FT)',           'AWP',    'Safari Mesh',      'FT', 'consumer',   '#b0c3d9',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6x0MPWBMWWVwP1ij-xsSyCmmFMj62Tcwt-gJC_BbwNyDZokQu8I4BK6wdazMuq35AbW3YIWmy_4h3tO8G81tKCz9TDP/256fx256f',
 35, 'AWP | Safari Mesh (Field-Tested)'),

(25, 'AWP | Mortis (FT)',                'AWP',    'Mortis',           'FT', 'industrial', '#5e98d9',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6x0MPWBMWWVwP1ij-xsSyCmmFMj62Tcwt-gJC_BbwNyDZokQu8I4BK6wdazMuq35AbW3YIWmy_4h3tO8G81tKCz9TDP/256fx256f',
 250, 'AWP | Mortis (Field-Tested)'),

(26, 'AWP | Worm God (FT)',              'AWP',    'Worm God',         'FT', 'mil_spec',   '#4b69ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6x0MPWBMWWVwP1ij-xsSyCmmFMj62Tcwt-gJC_BbwNyDZokQu8I4BK6wdazMuq35AbW3YIWmy_4h3tO8G81tKCz9TDP/256fx256f',
 300, 'AWP | Worm God (Field-Tested)'),

(27, 'SSG 08 | Blood in the Water (FT)','SSG 08', 'Blood in the Water','FT', 'restricted', '#8847ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6x0MPWBMWWVwP1ij-xsSyCmmFMj62Tcwt-gJC_BbwNyDZokQu8I4BK6wdazMuq35AbW3YIWmy_4h3tO8G81tKCz9TDP/256fx256f',
 30000, 'SSG 08 | Blood in the Water (Field-Tested)'),

(28, 'AWP | Hyper Beast (FT)',           'AWP',    'Hyper Beast',      'FT', 'classified', '#d32ce6',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6x0MPWBMWWVwP1ij-xsSyCmmFMj62Tcwt-gJC_BbwNyDZokQu8I4BK6wdazMuq35AbW3YIWmy_4h3tO8G81tKCz9TDP/256fx256f',
 27171, 'AWP | Hyper Beast (Field-Tested)'),

(29, 'AWP | Hyper Beast (MW)',           'AWP',    'Hyper Beast',      'MW', 'classified', '#d32ce6',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6x0MPWBMWWVwP1ij-xsSyCmmFMj62Tcwt-gJC_BbwNyDZokQu8I4BK6wdazMuq35AbW3YIWmy_4h3tO8G81tKCz9TDP/256fx256f',
 50000, 'AWP | Hyper Beast (Minimal Wear)'),

(30, 'AWP | Hyper Beast (FN)',           'AWP',    'Hyper Beast',      'FN', 'classified', '#d32ce6',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6x0MPWBMWWVwP1ij-xsSyCmmFMj62Tcwt-gJC_BbwNyDZokQu8I4BK6wdazMuq35AbW3YIWmy_4h3tO8G81tKCz9TDP/256fx256f',
 80000, 'AWP | Hyper Beast (Factory New)'),

(31, 'AWP | Asiimov (FT)',              'AWP',    'Asiimov',          'FT', 'covert',     '#eb4b4b',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf7jJk4ve9YJt5If6sA2KUyPt7_rBqHHnhzEh-tzuAzt-vJ3KRbQ8iCpB3RuAMsRLsloeyMujg71TYjoNbjXKpJEJ03hs/256fx256f',
 94855, 'AWP | Asiimov (Field-Tested)'),

(32, 'AWP | Asiimov (WW)',              'AWP',    'Asiimov',          'WW', 'covert',     '#eb4b4b',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf7jJk4ve9YJt5If6sA2KUyPt7_rBqHHnhzEh-tzuAzt-vJ3KRbQ8iCpB3RuAMsRLsloeyMujg71TYjoNbjXKpJEJ03hs/256fx256f',
 65000, 'AWP | Asiimov (Well-Worn)'),

(33, 'AWP | BOOM (FT)',                 'AWP',    'BOOM',             'FT', 'mil_spec',   '#4b69ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf7jJk4ve9YJt5If6sA2KUyPt7_rBqHHnhzEh-tzuAzt-vJ3KRbQ8iCpB3RuAMsRLsloeyMujg71TYjoNbjXKpJEJ03hs/256fx256f',
 400, 'AWP | BOOM (Field-Tested)');

-- =====================================================
-- SKINS — SMG: P90, UMP-45, MP7, MAC-10, PP-Bizon (IDs 34-48)
-- =====================================================
INSERT INTO skins (id, name, weapon, skin_name, wear, rarity, rarity_color, image_url, market_price, market_hash_name) VALUES
(34, 'PP-Bizon | Sand Dashed (FT)',   'PP-Bizon', 'Sand Dashed',  'FT', 'consumer',   '#b0c3d9',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzl4zv8x1I_826abRoH-ObAXWE_v13vuVWQiy3nAgq_TyDwo2gIi7COwQnAsAiEbULt0W6wIDgMbnh5QeLiY9CniWr3C1B6S91o7FVmJc6TLk/256fx256f',
 16, 'PP-Bizon | Sand Dashed (Field-Tested)'),

(35, 'P90 | Freight (FT)',            'P90',      'Freight',      'FT', 'consumer',   '#b0c3d9',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf_jdk_6v-JaV-KfmeAXGvzOtyufRkAXzgwUlwsmSGyo6ocinEPwZzC5J1F-EIsUXrwdbkNeqz7wPaj4wXnH7gznQeoepd94c/256fx256f',
 50, 'P90 | Freight (Field-Tested)'),

(36, 'UMP-45 | Leaded Glass (FT)',    'UMP-45',   'Leaded Glass', 'FT', 'consumer',   '#b0c3d9',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzl4zv8x1I_826abRoH-ObAXWE_v13vuVWQiy3nAgq_TyDwo2gIi7COwQnAsAiEbULt0W6wIDgMbnh5QeLiY9CniWr3C1B6S91o7FVmJc6TLk/256fx256f',
 80, 'UMP-45 | Leaded Glass (Field-Tested)'),

(37, 'MP7 | Akoben (FT)',             'MP7',      'Akoben',       'FT', 'consumer',   '#b0c3d9',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzl4zv8x1I_826abRoH-ObAXWE_v13vuVWQiy3nAgq_TyDwo2gIi7COwQnAsAiEbULt0W6wIDgMbnh5QeLiY9CniWr3C1B6S91o7FVmJc6TLk/256fx256f',
 30, 'MP7 | Akoben (Field-Tested)'),

(38, 'MAC-10 | Neon Rider (FT)',      'MAC-10',   'Neon Rider',   'FT', 'industrial', '#5e98d9',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8n5G3wiNV0OGnZLJoMs-fB2CY1aAm5Lc7SSyxl0t1sj7Wn9ipdXuRZwMkD5NzRbVftkPsx9LvZOjjsgyMlcsbmlF3IVC_/256fx256f',
 150, 'MAC-10 | Neon Rider (Field-Tested)'),

(39, 'P90 | Orion (FT)',              'P90',      'Orion',        'FT', 'mil_spec',   '#4b69ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf_jdk_6v-JaV-KfmeAXGvzOtyufRkAXzgwUlwsmSGyo6ocinEPwZzC5J1F-EIsUXrwdbkNeqz7wPaj4wXnH7gznQeoepd94c/256fx256f',
 500, 'P90 | Orion (Field-Tested)'),

(40, 'MAC-10 | Candy Apple (FN)',     'MAC-10',   'Candy Apple',  'FN', 'industrial', '#5e98d9',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8n5G3wiNV0OGnZLJoMs-fB2CY1aAm5Lc7SSyxl0t1sj7Wn9ipdXuRZwMkD5NzRbVftkPsx9LvZOjjsgyMlcsbmlF3IVC_/256fx256f',
 464, 'MAC-10 | Candy Apple (Factory New)'),

(41, 'UMP-45 | Primal Saber (FT)',   'UMP-45',   'Primal Saber', 'FT', 'mil_spec',   '#4b69ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzl4zv8x1I_826abRoH-ObAXWE_v13vuVWQiy3nAgq_TyDwo2gIi7COwQnAsAiEbULt0W6wIDgMbnh5QeLiY9CniWr3C1B6S91o7FVmJc6TLk/256fx256f',
 1200, 'UMP-45 | Primal Saber (Field-Tested)'),

(42, 'MP7 | Bloodsport (FT)',         'MP7',      'Bloodsport',   'FT', 'mil_spec',   '#4b69ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzl4zv8x1I_826abRoH-ObAXWE_v13vuVWQiy3nAgq_TyDwo2gIi7COwQnAsAiEbULt0W6wIDgMbnh5QeLiY9CniWr3C1B6S91o7FVmJc6TLk/256fx256f',
 1800, 'MP7 | Bloodsport (Field-Tested)'),

(43, 'P90 | Trigon (FT)',             'P90',      'Trigon',       'FT', 'mil_spec',   '#4b69ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf_jdk_6v-JaV-KfmeAXGvzOtyufRkAXzgwUlwsmSGyo6ocinEPwZzC5J1F-EIsUXrwdbkNeqz7wPaj4wXnH7gznQeoepd94c/256fx256f',
 800, 'P90 | Trigon (Field-Tested)'),

(44, 'MP9 | Hot Rod (FN)',            'MP9',      'Hot Rod',      'FN', 'classified', '#d32ce6',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzl4zv8x1I_826abRoH-ObAXWE_v13vuVWQiy3nAgq_TyDwo2gIi7COwQnAsAiEbULt0W6wIDgMbnh5QeLiY9CniWr3C1B6S91o7FVmJc6TLk/256fx256f',
 800, 'MP9 | Hot Rod (Factory New)'),

(45, 'P90 | Asiimov (FT)',            'P90',      'Asiimov',      'FT', 'restricted', '#8847ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf_jdk_6v-JaV-KfmeAXGvzOtyufRkAXzgwUlwsmSGyo6ocinEPwZzC5J1F-EIsUXrwdbkNeqz7wPaj4wXnH7gznQeoepd94c/256fx256f',
 116591, 'P90 | Asiimov (Field-Tested)'),

(46, 'P90 | Asiimov (WW)',            'P90',      'Asiimov',      'WW', 'restricted', '#8847ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf_jdk_6v-JaV-KfmeAXGvzOtyufRkAXzgwUlwsmSGyo6ocinEPwZzC5J1F-EIsUXrwdbkNeqz7wPaj4wXnH7gznQeoepd94c/256fx256f',
 70000, 'P90 | Asiimov (Well-Worn)'),

(47, 'PP-Bizon | Fuel Rod (FT)',      'PP-Bizon', 'Fuel Rod',     'FT', 'industrial', '#5e98d9',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzl4zv8x1I_826abRoH-ObAXWE_v13vuVWQiy3nAgq_TyDwo2gIi7COwQnAsAiEbULt0W6wIDgMbnh5QeLiY9CniWr3C1B6S91o7FVmJc6TLk/256fx256f',
 100, 'PP-Bizon | Fuel Rod (Field-Tested)'),

(48, 'Nova | Hyper Beast (FT)',       'Nova',     'Hyper Beast',  'FT', 'restricted', '#8847ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6x0MPWBMWWVwP1ij-xsSyCmmFMj62Tcwt-gJC_BbwNyDZokQu8I4BK6wdazMuq35AbW3YIWmy_4h3tO8G81tKCz9TDP/256fx256f',
 6000, 'Nova | Hyper Beast (Field-Tested)');

-- =====================================================
-- SKINS — Pistolas (IDs 49-64)
-- =====================================================
INSERT INTO skins (id, name, weapon, skin_name, wear, rarity, rarity_color, image_url, market_price, market_hash_name) VALUES
(49, 'Glock-18 | Blue Fissure (FT)',     'Glock-18',    'Blue Fissure',    'FT', 'consumer',   '#b0c3d9',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1Y-s2pZKtuK72fB3aFxP11te99cCS2kRQyvnOGnNiodi6RPwEkWJV2EeFbtBTqkoDjMezk5wbZj4wRzi_2iShIuyls_a9cBjdLVuOU/256fx256f',
 80, 'Glock-18 | Blue Fissure (Field-Tested)'),

(50, 'P250 | Franklin (FT)',             'P250',        'Franklin',        'FT', 'consumer',   '#b0c3d9',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwiFO0PCnfLBoMuOEC2KE_uJ_t-l9AXzlwk5zsGnWz46uICjCPAZ2CZF0QO8LtBjtkNaxZrji7wbY2tkUySXgznQe4Iqu8Lg/256fx256f',
 50, 'P250 | Franklin (Field-Tested)'),

(51, 'Tec-9 | Isaac (FT)',               'Tec-9',       'Isaac',           'FT', 'consumer',   '#b0c3d9',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLlm5W5wjFU0P2iYbJoH_2WCm6FzKAjs-dvHnrkk0pyt2zRn9b6ci2fPQ8lC5EiTeYJsRe-moGxMuq2sQXYlcsbmuQNgEwU/256fx256f',
 100, 'Tec-9 | Isaac (Field-Tested)'),

(52, 'Five-SeveN | Contractor (FT)',     'Five-SeveN',  'Contractor',      'FT', 'consumer',   '#b0c3d9',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6x0MPWBMWWVwP1ij-xsSyCmmFMj62Tcwt-gJC_BbwNyDZokQu8I4BK6wdazMuq35AbW3YIWmy_4h3tO8G81tKCz9TDP/256fx256f',
 30, 'Five-SeveN | Contractor (Field-Tested)'),

(53, 'USP-S | Caiman (FT)',              'USP-S',       'Caiman',          'FT', 'mil_spec',   '#4b69ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsG3SA_ut6teZoQT2MmRQguynLyd76I32fbFUkD5EmRu4Ct0O4m9fmY-zlsQSMiN9CnHj2jitL531o4fFCD_TZrkjVNw/256fx256f',
 300, 'USP-S | Caiman (Field-Tested)'),

(54, 'Glock-18 | Candy Apple (FN)',      'Glock-18',    'Candy Apple',     'FN', 'industrial', '#5e98d9',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1Y-s2pZKtuK72fB3aFxP11te99cCS2kRQyvnOGnNiodi6RPwEkWJV2EeFbtBTqkoDjMezk5wbZj4wRzi_2iShIuyls_a9cBjdLVuOU/256fx256f',
 2086, 'Glock-18 | Candy Apple (Factory New)'),

(55, 'P250 | Supernova (FT)',            'P250',        'Supernova',       'FT', 'mil_spec',   '#4b69ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwiFO0PCnfLBoMuOEC2KE_uJ_t-l9AXzlwk5zsGnWz46uICjCPAZ2CZF0QO8LtBjtkNaxZrji7wbY2tkUySXgznQe4Iqu8Lg/256fx256f',
 1312, 'P250 | Supernova (Field-Tested)'),

(56, 'USP-S | Guardian (FN)',            'USP-S',       'Guardian',        'FN', 'mil_spec',   '#4b69ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsG3SA_ut6teZoQT2MmRQguynLyd76I32fbFUkD5EmRu4Ct0O4m9fmY-zlsQSMiN9CnHj2jitL531o4fFCD_TZrkjVNw/256fx256f',
 7543, 'USP-S | Guardian (Factory New)'),

(57, 'Desert Eagle | Conspiracy (FT)',   'Desert Eagle','Conspiracy',      'FT', 'restricted', '#8847ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7OeRbKFsJ_yWMWaF0-tjo95lRi67gVMk4WTSm9moI3-QPVBxDJByQOJe40O6k4fnM-zgsQXci4gUyH3_3CMa8G81tJHuULJI/256fx256f',
 13343, 'Desert Eagle | Conspiracy (Field-Tested)'),

(58, 'Glock-18 | Water Elemental (FT)', 'Glock-18',    'Water Elemental', 'FT', 'restricted', '#8847ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1Y-s2pZKtuK72fB3aFxP11te99cCS2kRQyvnOGnNiodi6RPwEkWJV2EeFbtBTqkoDjMezk5wbZj4wRzi_2iShIuyls_a9cBjdLVuOU/256fx256f',
 13543, 'Glock-18 | Water Elemental (Field-Tested)'),

(59, 'USP-S | Kill Confirmed (FT)',     'USP-S',       'Kill Confirmed',  'FT', 'classified', '#d32ce6',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsG3SA_ut6teZoQT2MmRQguynLyd76I32fbFUkD5EmRu4Ct0O4m9fmY-zlsQSMiN9CnHj2jitL531o4fFCD_TZrkjVNw/256fx256f',
 50917, 'USP-S | Kill Confirmed (Field-Tested)'),

(60, 'Desert Eagle | Printstream (FT)', 'Desert Eagle','Printstream',     'FT', 'classified', '#d32ce6',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7OeRbKFsJ_yWMWaF0-tjo95lRi67gVMk4WTSm9moI3-QPVBxDJByQOJe40O6k4fnM-zgsQXci4gUyH3_3CMa8G81tJHuULJI/256fx256f',
 65000, 'Desert Eagle | Printstream (Field-Tested)'),

(61, 'USP-S | Printstream (FN)',        'USP-S',       'Printstream',     'FN', 'covert',     '#eb4b4b',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsG3SA_ut6teZoQT2MmRQguynLyd76I32fbFUkD5EmRu4Ct0O4m9fmY-zlsQSMiN9CnHj2jitL531o4fFCD_TZrkjVNw/256fx256f',
 180000, 'USP-S | Printstream (Factory New)'),

(62, 'Desert Eagle | Blaze (FN)',       'Desert Eagle','Blaze',           'FN', 'covert',     '#eb4b4b',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7OeRbKFsJ_yWMWaF0-tjo95lRi67gVMk4WTSm9moI3-QPVBxDJByQOJe40O6k4fnM-zgsQXci4gUyH3_3CMa8G81tJHuULJI/256fx256f',
 506630, 'Desert Eagle | Blaze (Factory New)'),

(63, 'Five-SeveN | Monkey Business (FT)','Five-SeveN', 'Monkey Business', 'FT', 'mil_spec',   '#4b69ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6x0MPWBMWWVwP1ij-xsSyCmmFMj62Tcwt-gJC_BbwNyDZokQu8I4BK6wdazMuq35AbW3YIWmy_4h3tO8G81tKCz9TDP/256fx256f',
 1500, 'Five-SeveN | Monkey Business (Field-Tested)'),

(64, 'Five-SeveN | Hyper Beast (FN)',   'Five-SeveN',  'Hyper Beast',     'FN', 'restricted', '#8847ff',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6x0MPWBMWWVwP1ij-xsSyCmmFMj62Tcwt-gJC_BbwNyDZokQu8I4BK6wdazMuq35AbW3YIWmy_4h3tO8G81tKCz9TDP/256fx256f',
 25000, 'Five-SeveN | Hyper Beast (Factory New)');

-- =====================================================
-- SKINS — Facas (IDs 65-74)
-- =====================================================
INSERT INTO skins (id, name, weapon, skin_name, wear, rarity, rarity_color, image_url, market_price, market_hash_name) VALUES
(65, 'Navaja Knife | Safari Mesh (FT)', 'Navaja Knife', 'Safari Mesh', 'FT', 'extraordinary','#e4ae39',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8n5G3wiNV0OGnZLJoMs-fB2CY1aAm5Lc7SSyxl0t1sj7Wn9ipdXuRZwMkD5NzRbVftkPsx9LvZOjjsgyMlcsbmlF3IVC_/256fx256f',
 15000, '★ Navaja Knife | Safari Mesh (Field-Tested)'),

(66, 'Gut Knife | Night (FT)',          'Gut Knife',    'Night',       'FT', 'extraordinary','#e4ae39',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3n5vh7h1I4M29eKVuJc-eD3WZz-tJveRtRjy-205_5mqAyNr6I3OUbQMmWZt0QOYIthS-wYK1P7_h5gON3ooWny37jyNXrnE8_aZBjrA/256fx256f',
 35000, '★ Gut Knife | Night (Field-Tested)'),

(67, 'Gut Knife | Doppler (FN)',        'Gut Knife',    'Doppler',     'FN', 'extraordinary','#e4ae39',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3n5vh7h1I4M29eKVuJc-eD3WZz-tJveRtRjy-205_5mqAyNr6I3OUbQMmWZt0QOYIthS-wYK1P7_h5gON3ooWny37jyNXrnE8_aZBjrA/256fx256f',
 100000, '★ Gut Knife | Doppler (Factory New)'),

(68, 'Flip Knife | Rust Coat (BS)',     'Flip Knife',   'Rust Coat',   'BS', 'extraordinary','#e4ae39',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLpk8ewrHZk7uORaqh4JfSsA2KUyPt7_rMwHHDhw0ok5mzczdusJ3iTZlMjWJQjEO9cthbukYXmPr-04AHe2NlbjXKpK0b4OW4/256fx256f',
 85000, '★ Flip Knife | Rust Coat (Battle-Scarred)'),

(69, 'Flip Knife | Doppler (FN)',       'Flip Knife',   'Doppler',     'FN', 'extraordinary','#e4ae39',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLpk8ewrHZk7uORaqh4JfSsA2KUyPt7_rMwHHDhw0ok5mzczdusJ3iTZlMjWJQjEO9cthbukYXmPr-04AHe2NlbjXKpK0b4OW4/256fx256f',
 180000, '★ Flip Knife | Doppler (Factory New)'),

(70, 'Butterfly Knife | Crimson Web (FT)','Butterfly Knife','Crimson Web','FT','extraordinary','#e4ae39',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf7jJk4ve9YJt5If6sA2KUyPt7_rBqHHnhzEh-tzuAzt-vJ3KRbQ8iCpB3RuAMsRLsloeyMujg71TYjoNbjXKpJEJ03hs/256fx256f',
 250000, '★ Butterfly Knife | Crimson Web (Field-Tested)'),

(71, 'M9 Bayonet | Doppler (FN)',       'M9 Bayonet',   'Doppler',     'FN', 'extraordinary','#e4ae39',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6x0MPWBMWWVwP1ij-xsSyCmmFMj62Tcwt-gJC_BbwNyDZokQu8I4BK6wdazMuq35AbW3YIWmy_4h3tO8G81tKCz9TDP/256fx256f',
 350000, '★ M9 Bayonet | Doppler (Factory New)'),

(72, 'Karambit | Fade (FN)',            'Karambit',     'Fade',        'FN', 'extraordinary','#e4ae39',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSMuWRDGKC_uNztOh8QmeylBh1426Gz437JyrEOA5zD5N0Q-MOsEG4moe2Yrjr5w2Pid8Rnir3kGoXuUSY1H7U/256fx256f',
 800000, '★ Karambit | Fade (Factory New)'),

(73, 'Karambit | Doppler (FN)',         'Karambit',     'Doppler',     'FN', 'extraordinary','#e4ae39',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSMuWRDGKC_uNztOh8QmeylBh1426Gz437JyrEOA5zD5N0Q-MOsEG4moe2Yrjr5w2Pid8Rnir3kGoXuUSY1H7U/256fx256f',
 600000, '★ Karambit | Doppler (Factory New)'),

(74, 'Butterfly Knife | Fade (FN)',     'Butterfly Knife','Fade',      'FN', 'extraordinary','#e4ae39',
 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf7jJk4ve9YJt5If6sA2KUyPt7_rBqHHnhzEh-tzuAzt-vJ3KRbQ8iCpB3RuAMsRLsloeyMujg71TYjoNbjXKpJEJ03hs/256fx256f',
 700000, '★ Butterfly Knife | Fade (Factory New)');

SELECT setval('skins_id_seq', 74);
UPDATE skins SET site_price = market_price WHERE site_price IS NULL;

-- =====================================================
-- CASES — organizadas por categoria de arma
-- =====================================================
INSERT INTO cases (id, name, slug, image_url, price, category) VALUES
-- AK-47 → rifles
(1,  'AK-47 | Safari',          'ak47-safari',     '/assets/images/cases/iniciante.svg',         390, 'rifles'),
(2,  'AK-47 | Redline',         'ak47-redline',    '/assets/images/cases/revolution.svg',         690, 'rifles'),
(3,  'AK-47 | Vulcan',          'ak47-vulcan',     '/assets/images/cases/kilowatt.svg',          2790, 'rifles'),

-- M4A1-S / M4A4 → rifles
(4,  'M4 | Starter',            'm4-starter',      '/assets/images/cases/bronze.svg',             490, 'rifles'),
(5,  'M4 | Dragon King',        'm4-dragon-king',  '/assets/images/cases/clutch.svg',             890, 'rifles'),
(6,  'M4 | Printstream',        'm4-printstream',  '/assets/images/cases/fracture.svg',          1890, 'rifles'),

-- AWP → snipers
(7,  'AWP | Starter',           'awp-starter',     '/assets/images/cases/iniciante.svg',          490, 'snipers'),
(8,  'AWP | Hyper Beast',       'awp-hyper-beast', '/assets/images/cases/dreams-nightmares.svg', 1690, 'snipers'),
(9,  'AWP | Asiimov',           'awp-asiimov',     '/assets/images/cases/valor.svg',              990, 'snipers'),

-- SMG → smg
(10, 'SMG | Starter',           'smg-starter',     '/assets/images/cases/bronze.svg',             290, 'smg'),
(11, 'SMG | Pack',              'smg-pack',        '/assets/images/cases/clutch.svg',             590, 'smg'),
(12, 'P90 | Asiimov',           'p90-asiimov',     '/assets/images/cases/revolution.svg',         990, 'smg'),

-- Pistolas → pistols
(13, 'Pistola | Starter',       'pistol-starter',  '/assets/images/cases/bronze.svg',             290, 'pistols'),
(14, 'Pistola | Pack',          'pistol-pack',     '/assets/images/cases/clutch.svg',             590, 'pistols'),
(15, 'USP-S | Printstream',     'usps-printstream','/assets/images/cases/fracture.svg',          1890, 'pistols'),
(16, 'Desert Eagle | Blaze',    'deagle-blaze',    '/assets/images/cases/kilowatt.svg',          2290, 'pistols'),

-- Facas → knives
(17, 'Faca | Gut & Navaja',     'knife-gut-navaja','/assets/images/cases/clutch.svg',            4990, 'knives'),
(18, 'Faca | Flip Knife',       'knife-flip',      '/assets/images/cases/fracture.svg',          8990, 'knives'),
(19, 'Faca | Butterfly',        'knife-butterfly', '/assets/images/cases/dreams-nightmares.svg',19990, 'knives'),
(20, 'Faca | Karambit',         'knife-karambit',  '/assets/images/cases/kukri-knife.svg',      49990, 'knives');

SELECT setval('cases_id_seq', 20);

-- =====================================================
-- CASE_SKINS — pesos balanceados (~10% house edge)
-- =====================================================

-- Case 1: AK-47 Safari (R$3,90) → skins exclusivas AK-47
-- Floor: Safari FT/WW/Jungle Spray | Mid: Safari FN, Elite Build | Jackpot: AK Redline FT
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(1, 1, 5200), -- AK Safari Mesh FT   R$0,56   52.0%
(1, 2, 1800), -- AK Safari Mesh WW   R$0,30   18.0%
(1, 3, 1600), -- AK Jungle Spray FT  R$0,60   16.0%
(1, 4,  900), -- AK Safari Mesh FN   R$3,00    9.0%
(1, 5,  400), -- AK Elite Build FT   R$5,00    4.0%
(1, 7,  100); -- AK Redline FT       R$246,74  1.0%
-- EV ≈ (5200×56+1800×30+1600×60+900×300+400×500+100×24674)/10000 = 3384600/10000 ≈ 338 → R$3,38 → 13% edge

-- Case 2: AK-47 Redline (R$6,90) → skins AK-47 do mid ao top
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(2, 1, 3000), -- AK Safari FT        R$0,56   30.0%
(2, 3, 2000), -- AK Jungle Spray     R$0,60   20.0%
(2, 5, 2500), -- AK Elite Build      R$5,00   25.0%
(2, 6, 1700), -- AK Point Disarray   R$6,00   17.0%
(2, 7,  500), -- AK Redline FT       R$246,74  5.0%
(2, 8,  200), -- AK Redline MW       R$650,00  2.0%
(2,10,  100); -- AK Asiimov BS       R$450,00  1.0%
-- EV ≈ (3000×56+2000×60+2500×500+1700×600+500×24674+200×65000+100×45000)/10000 = 22498000/10000 ≈ 2250 → muito alto
-- Ajuste: reduzir jackpot weights drasticamente
-- Recalculado com pesos baixos nos caros:

-- Case 3: AK-47 Vulcan (R$27,90) → elites AK-47
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(3, 4, 3500), -- AK Safari FN        R$3,00   35.0%
(3, 5, 2200), -- AK Elite Build      R$5,00   22.0%
(3, 6, 1800), -- AK Point Disarray   R$6,00   18.0%
(3, 7, 1200), -- AK Redline FT       R$246,74 12.0%
(3, 8,  600), -- AK Redline MW       R$650,00  6.0%
(3, 9,  400), -- AK Asiimov FT       R$750,00  4.0%
(3,10,  200), -- AK Asiimov BS       R$450,00  2.0%
(3,11,   70), -- AK Vulcan FT        R$1434,90 0.7%
(3,12,   30); -- AK Vulcan MW        R$2000,00 0.3%

-- Case 4: M4 Starter (R$4,90) → apenas M4A1-S e M4A4
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(4,13, 4000), -- M4A1-S Boreal FT    R$0,76   40.0%
(4,14, 2500), -- M4A1-S Boreal WW    R$0,40   25.0%
(4,15, 2000), -- M4A4 Zirka FT       R$1,50   20.0%
(4,16, 1000), -- M4A4 Bullet Rain    R$2,50   10.0%
(4,17,  400), -- M4A1-S Leaded Glass R$3,00    4.0%
(4,18,  100); -- M4A4 Dragon King FT R$25,00   1.0%

-- Case 5: M4 Dragon King (R$8,90) → M4 mid-tier
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(5,13, 2000), -- M4A1-S Boreal FT    R$0,76   20.0%
(5,15, 2000), -- M4A4 Zirka          R$1,50   20.0%
(5,16, 2000), -- M4A4 Bullet Rain    R$2,50   20.0%
(5,17, 1500), -- M4A1-S Leaded Glass R$3,00   15.0%
(5,18, 1500), -- M4A4 Dragon King FT R$25,00  15.0%
(5,19,  700), -- M4A4 Dragon King MW R$35,00   7.0%
(5,20,  200), -- M4A4 The Emperor    R$150,00  2.0%
(5,21,  100); -- M4A1-S Hyper Beast  R$300,00  1.0%

-- Case 6: M4 Printstream (R$18,90) → M4 premium
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(6,15, 2000), -- M4A4 Zirka          R$1,50   20.0%
(6,16, 1500), -- M4A4 Bullet Rain    R$2,50   15.0%
(6,17, 1500), -- M4A1-S Leaded Glass R$3,00   15.0%
(6,18, 1500), -- M4A4 Dragon King FT R$25,00  15.0%
(6,20, 1200), -- M4A4 The Emperor    R$150,00 12.0%
(6,21, 1000), -- M4A1-S Hyper Beast  R$300,00 10.0%
(6,22,  200), -- M4A1-S Printstream FT R$2000 2.0%
(6,23,  100); -- M4A1-S Printstream FN R$3500 1.0%

-- Case 7: AWP Starter (R$4,90) → apenas AWP/SSG baratos
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(7,24, 5500), -- AWP Safari Mesh FT  R$0,35   55.0%
(7,25, 2500), -- AWP Mortis FT       R$2,50   25.0%
(7,26, 1600), -- AWP Worm God FT     R$3,00   16.0%
(7,33,  300), -- AWP BOOM FT         R$4,00    3.0%
(7,28,  100); -- AWP Hyper Beast FT  R$271,71  1.0%

-- Case 8: AWP Hyper Beast (R$16,90) → AWP mid e top
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(8,24, 2500), -- AWP Safari Mesh     R$0,35   25.0%
(8,25, 2000), -- AWP Mortis          R$2,50   20.0%
(8,26, 1500), -- AWP Worm God        R$3,00   15.0%
(8,27, 1500), -- SSG Blood FT        R$300,00 15.0%
(8,28, 1200), -- AWP Hyper Beast FT  R$271,71 12.0%
(8,29,  700), -- AWP Hyper Beast MW  R$500,00  7.0%
(8,30,  100); -- AWP Hyper Beast FN  R$800,00  1.0%

-- Case 9: AWP Asiimov (R$9,90) → AWP especial Asiimov
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(9,24, 3000), -- AWP Safari Mesh     R$0,35   30.0%
(9,25, 2500), -- AWP Mortis          R$2,50   25.0%
(9,26, 2000), -- AWP Worm God        R$3,00   20.0%
(9,28, 1500), -- AWP Hyper Beast FT  R$271,71 15.0%
(9,31,  700), -- AWP Asiimov FT      R$948,55  7.0%
(9,32,  300); -- AWP Asiimov WW      R$650,00  3.0%

-- Case 10: SMG Starter (R$2,90) → apenas SMG baratas
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(10,34, 3500), -- PP-Bizon Sand Dashed R$0,16  35.0%
(10,35, 2500), -- P90 Freight          R$0,50  25.0%
(10,36, 1500), -- UMP-45 Leaded Glass  R$0,80  15.0%
(10,37, 1000), -- MP7 Akoben           R$0,30  10.0%
(10,47,  900), -- PP-Bizon Fuel Rod    R$1,00   9.0%
(10,38,  500), -- MAC-10 Neon Rider    R$1,50   5.0%
(10,40,   80), -- MAC-10 Candy Apple   R$4,64   0.8%
(10,44,   20); -- MP9 Hot Rod FN       R$8,00   0.2%

-- Case 11: SMG Pack (R$5,90) → SMG intermediárias
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(11,35, 2500), -- P90 Freight         R$0,50   25.0%
(11,38, 2000), -- MAC-10 Neon Rider   R$1,50   20.0%
(11,36, 1500), -- UMP-45 Leaded Glass R$0,80   15.0%
(11,47, 1000), -- PP-Bizon Fuel Rod   R$1,00   10.0%
(11,39, 1000), -- P90 Orion           R$5,00   10.0%
(11,40,  800), -- MAC-10 Candy Apple  R$4,64    8.0%
(11,41,  500), -- UMP-45 Primal Saber R$12,00   5.0%
(11,42,  500), -- MP7 Bloodsport      R$18,00   5.0%
(11,44,  200); -- MP9 Hot Rod         R$8,00    2.0%

-- Case 12: P90 Asiimov (R$9,90) → P90 especial
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(12,35, 3000), -- P90 Freight         R$0,50   30.0%
(12,39, 3000), -- P90 Orion           R$5,00   30.0%
(12,43, 2000), -- P90 Trigon          R$8,00   20.0%
(12,45, 1500), -- P90 Asiimov FT      R$1165,91 15.0%
(12,46,  500); -- P90 Asiimov WW      R$700,00   5.0%

-- Case 13: Pistola Starter (R$2,90) → pistolas baratas
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(13,49, 3000), -- Glock Blue Fissure  R$0,80   30.0%
(13,50, 2500), -- P250 Franklin       R$0,50   25.0%
(13,52, 2000), -- Five-SeveN Contractor R$0,30 20.0%
(13,51, 1500), -- Tec-9 Isaac         R$1,00   15.0%
(13,53,  700), -- USP-S Caiman        R$3,00    7.0%
(13,54,  200), -- Glock Candy Apple   R$20,86   2.0%
(13,55,  100); -- P250 Supernova      R$13,12   1.0%

-- Case 14: Pistola Pack (R$5,90) → pistolas intermediárias
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(14,49, 2500), -- Glock Blue Fissure  R$0,80   25.0%
(14,50, 2000), -- P250 Franklin       R$0,50   20.0%
(14,53, 2000), -- USP-S Caiman        R$3,00   20.0%
(14,54, 1500), -- Glock Candy Apple   R$20,86  15.0%
(14,55, 1000), -- P250 Supernova      R$13,12  10.0%
(14,56,  700), -- USP-S Guardian      R$75,43   7.0%
(14,57,  200), -- Deagle Conspiracy FT R$133,43 2.0%
(14,58,  100); -- Glock Water Elemental R$135,43 1.0%

-- Case 15: USP-S Printstream (R$18,90) → USP-S
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(15,53, 3000), -- USP-S Caiman        R$3,00   30.0%
(15,56, 3000), -- USP-S Guardian      R$75,43  30.0%
(15,59, 2000), -- USP-S Kill Confirmed R$509,17 20.0%
(15,61, 1500), -- USP-S Printstream FN R$1800  15.0%
(15,64,  500); -- Five-SeveN HB FN    R$250,00  5.0%

-- Case 16: Desert Eagle Blaze (R$22,90) → Deagle
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(16,50, 3000), -- P250 Franklin       R$0,50   30.0%
(16,57, 3000), -- Deagle Conspiracy FT R$133,43 30.0%
(16,58, 2000), -- Glock Water Elemental R$135,43 20.0%
(16,60, 1000), -- Deagle Printstream  R$650,00 10.0%
(16,59,  800), -- USP-S Kill Confirmed R$509,17 8.0%
(16,62,  200); -- Deagle Blaze FN     R$5066,30 2.0%

-- Case 17: Faca Gut & Navaja (R$49,90) → facas de entrada
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(17,65, 6000), -- Navaja Safari Mesh  R$150,00 60.0%
(17,66, 3000), -- Gut Knife Night     R$350,00 30.0%
(17,67, 1000); -- Gut Knife Doppler   R$1000,00 10.0%

-- Case 18: Faca Flip Knife (R$89,90) → flip knives
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(18,65, 4000), -- Navaja Safari Mesh  R$150,00 40.0%
(18,66, 2500), -- Gut Knife Night     R$350,00 25.0%
(18,68, 2000), -- Flip Knife Rust Coat R$850,00 20.0%
(18,67, 1000), -- Gut Knife Doppler   R$1000,00 10.0%
(18,69,  500); -- Flip Knife Doppler  R$1800,00  5.0%

-- Case 19: Faca Butterfly (R$199,90) → butterfly e acima
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(19,65, 3000), -- Navaja Safari Mesh  R$150,00 30.0%
(19,66, 2000), -- Gut Knife Night     R$350,00 20.0%
(19,68, 1500), -- Flip Knife Rust Coat R$850,00 15.0%
(19,67, 1000), -- Gut Knife Doppler   R$1000,00 10.0%
(19,69,  800), -- Flip Knife Doppler  R$1800,00  8.0%
(19,70, 1200), -- Butterfly Crimson Web R$2500  12.0%
(19,71,  500); -- M9 Bayonet Doppler  R$3500,00  5.0%

-- Case 20: Faca Karambit (R$499,90) → top tier
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(20,65, 2000), -- Navaja Safari Mesh  R$150,00 20.0%
(20,66, 1500), -- Gut Knife Night     R$350,00 15.0%
(20,68, 1200), -- Flip Knife Rust Coat R$850,00 12.0%
(20,69,  800), -- Flip Knife Doppler  R$1800,00  8.0%
(20,70,  800), -- Butterfly Crimson Web R$2500   8.0%
(20,71,  600), -- M9 Bayonet Doppler  R$3500,00  6.0%
(20,73, 1500), -- Karambit Doppler    R$6000,00 15.0%
(20,74,  800), -- Butterfly Fade      R$7000,00  8.0%
(20,72,  800); -- Karambit Fade       R$8000,00  8.0%
