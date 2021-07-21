const { user, faction } = require('./tornAPI');
const Discord = require('discord.js');
const prettyMS = require('pretty-ms');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 180 });
let chainApiError = false;

module.exports = {
  async checkNpc (client, data) {
    const msgArray = [];
    const npcChannelID = data.config.Channels.NPC;
    const res = await Promise.all(data.npcConfig.ids.map(id => user.profile(data.config, id, 300)));
    for (const npc of res) {
      if (npc.states.hospital_timestamp !== 0) await client.guilddata.updateNpcHospTime(npc.player_id, npc.states.hospital_timestamp);

      const npcHospTime = await client.guilddata.getNpcHospTime(npc.player_id);
      const TimeToLootLeveIV = (npcHospTime * 1000) - (new Date()).getTime() + (210 * 60 * 1000);
      const TimeToLootLeveIVPretty = TimeToLootLeveIV > 0 ? prettyMS(TimeToLootLeveIV, { secondsDecimalDigits: 0 }) : 'Now!';

      const TimeToLootLeveV = (npcHospTime * 1000) - (new Date()).getTime() + (450 * 60 * 1000);
      const TimeToLootLeveVPretty = TimeToLootLeveV > 0 ? prettyMS(TimeToLootLeveV, { secondsDecimalDigits: 0 }) : 'Now!';

      const embed = new Discord.MessageEmbed()
        .setColor(client.config.embed.color)
        .setAuthor(npc.name, `https://yata.nemi.zone/media/loot/npc_${npc.player_id}.png`, `https://www.torn.com/loader.php?sid=attack&user2ID=${npc.player_id}`)
        .addField('Loot level 4 in ', `${TimeToLootLeveIVPretty}`, true)
        .addField('\u200B', '\u200B', true)
        .addField('Loot level 5 in ', `${TimeToLootLeveVPretty}`, true);

      // Check if loot level 4 or 5 is between 5 min and 0 min time left
      if (npcHospTime !== undefined && npcChannelID && ((TimeToLootLeveIV <= 315000 && TimeToLootLeveIV >= -15) || (TimeToLootLeveV <= 315000 && TimeToLootLeveV >= -15))) {
        const cacheKey = `GuildID${data.guild.id}NPCID${npc.player_id}`;
        if (cache.get(cacheKey) === undefined) {
          const [npcChannel, npcRole] = await Promise.all([
            data.guild.channels.resolve(npcChannelID),
            data.guild.roles.resolve(data.config.Roles.NPC)]);

          if (npcChannel) {
            if (npcRole) npcChannel.send(`${npcRole}`);
            npcChannel.send(embed);
          }
          cache.set(cacheKey, true);
        }
      }
      msgArray.push(embed);
    }
    return msgArray;
  },

  async checkOC (client, data) {
    if (data.config.Channels.Crime) {
      const [ocChannel, ocRole] = await Promise.all([data.guild.channels.cache.get(data.config.Channels.Crime), data.guild.roles.cache.get(data.config.Roles.Crime)]);

      let crimes = await faction.crimes(data.config);
      crimes = Object.entries(crimes.crimes).filter(([key, val]) => val.time_completed === 0 && val.time_left === 0);
      crimes = Object.fromEntries(crimes.filter(([key, val]) => !val.participants.some(inner => Object.values(inner)[0].state !== 'Okay')));
      let sendMessage = false;

      for (const [key] of Object.entries(crimes)) {
        const cacheKey = `GuildID${data.guild.id}OCID${key}`;
        if (ocChannel && cache.get(cacheKey) === undefined) {
          sendMessage = true;
        }
        cache.set(cacheKey, true);
      }
      if (sendMessage) {
        if (ocRole) ocChannel.send(`${ocRole}`);
        const embed = new Discord.MessageEmbed()
          .setColor(client.config.embed.color)
          .setAuthor('An OC is ready for initiation, please click here to access faction crime page.', 'https://www.torn.com/images/crimes/i.png', 'https://www.torn.com/factions.php?step=your#/tab=crimes');
        ocChannel.send(embed);
      }
    }
  },

  async checkChain (client, data) {
    if (data.config.Channels.Chain && data.config.ChainWatch.Enabled) {
      try {
        const [chainChannel, chainRole] = await Promise.all([data.guild.channels.cache.get(data.config.Channels.Chain), data.guild.roles.cache.get(data.config.Roles.Chain)]);

        const chain = await faction.chain(data.config);
        if (chain && chainApiError) {
          chainApiError = false;
          if (chainRole) chainChannel.send(`${chainRole}`);
          if (chainChannel) chainChannel.error('Torn Api is back online. Chain is being monitored.');
        }
        let sendMessage = false;
        let chainTimer = 0;

        const cacheKey = `GuildID${data.guild.id}chaintimestamp${chain.timestamp}`;
        if (chainChannel && cache.get(cacheKey) === undefined) {
          sendMessage = true;
          chainTimer = isNaN(parseInt(chain.chain.timeout)) ? 0 : parseInt(chain.chain.timeout) - ((new Date()).getTime() / 1000) - chain.timestamp;
        }
        cache.set(cacheKey, true, 30);
        if (sendMessage && (chainTimer > 0 && chainTimer <= 90)) {
          if (chainRole) chainChannel.send(`${chainRole}`);
          const embed = new Discord.MessageEmbed()
            .setColor(client.config.embed.color)
            .setAuthor(`The chain is about to time out in ${prettyMS(chainTimer * 1000, { secondsDecimalDigits: 0 })}. Please make a hit.`, 'https://www.torn.com/images/items/399/large.png', 'https://www.torn.com/')
            .addField('The Chain hit counter is: ', chain.chain.current, true);
          chainChannel.send(embed);
        }
        if (chain.chain.cooldown !== 0 || chain.chain.current === 0) client.guilddata.setChainWatch(data.guild.id, false);
      } catch (error) {
        if (!chainApiError) {
          chainApiError = true;
          const [chainChannel, chainRole] = await Promise.all([data.guild.channels.cache.get(data.config.Channels.Chain), data.guild.roles.cache.get(data.config.Roles.Chain)]);
          if (chainRole) chainChannel.send(`${chainRole}`);
          if (chainChannel) chainChannel.error('Torn Api Error. Please monitor chan manually.');
        }
      }
    }
  },

  async verifyAll (client, data) {
    const verifyRole = await data.guild.roles.cache.get(data.config.Roles.Verified);
    const members = (Array.from(await data.guild.members.fetch())).filter(([k, v]) => v.manageable === true);
    const chunked = [];
    while (members.length) {
      chunked.push(members.splice(0, 10));
    }
    for (const arr of chunked) {
      for (const [discordId, discordUser] of arr) {
        const tornUser = await user.basic(data.config, discordId, 300);
        if (tornUser) {
          if (verifyRole != null && !discordUser.roles.cache.has(verifyRole.id)) discordUser.roles.add(verifyRole);
          if (discordUser.displayName !== `${tornUser.name} [${tornUser.player_id}]`) discordUser.setNickname(`${tornUser.name} [${tornUser.player_id}]`);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
};
