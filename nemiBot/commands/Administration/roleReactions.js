const Command = require('../../base/Command.js');
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

      if (args.length < 1 && args.length > 2) return message.error('Invalid number of arguments supplied.See help command for information on how to use this command.');
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
      if (args.length === 2) channel = await resolveChannel({ message, search: args[1].toLowerCase(), channelType: 'text' });
      if (!channel && enable) return message.error(`Unable to find the mentioned channel ${args[1]}, please make sure you have typed correctly`);

      if (channel) {
        const emojis = this.client.customEmojis.Roles;

        const roleDescription = {
          NPC: 'Notify about NPC loot level',
          Territory: 'Notify about territory events',
          Rackets: 'Notify about racket events',
          Crime: 'Notify about organized crime events',
          Chain: 'Notify about chain timeouts'
        };

        const embed = new Discord.MessageEmbed()
          .setDescription('You will receive a ping when events occur if you assign yourself the applicable role. To assign yourself a role, please react with one of the reactions below.')
          .setColor(this.client.config.embed.color)
          .setFooter(this.client.config.embed.footer);
        const reactionEmoji = (Object.entries(data.config.Roles)).filter(([k, v]) => v != null).map(([k, v]) => [k, emojis[k]]);
        for (const emoji of reactionEmoji) {
          embed.addField(`${emoji[0]}: ${roleDescription[emoji[0]]}`, `React with: ${emoji[1]}`);
        }

        embed.setAuthor(`${this.client.user.username} Automatic role assignment with reactions.`);
        const reactMessage = await channel.send(embed);
        messageId = reactMessage.id;
        for (const emoji of reactionEmoji) {
          reactMessage.react(emoji[1]);
        }
      }

      await this.client.guilddata.setRoleReaction(message.guild.id, enable, channel, messageId);
    } catch (err) {
      this.client.logger.log(err, 'error');
    }
  }
}

module.exports = RoleReaction;
