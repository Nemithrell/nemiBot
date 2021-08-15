const Command = require('../../base/command.js');
const Discord = require('discord.js');
const { resolveChannel } = require('../../helpers/resolvers.js');

class RoleReaction extends Command {
  constructor (client) {
    super(client, {
      name: 'RoleReaction',
      description: 'Enable or disable the role reaction message where users can react with emoji to self assign roles',
      usage: 'RoleReaction (on/off) (channel)',
      examples: 'RoleReaction on #test',
      dirname: __dirname,
      enabled: true,
      guildOnly: true,
      aliases: ['RR', 'React'],
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
      let enable = false;
      let channel = null;
      let messageId = null;

      // Check for correct number of arguments supplied
      if (args.length < 1 && args.length > 2) return message.error('Invalid number of arguments supplied.See help command for information on how to use this command.');
      // Set variables based on argument supplied. Off to disable feature, On to enable feature.
      switch (args[0].toLowerCase()) {
        case 'off':
          enable = false;
          channel = '';
          messageId = '';
          break;
        case 'on':
          enable = true;
          break;
        default:
          return message.error('The "enable" argument does not contain either on or off. Please make sure you have typed correctly.');
      }

      // If 2 arguments are supplied we resolve the 2nd one to a channel
      if (args.length === 2) channel = await resolveChannel({ message, search: args[1].toLowerCase(), channelType: 'GUILD_TEXT' });

      // Return an error message if we are unable to find the mentioned channel in second argument.
      if (!channel && enable) return message.error(`Unable to find the mentioned channel ${args[1]}, please make sure you have typed correctly`);

      // Return an error if the command was for enabling the feature and it is already enabled.
      if (enable && data.config.RoleReaction.Enabled) return message.error(`Role Reaction is already enabled and is tracking a message in ${await resolveChannel({ message, search: data.config.RoleReaction.Channel, channelType: 'GUILD_TEXT' })}. If you want to overwrite the configuration stored, please turn the feature off first and then on again.`);

      // Delete old tracked message if the command is to disable the feature.
      if (!enable) {
        try {
          const oldChannel = await resolveChannel({ message, search: data.config.RoleReaction.Channel, channelType: 'GUILD_TEXT' });
          const oldMessage = await oldChannel.messages.fetch(data.config.RoleReaction.MessageId);
          await oldMessage.delete();
        } catch (err) {
          this.client.logger.log(err, 'error');
        }
        await this.client.guilddata.guildConfig.setRoleReaction(message.guild.id, enable, channel, messageId);
        return message.success('Role Reactions successfully disabled');
      }
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
      const reactMessage = await channel.send({ embeds: [embed] });
      messageId = reactMessage.id;
      for (const emoji of reactionEmoji) {
        reactMessage.react(emoji[1]);
      }

      // Store the configuration
      await this.client.guilddata.guildConfig.setRoleReaction(message.guild.id, enable, channel, messageId);
      return message.success('Role Reactions successfully enabled');
    } catch (err) {
      this.client.logger.log(err, 'error');
    }
  }
}

module.exports = RoleReaction;
