const { user, faction } = require('./tornAPI');
const Discord = require('discord.js');
const prettyMS = require('pretty-ms');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 180 });
let chainApiError = false;

const getDiffObj = (o1, o2) => Object.keys(o1)
  .filter(k => !Object.keys(o2).includes(k))
  .map(k => o1[k] || o2[k]);

async function createFactionRoles (client, data) {
  const [oldRoles, newRoles] = await faction.positions(data.config, data.guild.id);
  let roleNames = [];
  if (Object.keys(oldRoles).length !== 0) {
    // find all positions that needs to be removed
    const deleteRoles = getDiffObj(oldRoles.positions, newRoles.positions);
    const createRoles = getDiffObj(oldRoles.positions, newRoles.positions);
    if (deleteRoles) {
      roleNames = Object.entries(deleteRoles).filter(([k, v]) => v.default === 0).map(([k, v]) => k);
      for (const roleName of roleNames) {
        const discordRole = await data.guild.roles.cache.find(role => role.name === roleName);
        if (discordRole) discordRole.delete();
      }
    }

    if (createRoles) {
      roleNames = Object.entries(createRoles).filter(([k, v]) => v.default === 0).map(([k, v]) => k);
      for (const roleName of roleNames) {
        await data.guild.roles.create({ name: roleName });
      }
    }
  } else {
    if (Object.keys(newRoles).length !== 0) {
      roleNames = Object.entries(newRoles.positions).filter(([k, v]) => v.default === 0).map(([k, v]) => k);
      for (const roleName of roleNames) {
        const discordRole = await data.guild.roles.cache.find(role => role.name === roleName);
        if (discordRole === undefined) await data.guild.roles.create({ name: roleName });
      }
    }
  }
  if (Object.keys(newRoles).length !== 0) {
    const res = await Object.entries(newRoles.positions).filter(([k, v]) => v.default === 0).map(([k, v]) => data.guild.roles.cache.find(role => role.name === k)).filter(x => x !== undefined);
    return res;
  } else return [];
}

module.exports = {
  async checkNpc (client, data) {
    const msgArray = [];
    const npcChannelID = data.config.Channels.NPC;
    const res = await Promise.all(data.npcConfig.ids.map(id => user.profile(data.config, id, 300)));
    for (const npc of res) {
      if (npc.states.hospital_timestamp !== 0) await client.guilddata.npcConfig.updateNpcHospTime(npc.player_id, npc.states.hospital_timestamp);

      const npcHospTime = await client.guilddata.npcConfig.getNpcHospTime(npc.player_id);
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
            if (npcRole) npcChannel.send({ content: `${npcRole}`, embeds: [embed] });
            else npcChannel.send({ embeds: [embed] });
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
        cache.set(cacheKey, true, 3600);
      }
      if (sendMessage) {
        const embed = new Discord.MessageEmbed()
          .setColor(client.config.embed.color)
          .setAuthor('An OC is ready for initiation, please click here to access faction crime page.', 'https://www.torn.com/images/crimes/i.png', 'https://www.torn.com/factions.php?step=your#/tab=crimes');

        if (ocRole) ocChannel.send({ content: `${ocRole}`, embeds: [embed] });
        else ocChannel.send({ embeds: [embed] });
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
          chainChannel.send({ embeds: [embed] });
        }
        if (chain.chain.cooldown !== 0 || chain.chain.current === 0) client.guilddata.guildConfig.setChainWatch(data.guild.id, false);
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
    const factionRoleList = await createFactionRoles(client, data);
    const factionMembers = Object.entries((await faction.basic(data.config)).members).map(([k, v]) => [parseInt(k), v.position]);
    while (members.length) {
      chunked.push(members.splice(0, 10));
    }
    for (const chunk of chunked) {
      for (const [discordId, discordUser] of chunk) {
        const tornUser = await user.profile(data.config, discordId, 300);
        if (Object.prototype.hasOwnProperty.call(tornUser, 'player_id')) {
          if (verifyRole != null && !discordUser.roles.cache.has(verifyRole.id)) discordUser.roles.add(verifyRole);
          if (discordUser.displayName !== `${tornUser.name} [${tornUser.player_id}]`) discordUser.setNickname(`${tornUser.name} [${tornUser.player_id}]`);
          if (factionMembers.some(([k, v]) => k === tornUser.player_id) && factionRoleList) {
            let [, memberFactionRole] = factionMembers.find(([k, v]) => k === tornUser.player_id);
            memberFactionRole = await data.guild.roles.cache.find(role => role.name === memberFactionRole);
            for (const role of factionRoleList) {
              if (discordUser.roles.cache.has(role.id) && role.id !== memberFactionRole.id) discordUser.roles.remove(role);
              else if (role.id === memberFactionRole.id) discordUser.roles.add(memberFactionRole);
            }
          } else {
            for (const role of factionRoleList) {
              if (discordUser.roles.cache.has(role.id)) {
                if (data.config.Channels.NotInFaction) {
                  const guildMemberNotInFaction = await client.guilddata.guildMemberNotInFaction.getList(data.guild.id);
                  if (guildMemberNotInFaction.length !== 0) {
                    if (!guildMemberNotInFaction.some((x) => x.player_id === tornUser.player_id)) {
                      const channel = data.guild.channels.cache.get(data.config.Channels.NotInFaction);
                      const embed = new Discord.MessageEmbed()
                        .setDescription(`The user: ${tornUser.name} is assigned the faction role: ${role.name}, but the user is not a member of faction. Please use the react icon to remove the role from the user.`)
                        .setColor(this.client.config.embed.color)
                        .setFooter(this.client.config.embed.footer)
                        .setAuthor('Discord user with Faction role that is not a member of faction.');

                      // Send the embedded message in the mentioned channel and react with all the applicable reactions.
                      const reactMessage = await channel.send({ embeds: [embed] });
                      reactMessage.react(client.customEmojis.guildMemberNotInFaction);

                      const newguildMemberNotInFaction = {
                        player_id: tornUser.player_id,
                        discordId: discordUser.id,
                        messageId: reactMessage.id,
                        roleId: role.id
                      };
                      guildMemberNotInFaction.push(newguildMemberNotInFaction);
                      await client.guilddata.guildMemberNotInFaction.setList(data.guild.id, guildMemberNotInFaction);
                    }
                  } else {
                    const channel = await data.guild.channels.cache.get(data.config.Channels.NotInFaction);
                    const embed = new Discord.MessageEmbed()
                      .setDescription(`The user: ${tornUser.name} is assigned the faction role: ${role.name}, but the user is not a member of faction. Please use the react icon to remove the role from the user.`)
                      .setColor(this.client.config.embed.color)
                      .setFooter(this.client.config.embed.footer)
                      .setAuthor('Discord user with Faction role that is not a member of faction.');

                    // Send the embedded message in the mentioned channel and react with all the applicable reactions.
                    const reactMessage = await channel.send({ embeds: [embed] });
                    reactMessage.react(client.customEmojis.guildMemberNotInFaction);

                    const newguildMemberNotInFaction = {
                      player_id: tornUser.player_id,
                      discordId: discordUser.id,
                      messageId: reactMessage.id,
                      roleId: role.id
                    };
                    guildMemberNotInFaction.push(newguildMemberNotInFaction);
                    await client.guilddata.guildMemberNotInFaction.setList(data.guild.id, guildMemberNotInFaction);
                  }
                } else discordUser.roles.remove(role);
              }
            }
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
};

module.exports = {
  createFactionRoles
};
