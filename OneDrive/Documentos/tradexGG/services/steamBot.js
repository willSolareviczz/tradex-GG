const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const TradeOfferManager = require('steam-tradeoffer-manager');
const SteamCommunity = require('steamcommunity');

const client = new SteamUser();
const community = new SteamCommunity();
const manager = new TradeOfferManager({
  steam: client,
  community: community,
  language: 'en',
});

let botReady = false;

function loginBot() {
  if (!process.env.STEAM_BOT_USERNAME || !process.env.STEAM_BOT_PASSWORD) {
    console.log('[Steam Bot] Credenciais não configuradas. Bot desativado.');
    return;
  }

  const logOnOptions = {
    accountName: process.env.STEAM_BOT_USERNAME,
    password: process.env.STEAM_BOT_PASSWORD,
  };

  if (process.env.STEAM_BOT_SHARED_SECRET) {
    logOnOptions.twoFactorCode = SteamTotp.generateAuthCode(process.env.STEAM_BOT_SHARED_SECRET);
  }

  client.logOn(logOnOptions);

  client.on('loggedOn', () => {
    console.log('[Steam Bot] Logado com sucesso!');
    client.setPersona(SteamUser.EPersonaState.Online);
    client.gamesPlayed([730]); // CS2
  });

  client.on('webSession', (sessionID, cookies) => {
    manager.setCookies(cookies);
    community.setCookies(cookies);
    botReady = true;
    console.log('[Steam Bot] Web session ativa. Pronto para trades!');
  });

  client.on('error', (err) => {
    console.error('[Steam Bot] Erro:', err.message);
    botReady = false;
  });

  // Auto-confirm trades if identity secret is set
  if (process.env.STEAM_BOT_IDENTITY_SECRET) {
    community.startConfirmationChecker(10000, process.env.STEAM_BOT_IDENTITY_SECRET);
  }
}

function isBotReady() {
  return botReady;
}

function getBotSteamId() {
  return client.steamID ? client.steamID.getSteamID64() : null;
}

// Get a user's CS2 inventory
function getUserInventory(steamId) {
  return new Promise((resolve, reject) => {
    manager.getUserInventoryContents(steamId, 730, 2, true, (err, inventory) => {
      if (err) return reject(err);
      resolve(inventory.map(item => ({
        assetid: item.assetid,
        classid: item.classid,
        instanceid: item.instanceid,
        name: item.market_hash_name || item.name,
        icon_url: item.getImageURL(),
        tradable: item.tradable,
        type: item.type,
        tags: item.tags,
      })));
    });
  });
}

// Get bot's CS2 inventory
function getBotInventory() {
  return new Promise((resolve, reject) => {
    manager.getInventoryContents(730, 2, true, (err, inventory) => {
      if (err) return reject(err);
      resolve(inventory.map(item => ({
        assetid: item.assetid,
        classid: item.classid,
        instanceid: item.instanceid,
        name: item.market_hash_name || item.name,
        icon_url: item.getImageURL(),
        tradable: item.tradable,
        type: item.type,
      })));
    });
  });
}

// Send trade offer to USER (user deposits skins TO bot)
function createDepositOffer(userSteamId, assetIds, tradeUrl) {
  return new Promise((resolve, reject) => {
    if (!botReady) return reject(new Error('Bot não está online'));

    const offer = manager.createOffer(tradeUrl);

    // Add user's items that they want to deposit
    assetIds.forEach(assetId => {
      offer.addTheirItem({
        appid: 730,
        contextid: '2',
        assetid: assetId,
      });
    });

    offer.setMessage('tradexGG - Depósito de skins');

    offer.send((err, status) => {
      if (err) return reject(err);
      resolve({ offerId: offer.id, status });
    });
  });
}

// Send trade offer FROM bot to user (user withdraws skins)
function createWithdrawOffer(userSteamId, botAssetIds, tradeUrl) {
  return new Promise((resolve, reject) => {
    if (!botReady) return reject(new Error('Bot não está online'));

    const offer = manager.createOffer(tradeUrl);

    // Add bot's items to send to user
    botAssetIds.forEach(assetId => {
      offer.addMyItem({
        appid: 730,
        contextid: '2',
        assetid: assetId,
      });
    });

    offer.setMessage('tradexGG - Retirada de skins');

    offer.send((err, status) => {
      if (err) return reject(err);
      resolve({ offerId: offer.id, status });
    });
  });
}

// Check trade offer status
function getOfferStatus(offerId) {
  return new Promise((resolve, reject) => {
    manager.getOffer(offerId, (err, offer) => {
      if (err) return reject(err);
      resolve({
        id: offer.id,
        state: offer.state,
        stateName: TradeOfferManager.ETradeOfferState[offer.state],
      });
    });
  });
}

// Listen for accepted trades
function onTradeAccepted(callback) {
  manager.on('sentOfferChanged', (offer, oldState) => {
    if (offer.state === TradeOfferManager.ETradeOfferState.Accepted) {
      callback(offer);
    }
  });

  manager.on('receivedOfferChanged', (offer, oldState) => {
    if (offer.state === TradeOfferManager.ETradeOfferState.Accepted) {
      callback(offer);
    }
  });
}

module.exports = {
  loginBot,
  isBotReady,
  getBotSteamId,
  getUserInventory,
  getBotInventory,
  createDepositOffer,
  createWithdrawOffer,
  getOfferStatus,
  onTradeAccepted,
  manager,
  TradeOfferManager,
};
