-- Caixa Iniciante (R$1,99)
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('P250 | Sand Dune', 'P250', 'Sand Dune', 'consumer', '#b0c3d9', '/assets/images/skins/49.svg', 10),
('Tec-9 | Groundwater', 'Tec-9', 'Groundwater', 'consumer', '#b0c3d9', '/assets/images/skins/50.svg', 15),
('PP-Bizon | Sand Dashed', 'PP-Bizon', 'Sand Dashed', 'consumer', '#b0c3d9', '/assets/images/skins/51.svg', 12),
('Nova | Predator', 'Nova', 'Predator', 'industrial', '#5e98d9', '/assets/images/skins/52.svg', 50),
('MAG-7 | Silver', 'MAG-7', 'Silver', 'industrial', '#5e98d9', '/assets/images/skins/53.svg', 45),
('Glock-18 | Candy Apple', 'Glock-18', 'Candy Apple', 'mil_spec', '#4b69ff', '/assets/images/skins/54.svg', 200),
('AK-47 | Safari Mesh', 'AK-47', 'Safari Mesh', 'mil_spec', '#4b69ff', '/assets/images/skins/55.svg', 350),
('M4A1-S | Boreal Forest', 'M4A1-S', 'Boreal Forest', 'restricted', '#8847ff', '/assets/images/skins/56.svg', 1200),
('AWP | Safari Mesh', 'AWP', 'Safari Mesh', 'classified', '#d32ce6', '/assets/images/skins/57.svg', 3500);

-- Caixa Valor (R$2,99)
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('MAC-10 | Candy Apple', 'MAC-10', 'Candy Apple', 'consumer', '#b0c3d9', '/assets/images/skins/58.svg', 15),
('P90 | Sand Spray', 'P90', 'Sand Spray', 'consumer', '#b0c3d9', '/assets/images/skins/59.svg', 20),
('UMP-45 | Mudder', 'UMP-45', 'Mudder', 'consumer', '#b0c3d9', '/assets/images/skins/60.svg', 18),
('FAMAS | Colony', 'FAMAS', 'Colony', 'industrial', '#5e98d9', '/assets/images/skins/61.svg', 80),
('Galil AR | Sage Spray', 'Galil AR', 'Sage Spray', 'industrial', '#5e98d9', '/assets/images/skins/62.svg', 70),
('USP-S | Guardian', 'USP-S', 'Guardian', 'mil_spec', '#4b69ff', '/assets/images/skins/63.svg', 450),
('P250 | Supernova', 'P250', 'Supernova', 'mil_spec', '#4b69ff', '/assets/images/skins/64.svg', 380),
('Desert Eagle | Conspiracy', 'Desert Eagle', 'Conspiracy', 'restricted', '#8847ff', '/assets/images/skins/65.svg', 2200),
('AK-47 | Redline', 'AK-47', 'Redline', 'classified', '#d32ce6', '/assets/images/skins/66.svg', 8500);

-- Caixa Bronze (R$4,90)
INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price) VALUES
('SG 553 | Pulse', 'SG 553', 'Pulse', 'consumer', '#b0c3d9', '/assets/images/skins/67.svg', 20),
('Negev | Army Sheen', 'Negev', 'Army Sheen', 'consumer', '#b0c3d9', '/assets/images/skins/68.svg', 25),
('MP9 | Storm', 'MP9', 'Storm', 'consumer', '#b0c3d9', '/assets/images/skins/69.svg', 22),
('MAG-7 | Heat', 'MAG-7', 'Heat', 'industrial', '#5e98d9', '/assets/images/skins/70.svg', 100),
('XM1014 | Blue Steel', 'XM1014', 'Blue Steel', 'industrial', '#5e98d9', '/assets/images/skins/71.svg', 120),
('Glock-18 | Water Elemental', 'Glock-18', 'Water Elemental', 'mil_spec', '#4b69ff', '/assets/images/skins/72.svg', 600),
('M4A4 | Dragon King', 'M4A4', 'Dragon King', 'mil_spec', '#4b69ff', '/assets/images/skins/73.svg', 750),
('P90 | Asiimov', 'P90', 'Asiimov', 'restricted', '#8847ff', '/assets/images/skins/74.svg', 3500),
('AWP | Hyper Beast', 'AWP', 'Hyper Beast', 'classified', '#d32ce6', '/assets/images/skins/75.svg', 12000),
('AK-47 | Vulcan', 'AK-47', 'Vulcan', 'covert', '#eb4b4b', '/assets/images/skins/76.svg', 35000);

-- Case-skins links (pesos por raridade)
-- Iniciante (case_id = 6, skins 49-57)
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(6, 49, 8000), (6, 50, 8000), (6, 51, 8000),
(6, 52, 1600), (6, 53, 1600),
(6, 54, 320), (6, 55, 320),
(6, 56, 64),
(6, 57, 13);

-- Valor (case_id = 7, skins 58-66)
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(7, 58, 8000), (7, 59, 8000), (7, 60, 8000),
(7, 61, 1600), (7, 62, 1600),
(7, 63, 320), (7, 64, 320),
(7, 65, 64),
(7, 66, 13);

-- Bronze (case_id = 8, skins 67-76)
INSERT INTO case_skins (case_id, skin_id, weight) VALUES
(8, 67, 8000), (8, 68, 8000), (8, 69, 8000),
(8, 70, 1600), (8, 71, 1600),
(8, 72, 320), (8, 73, 320),
(8, 74, 64),
(8, 75, 13),
(8, 76, 3);
