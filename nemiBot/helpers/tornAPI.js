const fetch = require('node-fetch');
const NodeCache = require('node-cache');
const torndb = require('../db/torn.js');
const yatadb = require('../db/yata.js');

const cache = new NodeCache(3600);
const TORN_URL = 'https://api.torn.com/';

// yata db query to fetch list of api keys with faction access
const apiQuery = `select a.value from player_key a
inner join "faction_faction_masterKeys" b on a.id = b.key_id
inner join faction_faction c on c.id = b.faction_id
where c."tId" = 7709;`;

async function getAPIKey () {
  if (!cache.has('apiKeys')) {
    cache.set('apiKeys', await yatadb.Query(apiQuery));
  }
  const apiKeys = cache.get('apiKeys');
  const key = apiKeys[Math.floor(Math.random() * apiKeys.length)].value;
  return key;
}

async function apiFetch (url) {
  const response = await fetch(url);
  return response.json();
}

async function makeRequest (endpoint, selection, persist, force, id = '') {
  const cacheKey = `${endpoint}${selection}${id}`;
  const url = `${TORN_URL}${endpoint}/${id}?selections=${selection}&key=${await getAPIKey()}`;
  const cacheKeyQuery = `select result from tornapidata where apiquery = '${cacheKey}';`;
  const cacheKeyInsert = `insert into tornAPIdata (apiquery, result) values ('${cacheKey}', '$1')`;

  if (!force) {
    // check for cached values and return cache if exists
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    } else if (persist) {
      // check if value is stored in DB
      const [{ result }] = await torndb.Query(cacheKeyQuery);
      if (result !== undefined) {
        cache.set(cacheKey, result); // cache the returned result from DB.
        return result;
      }
    }
  }

  const result = await apiFetch(url);
  cache.set(cacheKey, result);

  if (persist) torndb.Query(cacheKeyInsert, [JSON.stringify(result)]);

  return result;
}

const user = {
  discord: async (id) => { return await makeRequest('user', 'discord', false, true, id); },
  basic: async (id) => { return await makeRequest('user', 'basic', false, false, id); }
};

const properties = {
  property: async () => { return await makeRequest('properties', 'property', false); }
};

const faction = {
  applications: async () => { return await makeRequest('faction', 'applications', false); }
};

const company = {
  detailed: async () => { return await makeRequest('company', 'detailed', false); }
};

const market = {
  bazaar: async (itemId = null) => { return await makeRequest('market', 'bazaar', true, itemId); },
  itemmarket: async (itemId = null) => { return await makeRequest('market', 'itemmarket', true, itemId); },
  pointsmarket: async () => { return await makeRequest('market', 'pointsmarket', true); }
};

const torn = {
  items: async () => { return await makeRequest('torn', 'items', true); },
  organisedcrimes: async () => { return await makeRequest('torn', 'organisedcrimes', true); },
  rackets: async () => { return await makeRequest('torn', 'rackets', true); },
  territory: async () => { return await makeRequest('torn', 'territory', true); },
  territorywars: async () => { return await makeRequest('torn', 'territorywars', true); }
};

module.exports = {
  user,
  properties,
  faction,
  company,
  market,
  torn
};
