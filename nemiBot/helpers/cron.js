const cron = require('node-cron');
const functions = require('./functions.js');

async function getData (client) {
  this.client = client;

  const guilds = await Array.from(client.guilds.cache.entries());
  const dataArray = [];
  for (const [guildId, guild] of guilds) {
    const data = {};
    data.guild = guild;
    data.config = await client.guilddata.getGuildConfig(guildId);
    data.npcConfig = await client.guilddata.getNpcConfig(guildId);
    dataArray.push(data);
  }
  return dataArray;
}

async function run (client) {
  this.client = client;

  cron.schedule('*/2 * * * *', () => {
    for (const data of getData(client)) {
      if (data.config.Faction.Id) {
        functions.checkNpc(client, data);
      }
    }
  });

  cron.schedule('*/5 * * * *', () => {
    for (const data of getData(client)) {
      if (data.config.Faction.Id) {
        functions.checkOC(client, data);
      }
    }
  });

  cron.schedule('* * * * *', () => {
    for (const data of getData(client)) {
      if (data.config.Faction.Id) {
        functions.checkChain(client, data);
      }
    }
  });
}

module.exports = { run };
