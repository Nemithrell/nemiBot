const Command = require('../../base/Command.js');
const Resolvers = require('../../helpers/resolvers');

class SetRoles extends Command {
  constructor (client) {
    super(client, {
      name: 'SetRole',
      description: `Set the role to be assigned to a role type. If no role is set for the verify command then !verify will only set a users nickname. The available role types are: ${Object.keys(client.guilddata.guildConfig.Roles).map((k) => k).join(', ')}`,
      usage: 'SetRole RoleType (role)',
      examples: 'SetRole Crime @test',
      dirname: __dirname,
      enabled: true,
      guildOnly: true,
      aliases: ['sr'],
      memberPermissions: ['MANAGE_GUILD'],
      botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
      factionMembersOnly: false,
      nsfw: false,
      ownerOnly: false,
      cooldown: 5000
    });
  }

  async run (message, args, data) {
    try {
      if (args.length < 2) return message.error('Not enough arguments supplied for this command. Please make sure you have typed correctly. You can find more info in the help command');
      let roleType = args[0];
      const allowedRoleTypes = Object.entries(data.config.Roles).map(([key]) => key);
      roleType = allowedRoleTypes.find((key) => key.toLowerCase() === args[0].toLowerCase());
      if (roleType === undefined) return message.error(`Invalid role type selectet. Allowed values for channel type is: ${allowedRoleTypes.join(', ')}`);
      let role = args[1];
      role = await Resolvers.resolveRole({
        message,
        search: role
      });
      if (!role) {
        return message.error('Unable to find the mentioned role. Please make sure you have typed correctly. you can find more info in the help command');
      }

      await this.client.guilddata.setRoles(message.guild.id, roleType, role.id);
      return message.channel.send(`Role type: ${roleType} set to notify on channel ${role}`);
    } catch (err) {
      this.client.logger.log(err, 'error');
    }
  }
}

module.exports = SetRoles;
