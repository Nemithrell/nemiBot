const torndb = require('../db/torn');
const NodeCache = require('node-cache');
const config = require('../config');

const cache = new NodeCache({ stdTTL: 3600 });

const guildConfig = {
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

const npcConfig = {
  ids: [4, 15, 19, 20]
};

module.exports = {
  guildConfig,
  npcConfig,
  // create guild data in database
  async creatGuild (guildId) {
    const guildConfigQuery = `insert into guilddata (guildid, type, data) 
values (${guildId}, 'config', '${JSON.stringify(guildConfig)}')
on conflict (guildid, type) do nothing;`;

    const npcQuery = `insert into guilddata (guildid, type, data) 
values (${guildId}, 'npc', '${JSON.stringify(npcConfig)}')
on conflict (guildid, type) do nothing;`;

    await Promise.all([torndb.Query(guildConfigQuery), torndb.Query(npcQuery)]);
    cache.set(`${guildId}config}`, JSON.stringify(guildConfig));
    cache.set(`${guildId}npc}`, JSON.stringify(npcConfig));
  },

  async deleteGuild (guildId) {
    const guildConfigQuery = `delete from guilddata where guildid = '${guildId}' and type = 'config'`;
    const npcQuery = `delete from guilddata where guildid = '${guildId}' and type = 'npc'`;

    await Promise.all([torndb.Query(guildConfigQuery), torndb.Query(npcQuery)]);
    cache.del(`${guildId}config}`);
    cache.del(`${guildId}npc}`);
  },

  async setTornFaction (guildId, factionId) {
    const cacheKey = `${guildId}config`;
    const [{ data }] = await torndb.Query(`update guilddata set data = jsonb_set(data, '{"Faction", "Id"}', '"${factionId}"') where guildid = '${guildId}' and type = 'config' returning data;`);
    cache.set(cacheKey, data);
    return data;
  },
  async getNpcConfig (guildId) {
    const cacheKey = `${guildId}npc`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const [{ data }] = await torndb.Query(`select data from guilddata where guildid = '${guildId}' and type = 'npc';`);
    cache.set(cacheKey, data);
    return data;
  },

  async updateNpcConfig (guildId, npcId, add = false) {
    let npcConfig = await this.getNpcConfig(guildId);
    npcConfig = npcConfig.filter(item => item !== npcId);
    if (add) npcConfig = npcConfig.push(npcId);

    const query = `insert into guilddata (guildid, type, data) 
values (${guildId}, 'npc', '${JSON.stringify(npcConfig)}')
on conflict (guildid, type) do update set data = EXCLUDED.data;`;

    await torndb.Query(query);
    cache.set(`${guildId}npc}`, JSON.stringify(npcConfig));
  },

  async getGuildConfig (guildId) {
    const cacheKey = `${guildId}config`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const [{ data }] = await torndb.Query(`select data from guilddata where guildid = '${guildId}' and type = 'config';`);
    cache.set(cacheKey, data);
    return data;
  },

  async setRoles (guildId, role, roleID) {
    const cacheKey = `${guildId}config`;
    const [{ data }] = await torndb.Query(`update guilddata set data = jsonb_set(data, '{"Roles", "${role}"}', '"${roleID}"') where guildid = '${guildId}' and type = 'config' returning data;`);
    cache.set(cacheKey, data);
    return data;
  },

  async setChannels (guildId, channel, channelID) {
    const cacheKey = `${guildId}config`;
    const [{ data }] = await torndb.Query(`update guilddata set data = jsonb_set(data, '{"Channels","${channel}"}', '"${channelID}"') where guildid = '${guildId}' and type = 'config' returning data;`);
    cache.set(cacheKey, data);
    return data;
  },

  async setChainWatch (guildId, enable) {
    const cacheKey = `${guildId}config`;
    const [{ data }] = await torndb.Query(`update guilddata set data = jsonb_set(data, '{"ChainWatch", "Enabled"}', '"${enable}"') where guildid = '${guildId}' and type = 'config' returning data;`);
    cache.set(cacheKey, data);
    return data;
  },

  async setRoleReaction (guildId, enable, channel, messageId) {
    const cacheKey = `${guildId}config`;
    let strBuilder = `"Enabled": "${enable}"`;
    if (channel !== null) strBuilder += `, "Channel": "${channel}"`;
    if (messageId !== null) strBuilder += `, "MessageId": "${messageId}"`;
    const [{ data }] = await torndb.Query(`update guilddata set data = jsonb_set(data, '{RoleReaction}', data->'RoleReaction' || '{${strBuilder}}') where guildid = '${guildId}' and type = 'config' returning data;`);
    cache.set(cacheKey, data);
    return data;
  },

  async updateNpcHospTime (npcId, hospTime) {
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

  async getNpcHospTime (npcId) {
    const cacheKey = `HospTimeNpcID${npcId}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const query = `select hosptime from npclist 
where npcid= ${npcId};`;

    const [{ hosptime }] = await torndb.Query(query);
    cache.set(cacheKey, hosptime);
    return hosptime;
  }
};
