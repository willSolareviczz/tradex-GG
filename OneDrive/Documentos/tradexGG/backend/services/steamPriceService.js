/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
// Steam Market price fetching
// Uses Steam's own market API (free, but rate-limited)

const priceCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function getSkinPrice(marketHashName) {
  // Check cache
  const cached = priceCache.get(marketHashName);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.price;
  }

  try {
    const encodedName = encodeURIComponent(marketHashName);
    const url = `https://steamcommunity.com/market/priceoverview/?currency=7&appid=730&market_hash_name=${encodedName}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.success && data.median_price) {
      // Parse "R$ 12,34" format
      const priceStr = data.median_price
        .replace('R$', '')
        .replace(/\s/g, '')
        .replace('.', '')
        .replace(',', '.');
      const price = Math.round(parseFloat(priceStr) * 100); // centavos

      priceCache.set(marketHashName, { price, timestamp: Date.now() });
      return price;
    } else if (data.success && data.lowest_price) {
      const priceStr = data.lowest_price
        .replace('R$', '')
        .replace(/\s/g, '')
        .replace('.', '')
        .replace(',', '.');
      const price = Math.round(parseFloat(priceStr) * 100);

      priceCache.set(marketHashName, { price, timestamp: Date.now() });
      return price;
    }

    return null;
  } catch (err) {
    console.error(`Erro ao buscar preço de ${marketHashName}:`, err.message);
    return null;
  }
}

// Get prices for multiple items (with rate limiting)
async function getBatchPrices(marketHashNames) {
  const results = [];

  for (const name of marketHashNames) {
    const price = await getSkinPrice(name);
    results.push({ name, price });

    // Steam rate limit: ~20 requests per minute
    await new Promise(resolve => setTimeout(resolve, 3100));
  }

  return results;
}

module.exports = { getSkinPrice, getBatchPrices };
