const torndb = require('../db/torn');
const NodeCache = require('node-cache');
const config = require('../config');

const cache = new NodeCache({ stdTTL: 86400 });

const guildConfigData = {
  SchemaVersion: 0.1,
  Prefix: config.prefix,
  Faction: {
    Id: null
  },
  Welcome: {
    Enabled: false, // Whether the welcome messages are enabled
    Message: null, // The welcome message
    Channel: null // The channel to send the welcome messages
  },
  // Goodbye messages
  Goodbye: {
    Enabled: false, // Whether the goodbye messages are enabled
    Message: null, // The goodbye message
    Channel: null // The channel to send the goodbye messages
  },
  // Role assignement
  Roles: {
    Verified: null, // The role to add when a member verifies on the server
    NPC: null, // The role to notify about NPC loot level
    Territory: null, // The role to notify about territory events
    Rackets: null, // The role to notify about racket events
    Crime: null, // The role to notify about organized crime events
    NotInFaction: null, // The role to notify about guild members not in torn faction
    Chain: null, // The role to notify about chain time
    FactionMembers: null // The role assigned to members in faction
  },
  // Automatic messaging channels
  Channels: {
    NPC: null, // Channel for NPC updates
    Territory: null,
    Rackets: null,
    Crime: null,
    NotInFaction: null,
    Quiz: null,
    Chain: null,
    OcPayout: null,
    GiveAway: null,
    BotEventLogger: null
  },
  ChainWatch: {
    Enabled: false
  },
  RoleReaction: {
    Enabled: false,
    Channel: null,
    MessageId: null
  },
  autoDeleteModCommands: true
};

const npcConfigData = {
  ids: [4, 15, 19, 20]
};

async function updateGuildConfig (jsonb, guildId) {
  const cacheKey = `${guildId}config`;
  const [{ data }] = await torndb.Query(`update guilddata set data = jsonb_set(data, ${jsonb}) where guildid = '${guildId}' and type = 'config' returning data;`);
  cache.set(cacheKey, data);
  return data;
}

const guildMemberNotInFaction = {
  getList: async (guildId) => {
    const cacheKey = `${guildId}guldMemberNotInFactionList`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    const arr = await torndb.Query(`select data from guilddata where guildid = '${guildId}' and type = 'guldMemberNotInFaction';`);
    const [{ data = [] } = {}] = arr;
    cache.set(cacheKey, data);
    return data;
  },

  setList: async (guildId, newData) => {
    const cacheKey = `${guildId}guldMemberNotInFactionList`;
    const [{ data }] = await torndb.Query(`insert into guilddata (guildid, type, data) values ('${guildId}', 'guldMemberNotInFaction', '${JSON.stringify(newData)}') on conflict (guildid, type) do update set data = EXCLUDED.data returning data;`);
    cache.set(cacheKey, data);
    return data;
  }
};

const factionTeritoryMonitoring = {
  getList: async (guildId) => {
    const cacheKey = `${guildId}factionTeritoryMonitoringList`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    const arr = await torndb.Query(`select data from guilddata where guildid = '${guildId}' and type = 'factionTeritoryMonitoring';`);
    const [{ data = [] } = {}] = arr;
    cache.set(cacheKey, data);
    return data;
  },

  setList: async (guildId, newData) => {
    const cacheKey = `${guildId}factionTeritoryMonitoringList`;
    const [{ data }] = await torndb.Query(`insert into guilddata (guildid, type, data) values ('${guildId}', 'factionTeritoryMonitoring', '${JSON.stringify(newData)}') on conflict (guildid, type) do update set data = EXCLUDED.data returning data;`);
    cache.set(cacheKey, data);
    return data;
  },

  add: async (guildId, factionId) => {
    const cacheKey = `${guildId}factionTeritoryMonitoringList`;
    const oldData = await factionTeritoryMonitoring.getList(guildId);
    let newData = [];
    if (oldData) newData = oldData.filter(x => x !== factionId);
    newData.push(factionId);
    const [{ data }] = await torndb.Query(`insert into guilddata (guildid, type, data) values ('${guildId}', 'factionTeritoryMonitoring', '${JSON.stringify(newData)}') on conflict (guildid, type) do update set data = EXCLUDED.data returning data;`);
    cache.set(cacheKey, data);
    return data;
  },

  remove: async (guildId, factionId) => {
    const cacheKey = `${guildId}factionTeritoryMonitoringList`;
    const oldData = await factionTeritoryMonitoring.getList(guildId);
    let newData = [];
    if (oldData) newData = oldData.filter(x => x !== factionId);
    const [{ data }] = await torndb.Query(`insert into guilddata (guildid, type, data) values ('${guildId}', 'factionTeritoryMonitoring', '${JSON.stringify(newData)}') on conflict (guildid, type) do update set data = EXCLUDED.data returning data;`);
    cache.set(cacheKey, data);
    return data;
  }
};

const stockData = {
  insert: async (timestamp, record) => {
    const cacheKeyRecord = `${timestamp}stockData`;
    const cacheKeyData = 'stockData';
    if (cache.has(cacheKeyRecord)) {
      return null;
    } else {
      await torndb.Query(`insert into stockdata (timestamp, data) values (${timestamp}, '${JSON.stringify(record).replace(/'/g, '\'\'')}') on conflict (timestamp) do nothing;`);
      const data = await torndb.Query('select * from stockdata;');
      cache.set(cacheKeyData, data);
      return data;
    }
  },
  getData: async () => {
    const cacheKeyData = 'stockData';
    if (cache.has(cacheKeyData)) return cache.get(cacheKeyData);
    else {
      const data = await torndb.Query('select * from stockdata;');
      cache.set(cacheKeyData, data);
      return data;
    }
  }
};

const guildConfig = {
  getGuildConfig: async (guildId) => {
    const cacheKey = `${guildId}config`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const [{ data }] = await torndb.Query(`select data from guilddata where guildid = '${guildId}' and type = 'config';`);
    cache.set(cacheKey, data);
    return data;
  },

  setTornFaction: async (guildId, factionId) => {
    const data = `'{"Faction", "Id"}', '${factionId}'`;
    return await updateGuildConfig(data, guildId);
  },

  setRoles: async (guildId, role, roleID) => {
    const data = `'{"Roles", "${role}"}', '"${roleID}"'`;
    return await updateGuildConfig(data, guildId);
  },

  setChannels: async (guildId, channel, channelID) => {
    const data = `'{"Channels","${channel}"}', '"${channelID}"'`;
    return await updateGuildConfig(data, guildId);
  },

  setChainWatch: async (guildId, enable) => {
    const data = `'{"ChainWatch", "Enabled"}', '${enable}'`;
    return await updateGuildConfig(data, guildId);
  },

  setDeleteModCommands: async (guildId, enable) => {
    const data = `'{"autoDeleteModCommands"}', '${enable}'`;
    return await updateGuildConfig(data, guildId);
  },

  setRoleReaction: async (guildId, enable, channel, messageId) => {
    let strBuilder = `"Enabled": ${enable}`;
    if (channel !== null) strBuilder += `, "Channel": "${channel}"`;
    if (messageId !== null) strBuilder += `, "MessageId": "${messageId}"`;
    const data = `'{RoleReaction}', data->'RoleReaction' || '{${strBuilder}}'`;
    return await updateGuildConfig(data, guildId);
  }
};

const npcConfig = {
  getNpcConfig: async (guildId) => {
    const cacheKey = `${guildId}npc`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const [{ data }] = await torndb.Query(`select data from guilddata where guildid = '${guildId}' and type = 'npc';`);
    cache.set(cacheKey, data);
    return data;
  },

  updateNpcConfig: async (guildId, npcId, add = false) => {
    const cacheKey = `${guildId}npc`;
    let npcConf = await npcConfig.getNpcConfig(guildId);
    npcConf = npcConf.ids.filter(item => item !== npcId);
    if (add) npcConf.push(npcId);

    const query = `update guilddata set data = jsonb_set(data, '{"ids"}', '[${npcConf}]') where guildid = '${guildId}' and type = 'npc' returning data;`;

    const [{ data }] = await torndb.Query(query);
    cache.set(cacheKey, data);
  },

  updateNpcHospTime: async (npcId, hospTime) => {
    const cacheKey = `HospTimeNpcID${npcId}`;
    if (cache.has(cacheKey)) {
      const res = cache.get(cacheKey);
      if (res === hospTime) return res;
    }

    const query = `insert into npclist (npcid, hosptime) 
values (${npcId}, '${hospTime}')
on conflict (npcid) do update set hosptime = EXCLUDED.hosptime;`;

    await torndb.Query(query);
    cache.set(cacheKey, hospTime);
  },

  getNpcHospTime: async (npcId) => {
    const cacheKey = `HospTimeNpcID${npcId}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const query = `select hosptime from npclist 
where npcid= ${npcId};`;

    const [{ hosptime }] = await torndb.Query(query);
    cache.set(cacheKey, hosptime);
    return hosptime;
  }
};

// create guild data in database
async function creatGuild (guildId) {
  const guildConfigQuery = `insert into guilddata (guildid, type, data) 
values (${guildId}, 'config', '${JSON.stringify(guildConfigData)}')
on conflict (guildid, type) do nothing;`;

  const npcQuery = `insert into guilddata (guildid, type, data) 
values (${guildId}, 'npc', '${JSON.stringify(npcConfigData)}')
on conflict (guildid, type) do nothing;`;

  await Promise.all([torndb.Query(guildConfigQuery), torndb.Query(npcQuery)]);
  cache.set(`${guildId}config}`, JSON.stringify(guildConfigData));
  cache.set(`${guildId}npc}`, JSON.stringify(npcConfigData));
}

async function deleteGuild (guildId) {
  const guildConfigQuery = `delete from guilddata where guildid = '${guildId}' and type = 'config'`;
  const npcQuery = `delete from guilddata where guildid = '${guildId}' and type = 'npc'`;

  await Promise.all([torndb.Query(guildConfigQuery), torndb.Query(npcQuery)]);
  cache.del(`${guildId}config}`);
  cache.del(`${guildId}npc}`);
}

module.exports = {
  guildConfigData,
  guildConfig,
  stockData,
  npcConfig,
  creatGuild,
  deleteGuild,
  guildMemberNotInFaction,
  factionTeritoryMonitoring
};
