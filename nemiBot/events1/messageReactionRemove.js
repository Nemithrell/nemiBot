const resolvers = require('../helpers/resolvers');

module.exports = class {
  constructor (client) {
    this.client = client;
  }

  async run (reaction, user) {
    const client = this.client;

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        this.client.logger.log('Something went wrong when fetching the message: ' + error, 'error');
        return;
      }
    }
    if (client.user === user) return;

    const guildConfig = await client.guilddata.getGuildConfig(reaction.message.guild.id);
    if (!guildConfig.RoleReaction.Enabled) return;

    const { message, emoji } = reaction;
    if (message.id !== guildConfig.RoleReaction.MessageId) return;

    const emojiArray = Object.entries(this.client.customEmojis.Roles);
    if (!emojiArray.some(([, v]) => emoji.name === v)) return;

    const [roleType] = emojiArray.filter(([k, v]) => emoji.name === v).map(([k, v]) => k);
    let guildRole = guildConfig.Roles[roleType];
    if (!guildRole) return;
    guildRole = await resolvers.resolveRole({ message, search: guildRole });
    if (!guildRole) return;

    const member = message.guild.members.cache.get(user.id);
    if (member.roles.cache.has(guildRole.id)) {
      try {
        await member.roles.remove(guildRole.id);
      } catch (error) {
        return this.client.logger.log(`Unable to remove ${guildRole},` + 'please check the role hierarchy and ensure I have the Manage Roles permission. Error message: ' + error, 'error');
      }
    }
  }
};
