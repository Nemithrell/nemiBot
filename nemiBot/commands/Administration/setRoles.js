const Command = require('../../base/command.js');
const Resolvers = require('../../helpers/resolvers');
const Discord = require('discord.js');

class SetRoles extends Command {
  constructor (client) {
    super(client, {
      name: 'SetRole',
      description: `Set the role to be assigned to a role type. If no role is set for the verify command then !verify will only set a users nickname. The available role types are: ${Object.keys(client.guilddata.guildConfigData.Roles).map((k) => k).join(', ')}`,
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
      let updateRoleReactions = false;
      if (!data.config.Roles[roleType] && data.config.RoleReaction.Enabled) updateRoleReactions = true;
      data.config = await this.client.guilddata.guildConfig.setRoles(message.guild.id, roleType, role.id);

      if (updateRoleReactions) {
        const reactChannel = await Resolvers.resolveChannel({ message, search: data.config.RoleReaction.Channel, channelType: 'GUILD_TEXT' });
        const reactMessage = await reactChannel.messages.fetch(data.config.RoleReaction.MessageId);

        // Get emojis for all roles
        const emojis = this.client.customEmojis.Roles;
        // set description for roles
        const roleDescription = {
          NPC: 'Notify about NPC loot level',
          Territory: 'Notify about territory events',
          Rackets: 'Notify about racket events',
          Crime: 'Notify about organized crime events',
          Chain: 'Notify about chain timeouts'
        };

        // Create the embedded message to be sent when enabling the feature.
        const embed = new Discord.MessageEmbed()
          .setDescription('You will receive a ping when events occur if you assign yourself the applicable role. To assign yourself a role, please react with one of the reactions below.')
          .setColor(this.client.config.embed.color)
          .setFooter(this.client.config.embed.footer)
          .setAuthor(`${this.client.user.username} Automatic role assignment with reactions.`);
        const reactionEmoji = (Object.entries(data.config.Roles)).filter(([k, v]) => v != null).map(([k, v]) => [k, emojis[k]]).filter(([k, v]) => v !== undefined);
        // Add 1 field for each role enabled.
        for (const emoji of reactionEmoji) {
          embed.addField(`${emoji[0]}: ${roleDescription[emoji[0]]}`, `React with: ${emoji[1]}`);
        }

        // Send the embedded message in the mentioned channel and react with all the applicable reactions.
        await reactMessage.edit(embed);
        for (const emoji of reactionEmoji) {
          reactMessage.react(emoji[1]);
        }
      }
      return message.channel.send(`Role type: ${roleType} set to notify the role: ${role.name}`);
    } catch (err) {
      this.client.logger.log(err, 'error');
    }
  }
}

module.exports = SetRoles;
