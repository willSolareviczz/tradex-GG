// Generate SVG images for cases and skins
const fs = require('fs');
const path = require('path');

const casesDir = path.join(__dirname, '..', 'frontend', 'assets', 'images', 'cases');
const skinsDir = path.join(__dirname, '..', 'frontend', 'assets', 'images', 'skins');

fs.mkdirSync(casesDir, { recursive: true });
fs.mkdirSync(skinsDir, { recursive: true });

// ===== CASE IMAGES =====
const cases = [
  { slug: 'kilowatt', name: 'KILOWATT', color1: '#00ff88', color2: '#00aa55', icon: '⚡' },
  { slug: 'revolution', name: 'REVOLUTION', color1: '#00d4ff', color2: '#0088aa', icon: '🔥' },
  { slug: 'dreams-nightmares', name: 'DREAMS', color1: '#d32ce6', color2: '#8818a0', icon: '🌙' },
  { slug: 'fracture', name: 'FRACTURE', color1: '#4b69ff', color2: '#2a3fbb', icon: '💎' },
  { slug: 'clutch', name: 'CLUTCH', color1: '#eb4b4b', color2: '#aa2222', icon: '🎯' },
  { slug: 'iniciante', name: 'INICIANTE', color1: '#7ec8e3', color2: '#4a90a4', icon: '🎮' },
  { slug: 'valor', name: 'VALOR', color1: '#f0c040', color2: '#c09020', icon: '💰' },
  { slug: 'bronze', name: 'BRONZE', color1: '#cd7f32', color2: '#8b5a2b', icon: '🏆' },
];

cases.forEach(c => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0d1117"/>
      <stop offset="100%" style="stop-color:#161b22"/>
    </linearGradient>
    <linearGradient id="box" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c.color1}"/>
      <stop offset="100%" style="stop-color:${c.color2}"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="256" height="256" fill="url(#bg)" rx="16"/>
  <!-- Case box shape -->
  <rect x="48" y="60" width="160" height="120" rx="8" fill="url(#box)" opacity="0.15"/>
  <rect x="48" y="60" width="160" height="120" rx="8" fill="none" stroke="url(#box)" stroke-width="2.5" filter="url(#glow)"/>
  <!-- Lock/latch -->
  <rect x="118" y="52" width="20" height="16" rx="4" fill="${c.color1}" opacity="0.8"/>
  <!-- Inner shine -->
  <line x1="68" y1="120" x2="188" y2="120" stroke="${c.color1}" stroke-width="1" opacity="0.3"/>
  <!-- Icon -->
  <text x="128" y="128" text-anchor="middle" font-size="40" fill="${c.color1}" opacity="0.6">${c.icon}</text>
  <!-- Name -->
  <text x="128" y="215" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="18" fill="${c.color1}" letter-spacing="2">${c.name}</text>
  <text x="128" y="235" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#8b949e">CASE</text>
</svg>`;
  fs.writeFileSync(path.join(casesDir, `${c.slug}.svg`), svg);
  console.log(`Case: ${c.slug}.svg`);
});

// ===== SKIN IMAGES =====
const weaponShapes = {
  'AK-47': 'M30,95 L80,85 L180,88 L220,95 L225,100 L220,105 L180,108 L170,115 L160,108 L80,105 L30,100 Z',
  'M4A1-S': 'M25,95 L75,87 L185,88 L225,93 L230,98 L225,103 L185,108 L170,115 L160,108 L75,107 L25,100 Z',
  'M4A4': 'M25,95 L75,87 L185,88 L225,93 L230,98 L225,103 L185,108 L170,115 L160,108 L75,107 L25,100 Z',
  'AWP': 'M15,95 L60,88 L200,90 L240,95 L240,100 L200,105 L190,112 L180,105 L60,103 L15,100 Z',
  'USP-S': 'M70,93 L120,90 L190,92 L210,97 L210,103 L190,108 L175,112 L165,105 L120,105 L70,100 Z',
  'Glock-18': 'M65,93 L115,89 L185,92 L210,97 L210,103 L185,108 L170,113 L160,105 L115,105 L65,100 Z',
  'Desert Eagle': 'M60,90 L110,86 L180,90 L215,97 L215,108 L200,115 L185,108 L110,105 L60,100 Z',
  'P250': 'M75,93 L125,90 L185,93 L205,98 L205,103 L185,108 L170,112 L160,105 L125,105 L75,100 Z',
  'default': 'M50,93 L100,88 L190,90 L220,97 L220,103 L190,108 L175,114 L165,105 L100,105 L50,100 Z',
};

function getWeaponPath(weapon) {
  return weaponShapes[weapon] || weaponShapes['default'];
}

// All skins from database + new cheap ones
const allSkins = [
  // Kilowatt
  { id: 1, name: 'AK-47 Inheritance', weapon: 'AK-47', color: '#eb4b4b' },
  { id: 2, name: 'M4A1-S Black Lotus', weapon: 'M4A1-S', color: '#eb4b4b' },
  { id: 3, name: 'USP-S Jawbreaker', weapon: 'USP-S', color: '#d32ce6' },
  { id: 4, name: 'AWP Chrome Cannon', weapon: 'AWP', color: '#d32ce6' },
  { id: 5, name: 'Sawed-Off Analog Input', weapon: 'default', color: '#d32ce6' },
  { id: 6, name: 'Tec-9 Slag', weapon: 'default', color: '#8847ff' },
  { id: 7, name: 'Zeus x27 Olympus', weapon: 'default', color: '#8847ff' },
  { id: 8, name: 'MP5-SD Liquidation', weapon: 'default', color: '#8847ff' },
  { id: 9, name: 'XM1014 Iridescent', weapon: 'default', color: '#4b69ff' },
  { id: 10, name: 'Nova Dark Sigil', weapon: 'default', color: '#4b69ff' },
  { id: 11, name: 'MAC-10 Light Box', weapon: 'default', color: '#4b69ff' },
  { id: 12, name: 'Dual Berettas Hideout', weapon: 'default', color: '#4b69ff' },
  // Revolution
  { id: 13, name: 'M4A4 Temukau', weapon: 'M4A4', color: '#eb4b4b' },
  { id: 14, name: 'AK-47 Head Shot', weapon: 'AK-47', color: '#eb4b4b' },
  { id: 15, name: 'P250 Re.built', weapon: 'P250', color: '#d32ce6' },
  { id: 16, name: 'MAG-7 Foresight', weapon: 'default', color: '#d32ce6' },
  { id: 17, name: 'Glock-18 Umbral', weapon: 'Glock-18', color: '#8847ff' },
  { id: 18, name: 'MP9 Featherweight', weapon: 'default', color: '#8847ff' },
  { id: 19, name: 'FAMAS Rapid Eye', weapon: 'default', color: '#4b69ff' },
  { id: 20, name: 'UMP-45 Wild Child', weapon: 'default', color: '#4b69ff' },
  { id: 21, name: 'P90 Neoqueen', weapon: 'default', color: '#4b69ff' },
  // Dreams & Nightmares
  { id: 22, name: 'AK-47 Nightwish', weapon: 'AK-47', color: '#eb4b4b' },
  { id: 23, name: 'MP9 Starlight', weapon: 'default', color: '#eb4b4b' },
  { id: 24, name: 'USP-S Ticket to Hell', weapon: 'USP-S', color: '#d32ce6' },
  { id: 25, name: 'FAMAS Rapid Eye', weapon: 'default', color: '#d32ce6' },
  { id: 26, name: 'Five-SeveN Fairy Tale', weapon: 'default', color: '#8847ff' },
  { id: 27, name: 'XM1014 Zombie', weapon: 'default', color: '#8847ff' },
  { id: 28, name: 'PP-Bizon Space Cat', weapon: 'default', color: '#4b69ff' },
  { id: 29, name: 'Galil AR Connexion', weapon: 'default', color: '#4b69ff' },
  { id: 30, name: 'M249 Downtown', weapon: 'default', color: '#4b69ff' },
  // Fracture
  { id: 31, name: 'Deagle Printstream', weapon: 'Desert Eagle', color: '#eb4b4b' },
  { id: 32, name: 'Glock-18 Vogue', weapon: 'Glock-18', color: '#eb4b4b' },
  { id: 33, name: 'Galil AR Connexion', weapon: 'default', color: '#d32ce6' },
  { id: 34, name: 'SSG 08 Mainframe', weapon: 'default', color: '#d32ce6' },
  { id: 35, name: 'M4A4 Tooth Fairy', weapon: 'M4A4', color: '#8847ff' },
  { id: 36, name: 'P90 Facility Draft', weapon: 'default', color: '#8847ff' },
  { id: 37, name: 'SG 553 Ol Rusty', weapon: 'default', color: '#4b69ff' },
  { id: 38, name: 'Negev Ultralight', weapon: 'default', color: '#4b69ff' },
  { id: 39, name: 'P250 Cassette', weapon: 'P250', color: '#4b69ff' },
  // Clutch
  { id: 40, name: 'M4A4 Neo-Noir', weapon: 'M4A4', color: '#eb4b4b' },
  { id: 41, name: 'USP-S Cortex', weapon: 'USP-S', color: '#eb4b4b' },
  { id: 42, name: 'AUG Stymphalian', weapon: 'default', color: '#d32ce6' },
  { id: 43, name: 'Glock-18 Moonrise', weapon: 'Glock-18', color: '#d32ce6' },
  { id: 44, name: 'AWP Mortis', weapon: 'AWP', color: '#8847ff' },
  { id: 45, name: 'MP7 Bloodsport', weapon: 'default', color: '#8847ff' },
  { id: 46, name: 'UMP-45 Arctic Wolf', weapon: 'default', color: '#4b69ff' },
  { id: 47, name: 'Nova Wild Six', weapon: 'default', color: '#4b69ff' },
  { id: 48, name: 'SG 553 Aloha', weapon: 'default', color: '#4b69ff' },
  // === NEW CHEAP CASES ===
  // Iniciante (49-57)
  { id: 49, name: 'P250 Sand Dune', weapon: 'P250', color: '#b0c3d9' },
  { id: 50, name: 'Tec-9 Groundwater', weapon: 'default', color: '#b0c3d9' },
  { id: 51, name: 'PP-Bizon Sand Dash', weapon: 'default', color: '#b0c3d9' },
  { id: 52, name: 'Nova Predator', weapon: 'default', color: '#5e98d9' },
  { id: 53, name: 'MAG-7 Silver', weapon: 'default', color: '#5e98d9' },
  { id: 54, name: 'Glock-18 Candy Apple', weapon: 'Glock-18', color: '#4b69ff' },
  { id: 55, name: 'AK-47 Safari Mesh', weapon: 'AK-47', color: '#4b69ff' },
  { id: 56, name: 'M4A1-S Boreal Forest', weapon: 'M4A1-S', color: '#8847ff' },
  { id: 57, name: 'AWP Safari Mesh', weapon: 'AWP', color: '#d32ce6' },
  // Valor (58-66)
  { id: 58, name: 'MAC-10 Candy Apple', weapon: 'default', color: '#b0c3d9' },
  { id: 59, name: 'P90 Sand Spray', weapon: 'default', color: '#b0c3d9' },
  { id: 60, name: 'UMP-45 Mudder', weapon: 'default', color: '#b0c3d9' },
  { id: 61, name: 'FAMAS Colony', weapon: 'default', color: '#5e98d9' },
  { id: 62, name: 'Galil AR Sage Spray', weapon: 'default', color: '#5e98d9' },
  { id: 63, name: 'USP-S Guardian', weapon: 'USP-S', color: '#4b69ff' },
  { id: 64, name: 'P250 Supernova', weapon: 'P250', color: '#4b69ff' },
  { id: 65, name: 'Desert Eagle Conspiracy', weapon: 'Desert Eagle', color: '#8847ff' },
  { id: 66, name: 'AK-47 Redline', weapon: 'AK-47', color: '#d32ce6' },
  // Bronze (67-76)
  { id: 67, name: 'SG 553 Pulse', weapon: 'default', color: '#b0c3d9' },
  { id: 68, name: 'Negev Army Sheen', weapon: 'default', color: '#b0c3d9' },
  { id: 69, name: 'MP9 Storm', weapon: 'default', color: '#b0c3d9' },
  { id: 70, name: 'MAG-7 Heat', weapon: 'default', color: '#5e98d9' },
  { id: 71, name: 'XM1014 Blue Steel', weapon: 'default', color: '#5e98d9' },
  { id: 72, name: 'Glock-18 Water Elemental', weapon: 'Glock-18', color: '#4b69ff' },
  { id: 73, name: 'M4A4 Dragon King', weapon: 'M4A4', color: '#4b69ff' },
  { id: 74, name: 'P90 Asiimov', weapon: 'default', color: '#8847ff' },
  { id: 75, name: 'AWP Hyper Beast', weapon: 'AWP', color: '#d32ce6' },
  { id: 76, name: 'AK-47 Vulcan', weapon: 'AK-47', color: '#eb4b4b' },
];

allSkins.forEach(skin => {
  const weaponPath = getWeaponPath(skin.weapon);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="192" viewBox="0 0 256 192">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0d1117"/>
      <stop offset="100%" style="stop-color:#1c2333"/>
    </linearGradient>
    <linearGradient id="weapon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${skin.color}"/>
      <stop offset="100%" style="stop-color:${skin.color}88"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="256" height="192" fill="url(#bg)" rx="8"/>
  <rect x="0" y="186" width="256" height="6" fill="${skin.color}" rx="0"/>
  <path d="${weaponPath}" fill="url(#weapon)" filter="url(#glow)" opacity="0.9"/>
  <path d="${weaponPath}" fill="none" stroke="${skin.color}" stroke-width="1" opacity="0.5"/>
  <text x="128" y="155" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="11" fill="#e6edf3">${skin.name}</text>
  <text x="128" y="172" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="${skin.color}">${skin.weapon === 'default' ? '' : skin.weapon}</text>
</svg>`;
  fs.writeFileSync(path.join(skinsDir, `${skin.id}.svg`), svg);
});

console.log(`Geradas ${cases.length} imagens de caixas e ${allSkins.length} imagens de skins.`);
