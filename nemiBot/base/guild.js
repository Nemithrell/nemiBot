const torndb = require('../db/torn');
const config = require('../config');
const NodeCache = require('node-cache');

const cache = new NodeCache(3600);

module.exports = {
  // create guild data in database
  async creatGuild (guildId) {
    const guildConfig = {
      prefix: config.prefix,
      faction: {
        enabled: false,
        id: null
      },
      welcome: {
        enabled: false, // Whether the welcome messages are enabled
        message: null, // The welcome message
        channel: null // The channel to send the welcome messages
      },
      // Goodbye messages
      goodbye: {
        enabled: false, // Whether the goodbye messages are enabled
        message: null, // The goodbye message
        channel: null // The channel to send the goodbye messages
      },
      // Autorole
      verifiedrole: {
        role: null // The role to add when a member join the server
      },
      channels: {
        npc: null, // Channel for NPC updates
        territory: null,
        rackets: null,
        crime: null,
        notinfaction: null,
        quiz: null,
        chain: null,
        ocpayout: null,
        giveaway: null
      },
      autoDeleteModCommands: false
    };

    const query = `insert into guilddata (guildid, type, data) 
values (${guildId}, 'config', '${JSON.stringify(guildConfig)}')
on conflict (guildid, type) do nothing;`;

    await torndb.Query(query);
    cache.set(`${guildId}config}`, JSON.stringify(guildConfig));
  },

  async getGuildConfig (guildId) {
    const cacheKey = `${guildId}config`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const [{ data }] = await torndb.Query(`select data from guilddata where guildid = '${guildId}' and type = 'config';`);
    cache.set(cacheKey, data);
    return data;
  },

  async setVerifyRole (guildId, role) {
    const cacheKey = `${guildId}config`;
    const [, roleID] = role.match(/^<@&([0-9]{18})>/);
    const data = await torndb.Query(`update guilddata set data = jsonb_set(data, '{"verifiedrole","role"}', '"${roleID}"') where guildid = '${guildId}' and type = 'config' returning data;`);
    cache.set(cacheKey, data);
    return data;
  }
};
