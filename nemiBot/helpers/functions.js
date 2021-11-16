const { user, faction, torn } = require('./tornAPI');
const Discord = require('discord.js');
const prettyMS = require('pretty-ms');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 180 });
let chainApiError = false;

const getDiffObj = (o1, o2) => Object.fromEntries(Object.entries(o1)
  .filter(([k, v]) => !Object.keys(o2).includes(k)));

async function createFactionRoles (client, data) {
  const [oldRoles, newRoles] = await faction.positions(data.config, data.guild.id);
  let roleNames = [];
  if (Object.keys(oldRoles).length !== 0 && Object.keys(newRoles).length !== 0) {
    // find all positions that needs to be removed
    const deleteRoles = getDiffObj(oldRoles.positions, newRoles.positions);
    const createRoles = getDiffObj(newRoles.positions, oldRoles.positions);
    if (deleteRoles) {
      roleNames = Object.entries(deleteRoles).map(([k, v]) => k);
      for (const roleName of roleNames) {
        const discordRole = await data.guild.roles.cache.find(role => role.name === roleName);
        if (discordRole) discordRole.delete();
      }
    }

    if (createRoles) {
      roleNames = Object.entries(createRoles).map(([k, v]) => k);
      for (const roleName of roleNames) {
        await data.guild.roles.create({ name: roleName });
      }
    }
  } else {
    if (Object.keys(newRoles).length !== 0) {
      roleNames = Object.entries(newRoles.positions).map(([k, v]) => k);
      for (const roleName of roleNames) {
        const discordRole = await data.guild.roles.cache.find(role => role.name === roleName);
        if (discordRole === undefined) await data.guild.roles.create({ name: roleName });
      }
    }
  }
  if (Object.keys(newRoles).length !== 0) {
    const roles = await Object.entries(newRoles.positions).map(([k, v]) => data.guild.roles.cache.find(role => role.name === k)).filter(x => x !== undefined);
    const defaultRoleName = Object.entries(newRoles.positions).filter(([k, v]) => v.default === 1).map(([k, v]) => k);
    return [roles, defaultRoleName];
  } else if (Object.keys(oldRoles).length !== 0) {
    const roles = await Object.entries(oldRoles.positions).map(([k, v]) => data.guild.roles.cache.find(role => role.name === k)).filter(x => x !== undefined);
    const defaultRoleName = Object.entries(oldRoles.positions).filter(([k, v]) => v.default === 1).map(([k, v]) => k);
    return [roles, defaultRoleName];
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
    const [factionRoleList, defaultRoleName] = await createFactionRoles(client, data);
    const factionMembers = Object.entries((await faction.basic(data.config)).members).map(([k, v]) => [parseInt(k), v.position === 'Recruit' ? defaultRoleName : v.position]);
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
            if (memberFactionRole) {
              for (const role of factionRoleList) {
                if (discordUser.roles.cache.has(role.id) && role.id !== memberFactionRole.id) discordUser.roles.remove(role);
                else if (role.id === memberFactionRole.id) discordUser.roles.add(memberFactionRole);
              }
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
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  },

  async checkTT (client, data) {
    const cachekeyTT = 'latestTerritoryDiff';
    const cachekeyendedWar = 'latestTerritoryEndedTTWar';
    const cachekeynewWar = 'latestTerritoryNewTTWar';
    const cachekeyAllWar = 'latestTerritoryAllTTWar';
    const cachekeyAllTT = 'latestTerritoryAllTTTT';
    if (!cache.has(cachekeyTT) && !cache.has(cachekeyendedWar) && !cache.has(cachekeynewWar)) {
      const [oldTT, newTT] = await torn.territoryWithWars(data.config, data.guild.id);
      let diffTT = {};
      let newTTWar = {};
      let oldTTWar = {};
      let allTTWars = [];
      if (Object.keys(oldTT).length !== 0 && Object.keys(newTT).length !== 0) {
        diffTT = Object.fromEntries(Object.entries(oldTT.territory)
          .filter(([k, v]) => v.faction !== newTT.territory[k].faction)
          .map(([k, v]) => [k, Object.fromEntries([['old', v], ['new', newTT.territory[k]]])])
        );
        newTTWar = Object.fromEntries(Object.entries(newTT.territorywars)
          .filter(([k, v]) => !Object.keys(oldTT.territorywars).includes(k)));
        oldTTWar = Object.fromEntries(Object.entries(oldTT.territorywars)
          .filter(([k, v]) => !Object.keys(newTT.territorywars).includes(k)));
        allTTWars = allTTWars.concat(Object.keys(oldTT.territorywars).length ? Object.keys(oldTT.territorywars) : [], Object.keys(oldTT.territorywars).length ? Object.keys(oldTT.territorywars) : []);
        allTTWars = allTTWars.filter((item, pos) => allTTWars.indexOf(item) === pos);
      }
      cache.set(cachekeyTT, diffTT, 25);
      cache.set(cachekeyendedWar, oldTTWar, 25);
      cache.set(cachekeynewWar, newTTWar, 25);
      cache.set(cachekeyAllWar, allTTWars, 25);
      cache.set(cachekeyAllTT, newTT.territory, 25);
    }
    const diffTT = cache.get(cachekeyTT);
    const oldTTWar = cache.get(cachekeyendedWar);
    const newTTWar = cache.get(cachekeynewWar);
    const allTTWars = cache.get(cachekeyAllWar);
    const allTT = cache.get(cachekeyAllTT);
    if ((Object.keys(diffTT).length || Object.keys(newTTWar).length || Object.keys(oldTTWar).length) && data.config.Channels.Territory) {
      const factionMonitored = await client.guilddata.factionTeritoryMonitoring.getList(data.guild.id);
      if (factionMonitored) {
        const channel = await data.guild.channels.cache.get(data.config.Channels.Territory);
        // for (const factionId of factionMonitored) {
        // const factionInfo = await faction.basic(data.config, factionId);
        const msgArray = [];
        const droppedTT = Object.keys(diffTT).length
          ? Object.entries(diffTT)
            .filter(([k, v]) => factionMonitored.some(x => x === v.old.faction) && // v.old.faction === factionId &&
              !(allTTWars.length && allTTWars.some(x => x === k)))
          : [];

        const takenTT = Object.keys(diffTT).length
          ? Object.entries(diffTT)
            .filter(([k, v]) => factionMonitored.some(x => x === v.new.faction) && // v.new.faction === factionId &&
              !(allTTWars.length && allTTWars.some(x => x === k)))
          : [];
        const warAssultStarted = Object.keys(newTTWar).length
          ? Object.entries(newTTWar).filter(([k, v]) => factionMonitored.some(x => x === v.assaulting_faction || x === v.defending_faction)) // v.assaulting_faction === factionId || v.defending_faction === factionId)
          : [];
        const warAssultEnded = Object.keys(oldTTWar).length
          ? Object.entries(oldTTWar).filter(([k, v]) => factionMonitored.some(x => x === v.assaulting_faction || x === v.defending_faction)) // v.assaulting_faction === factionId || v.defending_faction === factionId)
          : [];

        for (const tt of droppedTT) {
          const factionInfo = await faction.basic(data.config, tt[1].old.faction);
          const oposingFactionInfo = tt[1].new.faction === 0 ? {} : await faction.basic(data.config, tt[1].new.faction);
          const embed = new Discord.MessageEmbed()
            .setColor(client.config.embed.color)
            .setAuthor(`Territory movement by faction ${factionInfo.name}`)
            .setTitle(`Territory ${tt[0]} has been dropped by faction ${factionInfo.name}`)
            .setURL(`https://www.torn.com/city.php#terrName=${tt[0]}`)
            .setThumbnail(`https://yata.nemi.zone/media/territories/50x50/${tt[0]}.png`);
          Object.keys(oposingFactionInfo).length ? embed.setDescription(`New owner of territory is ${oposingFactionInfo.name}`) : embed.setDescription('There is no new owner of this territory');
          msgArray.push(embed);
        }
        for (const tt of takenTT) {
          const factionInfo = await faction.basic(data.config, tt[1].new.faction);
          const oposingFactionInfo = tt[1].old.faction === 0 ? {} : await faction.basic(data.config, tt[1].old.faction);
          const embed = new Discord.MessageEmbed()
            .setColor(client.config.embed.color)
            .setAuthor(`Territory movement by faction ${factionInfo.name}`)
            .setTitle(`Territory ${tt[0]} has been taken by faction ${factionInfo.name}`)
            .setURL(`https://www.torn.com/city.php#terrName=${tt[0]}`)
            .setThumbnail(`https://yata.nemi.zone/media/territories/50x50/${tt[0]}.png`);
          Object.keys(oposingFactionInfo).length ? embed.setDescription(`Previous owner of territory was ${oposingFactionInfo.name}`) : embed.setDescription('There was no previous owner of this territory');
          msgArray.push(embed);
        }
        for (const tt of warAssultStarted) {
          const assultingFactionInfo = await faction.basic(data.config, tt[1].assaulting_faction);
          const defendingFactionInfo = await faction.basic(data.config, tt[1].defending_faction);
          const embed = new Discord.MessageEmbed()
            .setColor(client.config.embed.color)
            .setAuthor(`A territory war has been started by faction ${assultingFactionInfo.name}`)
            .setTitle(`Territory ${tt[0]} owned by ${defendingFactionInfo.name} has been assulted by faction ${assultingFactionInfo.name}`)
            .setURL(`https://www.torn.com/city.php#terrName=${tt[0]}`)
            .setThumbnail(`https://yata.nemi.zone/media/territories/50x50/${tt[0]}.png`);
          msgArray.push(embed);
        }
        for (const tt of warAssultEnded) {
          const assultingFactionInfo = await faction.basic(data.config, tt[1].assaulting_faction);
          const defendingFactionInfo = await faction.basic(data.config, tt[1].defending_faction);
          const winnerFactionInfo = allTT[tt[0]].faction !== 0 ? await faction.basic(data.config, allTT[tt[0]].faction) : {};
          const embed = new Discord.MessageEmbed()
            .setColor(client.config.embed.color)
            .setAuthor(`The territory war by faction ${assultingFactionInfo.name} on ${tt[0]} owned by ${defendingFactionInfo.name} has ended`)
            .setTitle(Object.keys(winnerFactionInfo).length ? `The war was won by ${winnerFactionInfo.name}` : 'The territory was abandoned')
            .setURL(`https://www.torn.com/city.php#terrName=${tt[0]}`)
            .setThumbnail(`https://yata.nemi.zone/media/territories/50x50/${tt[0]}.png`);
          msgArray.push(embed);
        }
        try {
          const chunked = [];
          while (msgArray.length) {
            chunked.push(msgArray.splice(0, 10));
          }
          const territoryRole = await data.guild.roles.cache.get(data.config.Roles.Territory);
          if (territoryRole && chunked.length) channel.send(`${territoryRole}`);
          for (const chunk of chunked) {
            channel.send({ embeds: chunk });
          }
        } catch (err) {
          this.client.logger.log(err, 'error');
        }
      }
    }
  },

  createFactionRoles
};
