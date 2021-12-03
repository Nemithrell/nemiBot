const { createFactionRoles } = require('../helpers/functions');
const resolvers = require('../helpers/resolvers');

module.exports = class {
  constructor (client) {
    this.client = client;
  }

  async run (reaction, user) {
    const client = this.client;
    const data = {};

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        this.client.logger.log('Something went wrong when fetching the message: ' + error, 'error');
        return;
      }
    }
    if (client.user === user) return;

    const { message, emoji } = reaction;
    if (message.guild) {
      data.guild = message.guild;
      data.config = await client.guilddata.guildConfig.getGuildConfig(message.guild.id);

      if (data.config.RoleReaction.Enabled && message.channel.id === data.config.RoleReaction.Channel) {
        if (message.id !== data.config.RoleReaction.MessageId) return;

        const emojiArray = Object.entries(this.client.customEmojis.Roles);
        if (!emojiArray.some(([, v]) => emoji.name === v)) return;

        const [roleType] = emojiArray.filter(([k, v]) => emoji.name === v).map(([k, v]) => k);
        let guildRole = data.config.Roles[roleType];
        if (!guildRole) return;
        guildRole = await resolvers.resolveRole({ message, search: guildRole });
        if (!guildRole) return;

        const member = message.guild.members.cache.get(user.id);
        if (!member.roles.cache.has(guildRole.id)) {
          try {
            await member.roles.add(guildRole.id);
          } catch (error) {
            return this.client.logger.log(`Unable to assign ${guildRole},` + 'please check the role hierarchy and ensure I have the Manage Roles permission. Error message: ' + error, 'error');
          }
        }
      }

      if (data.config.Channels.NotInFaction && message.channel.id === data.config.Channels.NotInFaction) {
        const guildMemberNotInFaction = await client.guilddata.guildMemberNotInFaction.getList(reaction.message.guild.id);
        if (guildMemberNotInFaction.some((x) => x.messageId === message.id)) {
          const [notInFactionCurrent] = guildMemberNotInFaction.filter((x) => x.messageId === message.id);
          const discordUser = await reaction.message.guild.members.fetch(notInFactionCurrent.discordId);
          const [factionRoleList] = await createFactionRoles(client, data);
          for (const role of factionRoleList) {
            if (discordUser.roles.cache.has(role.id)) discordUser.roles.remove(role);
          }
          await message.delete();
          const newguildMemberNotInFaction = guildMemberNotInFaction.filter((x) => x.messageId !== message.id);
          await client.guilddata.guildMemberNotInFaction.setList(reaction.message.guild.id, newguildMemberNotInFaction);
        } else {
          await message.delete();
        }
      }
    }
  }
};
