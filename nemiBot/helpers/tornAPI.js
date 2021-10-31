const fetch = require('node-fetch');
const NodeCache = require('node-cache');
const { RateLimiter } = require('limiter');
const torndb = require('../db/torn.js');
const yatadb = require('../db/yata.js');

const cache = new NodeCache({ stdTTL: 3600 });
const TORN_URL = 'https://api.torn.com/';
const apiKeysLimiter = new Map();

async function getAPIKey (guildConfig) {
  const apiQuery = `select a.value from player_key a
inner join "faction_faction_masterKeys" b on a.id = b.key_id
inner join faction_faction c on c.id = b.faction_id
where c."tId" = ${guildConfig.Faction.Id};`;
  const cacheKey = `apiKeys${guildConfig.Faction.Id}`;

  if (!cache.has(cacheKey)) {
    cache.set(cacheKey, await yatadb.Query(apiQuery));
  }
  const apiKeys = cache.get(cacheKey);
  const key = apiKeys.shift();
  apiKeys.push(key);
  cache.set(cacheKey, apiKeys, cache.getTtl(cacheKey));
  if (!apiKeysLimiter.has(key)) {
    apiKeysLimiter.set(key, new RateLimiter({ tokensPerInterval: 50, interval: 60000 }));
  }

  const apiKeyLimiter = apiKeysLimiter.get(key);
  if (apiKeyLimiter.tryRemoveTokens(1)) return key.value;
  else throw Error('APIkey rate limited');
}

async function apiFetch (url) {
  try {
    const response = await fetch(url);
    if (response.status === 200) return response.json();
    else throw Error(response.statusText);
  } catch (err) { return err; }
}

async function makeRequest (guildConfig, endpoint, selection, persist, force, id, ttl, guildId = null) {
  if (!guildConfig.Faction.Id) throw Error('No connection to a Torn Faction. Torn API requests is not allowed until you connect your guild to a Torn faction.');
  let cacheKey = `${endpoint}${selection}${id}`;
  if (guildId) cacheKey = `${guildId}${endpoint}${selection}${id}`;
  const url = `${TORN_URL}${endpoint}/${id}?selections=${selection}&key=${await getAPIKey(guildConfig)}&comment=NemiBot`;
  const cacheKeyQuery = `select result from tornapidata where apiquery = '${cacheKey}';`;

  if (!force) {
    // check for cached values and return cache if exists
    if (cache.has(cacheKey) && !persist) {
      return cache.get(cacheKey);
    } else if (persist && cache.has(cacheKey)) {
      return [cache.get(cacheKey), cache.get(cacheKey)];
    } else if (persist) {
      // check if value is stored in DB
      const arr = await torndb.Query(cacheKeyQuery);
      const [{ result = '' } = {}] = arr;
      if (result) {
        const newResult = await apiFetch(url);
        const cacheKeyInsert = `insert into tornAPIdata (apiquery, result) values ('${cacheKey}', '${JSON.stringify(newResult)}') on conflict (apiquery) do update set result = EXCLUDED.result`;
        await torndb.Query(cacheKeyInsert);
        cache.set(cacheKey, newResult, ttl);
        return [result, newResult];
      }
    }
  }

  const result = await apiFetch(url);
  cache.set(cacheKey, result, ttl);

  if (persist) {
    const cacheKeyInsert = `insert into tornAPIdata (apiquery, result) values ('${cacheKey}', '${JSON.stringify(result)}') on conflict (apiquery) do update set result = EXCLUDED.result`;
    await torndb.Query(cacheKeyInsert);
    return [{}, result];
  }

  return result;
}

const user = {
  discord: async (guildConfig, id, force, ttl = null) => { return makeRequest(guildConfig, 'user', 'discord', false, force, id, ttl); },
  basic: async (guildConfig, id, ttl = null) => { return makeRequest(guildConfig, 'user', 'basic', false, false, id, ttl); },
  profile: async (guildConfig, id, ttl = null) => { return makeRequest(guildConfig, 'user', 'profile', false, false, id, ttl); }
};

const properties = {
  property: async (guildConfig) => { return makeRequest(guildConfig, 'properties', 'property', false); }
};

const faction = {
  applications: async (guildConfig) => { return makeRequest(guildConfig, 'faction', 'applications', false, false, guildConfig.Faction.Id, 30); },
  basic: async (guildConfig) => { return makeRequest(guildConfig, 'faction', 'basic', false, false, guildConfig.Faction.Id, 3600); },
  crimes: async (guildConfig) => { return makeRequest(guildConfig, 'faction', 'crimes', false, false, guildConfig.Faction.Id, 30); },
  chain: async (guildConfig) => { return makeRequest(guildConfig, 'faction', 'chain,timestamp', false, false, guildConfig.Faction.Id, 10); },
  positions: async (guildConfig, guildId) => { return makeRequest(guildConfig, 'faction', 'positions', true, false, guildConfig.Faction.Id, 3600, guildId); }
};

const company = {
  detailed: async (guildConfig) => { return makeRequest(guildConfig, 'company', 'detailed', false); }
};

const market = {
  bazaar: async (guildConfig, itemId = null) => { return makeRequest(guildConfig, 'market', 'bazaar', true, itemId); },
  itemmarket: async (guildConfig, itemId = null) => { return makeRequest(guildConfig, 'market', 'itemmarket', true, itemId); },
  pointsmarket: async (guildConfig) => { return makeRequest(guildConfig, 'market', 'pointsmarket', true); }
};

const torn = {
  items: async (guildConfig) => { return makeRequest(guildConfig, 'torn', 'items', true); },
  organisedcrimes: async (guildConfig) => { return makeRequest(guildConfig, 'torn', 'organisedcrimes', true); },
  rackets: async (guildConfig) => { return makeRequest(guildConfig, 'torn', 'rackets', true); },
  territory: async (guildConfig) => { return makeRequest(guildConfig, 'torn', 'territory', true); },
  territorywars: async (guildConfig) => { return makeRequest(guildConfig, 'torn', 'territorywars', true); }
};

async function registerTornFaction (apiKey) {
  const factionInfo = await apiFetch(`${TORN_URL}faction/?selections=basic&key=${apiKey}`);
  const userInfo = await apiFetch(`${TORN_URL}user/?selections=basic&key=${apiKey}`);

  if (!factionInfo.ID) {
    return 'No faction was found connected to your Torn user profile.';
  } else if (!userInfo.player_id) {
    return 'No Torn user profile was found connected to your API key. Please veryfy you have entered the correct API Key.';
  } else {
    const apiQuery = `select a.value from player_key a
inner join "faction_faction_masterKeys" b on a.id = b.key_id
inner join faction_faction c on c.id = b.faction_id
where c."tId" = ${factionInfo.ID};`;
    const apiKeys = await yatadb.Query(apiQuery);

    if (!apiKeys) {
      return `Faction with id: ${factionInfo.ID} is not registered with any API Keys in the vulpes yata database. Please log in to the Vulpes Yata website to register your API key.`;
    } else if (userInfo.player_id === factionInfo.leader || userInfo.player_id === factionInfo['co-leader']) {
      return factionInfo.ID;
    } else {
      return `The Torn profile connected to your API Key is not the leader or co-leader of faction ${factionInfo.name}[${factionInfo.ID}]. Only the faction leader or co-leader are allowed to register a discord server with a faction.`;
    }
  }
}

module.exports = {
  user,
  properties,
  faction,
  company,
  market,
  torn,
  registerTornFaction
};
