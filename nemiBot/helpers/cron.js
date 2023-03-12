const cron = require('node-cron');
const functions = require('./functions.js');

async function getData (client) {
  this.client = client;

  const guilds = await Array.from(client.guilds.cache.entries());
  const dataArray = [];
  for (const [guildId, guild] of guilds) {
    const data = {};
    data.guild = guild;
    data.config = await client.guilddata.guildConfig.getGuildConfig(guildId);
    data.npcConfig = await client.guilddata.npcConfig.getNpcConfig(guildId);
    dataArray.push(data);
  }
  return dataArray;
}

async function run (client) {
  this.client = client;
  try {
    cron.schedule('*/30 * * * * *', async () => {
      for (const data of await getData(client)) {
        if (data.config.Faction.Id) {
          functions.checkNpc(client, data);
        }
      }
    });
  } catch (error) { client.logger.log(error, 'error'); }

  try {
    cron.schedule('*/5 * * * *', async () => {
      for (const data of await getData(client)) {
        if (data.config.Faction.Id) {
          functions.checkOC(client, data);
        }
      }
    });
  } catch (error) { client.logger.log(error, 'error'); }

  // try {
  //   cron.schedule('*/10 * * * * *', async () => {
  //     for (const data of await getData(client)) {
  //       if (data.config.Faction.Id) {
  //         functions.checkChain(client, data);
  //       }
  //     }
  //   });
  // } catch (error) { client.logger.log(error, 'error'); }

  try {
    cron.schedule('* 2 * * *', async () => {
      for (const data of await getData(client)) {
        if (data.config.Faction.Id) {
          functions.verifyAll(client, data);
        }
      }
    });
  } catch (error) { client.logger.log(error, 'error'); }

  // try {
  //   cron.schedule('*/30 * * * * *', async () => {
  //     for (const data of await getData(client)) {
  //       if (data.config.Faction.Id && data.config.Channels.Territory) {
  //         functions.checkTT(client, data);
  //       }
  //     }
  //   });
  // } catch (error) { client.logger.log(error, 'error'); }
}

module.exports = { run };
