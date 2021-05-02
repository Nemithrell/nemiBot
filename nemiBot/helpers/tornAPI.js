const got = require("got"),
	nodeCache = require("node-cache"),
	torndb = require("../db/torn.js"),
	yatadb = require("../db/yata.js");

const cache = new nodeCache();
const TORN_URL = "https://api.torn.com/";

//yata db query to fetch list of api keys with faction access
const apiQuery = `select a.value from player_key a
inner join "faction_faction_masterKeys" b on a.id = b.key_id
inner join faction_faction c on c.id = b.faction_id
where c."tId" = 7709;`;

async function getAPIKey()
{
	if (!cache.has("apiKeys"))
	{
		cache.set("apiKeys", await yatadb.Query(apiQuery), 3600);
	}
	const apiKeys = cache.get("apiKeys");
	const key = apiKeys[Math.floor(Math.random() * apiKeys.length)].value;
	return key;
}

async function makeRequest(endpoint, selection, persist, id = "")
{
	const cacheKey = `${endpoint}${selection}${id}`;
	if (cache.has(cacheKey)) return cache.get(cacheKey);
	else if(persist)
	{
		const cacheKeyQuery = `select result from tornapidata where apiquery = '${cacheKey}';`;
		const result = await torndb.Query(cacheKeyQuery);
		if (result.length > 0)
		{
			cache.set(cacheKey, result[0].result, 3600);
			return result[0].result;
		}
		else
		{
			const url = await getAPIKey().then((key) => `${TORN_URL}${endpoint}/${id}?selections=${selection}&key=${key}`);
			const result = await got(url).json();
			await torndb.Query(`insert into tornAPIdata (apiquery, result) values ('${cacheKey}', '${JSON.stringify(result)}')`);
			cache.set(cacheKey, result, 3600);
			return result;
		}
		
	}
}

//compose Torn API URL with api key
const url = {
	user: async (arg = null) => { return await getAPIKey().then((key) => `${TORN_URL}user/${arg}?key=${key}&selections=`); },
	property: async () => { return await getAPIKey().then((key) => `${TORN_URL}property/?key=${key}&selections=`); },
	faction: async () => { return await getAPIKey().then((key) => `${TORN_URL}faction/?key=${key}&selections=`); },
	company: async () => { return await getAPIKey().then((key) => `${TORN_URL}company/?key=${key}&selections=`); },
	market: async (arg = null) => { return await getAPIKey().then((key) => `${TORN_URL}market/${arg}?key=${key}&selections=`); },
	torn: async (arg = null) => { return await getAPIKey().then((key) => `${TORN_URL}torn/${arg}?key=${key}&selections=`); },
};

/**
 * Collection of functions under the user endpoint
 */
const user = {
	discord: async (id) => { return await makeRequest("user", "discord", true, id).then((result) => result); },
	//discord: async (id) => { return await got(`${await url.user(id)}discord`).json(); },
};

const properties = {
	property: async () => { return await got(`${await url.property()}property`).json(); },
};

const faction = {
	applications: async () => { return await got(`${await url.faction()}applications`).json(); },
	armor: async () => { return await got(`${await url.faction()}armor`).json(); },
	armorynews: async () => { return await got(`${await url.faction()}armorynews`).json(); },
	armorynewsfull: async () => { return await got(`${await url.faction()}armorynewsfull`).json(); },
	attacknews: async () => { return await got(`${await url.faction()}attacknews`).json(); },
	attacknewsfull: async () => { return await got(`${await url.faction()}attacknewsfull`).json(); },
	attacks: async () => { return await got(`${await url.faction()}attacks`).json(); },
	attacksfull: async () => { return await got(`${await url.faction()}attacksfull`).json(); },
	basic: async () => { return await got(`${await url.faction()}basic`).json(); },
	boosters: async () => { return await got(`${await url.faction()}boosters`).json(); },
	cesium: async () => { return await got(`${await url.faction()}cesium`).json(); },
	chain: async () => { return await got(`${await url.faction()}chain`).json(); },
	chains: async () => { return await got(`${await url.faction()}chains`).json(); },
	contributors: async () => { return await got(`${await url.faction()}contributors`).json(); },
	crimenews: async () => { return await got(`${await url.faction()}crimenews`).json(); },
	crimenewsfull: async () => { return await got(`${await url.faction()}crimenewsfull`).json(); },
	crimes: async () => { return await got(`${await url.faction()}crimes`).json(); },
	currency: async () => { return await got(`${await url.faction()}currency`).json(); },
	donations: async () => { return await got(`${await url.faction()}donations`).json(); },
	drugs: async () => { return await got(`${await url.faction()}drugs`).json(); },
	fundsnews: async () => { return await got(`${await url.faction()}fundsnews`).json(); },
	fundsnewsfull: async () => { return await got(`${await url.faction()}fundsnewsfull`).json(); },
	mainnews: async () => { return await got(`${await url.faction()}mainnews`).json(); },
	mainnewsfull: async () => { return await got(`${await url.faction()}mainnewsfull`).json(); },
	medical: async () => { return await got(`${await url.faction()}medical`).json(); },
	membershipnews: async () => { return await got(`${await url.faction()}membershipnews`).json(); },
	membershipnewsfull: async () => { return await got(`${await url.faction()}membershipnewsfull`).json(); },
	revives: async () => { return await got(`${await url.faction()}revives`).json(); },
	revivesfull: async () => { return await got(`${await url.faction()}revivesfull`).json(); },
	stats: async () => { return await got(`${await url.faction()}stats`).json(); },
	temporary: async () => { return await got(`${await url.faction()}temporary`).json(); },
	territory: async () => { return await got(`${await url.faction()}territory`).json(); },
	timestamp: async () => { return await got(`${await url.faction()}timestamp`).json(); },
	upgrades: async () => { return await got(`${await url.faction()}upgrades`).json(); },
	weapons: async () => { return await got(`${await url.faction()}weapons`).json(); },
};

const company = {
	detailed: async () => { return await got(`${await url.company()}detailed`).json(); },
	employees: async () => { return await got(`${await url.company()}employees`).json(); },
	profile: async () => { return await got(`${await url.company()}profile`).json(); },
};

const market = {
	/**
	 * List all/selected item users bazaar
	 * @param {number} itemId The ID of desiered item
	 * @returns {Dict} List of itemId currently for sale in users bazaar
	 */
	bazaar: async (itemId = null) => { return await got(`${await url.market(itemId)}bazaar`).json(); },
	/**
	 * List all/selected item in the item market
	 * @param {number} itemId The ID of desiered item
	 * @returns {Dict} List of itemId currently for sale on the item market
	 */
	itemmarket: async (itemId = null) => { return await got(`${await url.market(itemId)}itemmarket`).json(); },
	/**
	 * List all the currently listing on the points market
	 */
	pointsmarket: async () => { return await got(`${await url.market()}pointsmarket`).json(); },
};

const torn = {
	items: async () => { return await got(`${await url.torn()}items`).json(); },
	organisedcrimes: async () => { return await got(`${await url.torn()}organisedcrimes`).json(); },
	rackets: async () => { return await got(`${await url.torn()}rackets`).json(); },
	territory: async () => { return await got(`${await url.torn()}territory`).json(); },
	territorywars: async () => { return await got(`${await url.torn()}territorywars`).json(); },
};

module.exports = {
	user,
	properties,
	faction,
	company,
	market,
	torn,
};