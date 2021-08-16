const Command = require('../../base/command.js');
const Discord = require('discord.js');

class Help extends Command {
  constructor (client) {
    super(client, {
      name: 'Help',
      description: 'Show commands list or specific command help.',
      usage: 'help (command)',
      examples: 'help h',
      dirname: __dirname,
      enabled: true,
      guildOnly: false,
      aliases: ['aide', 'h', 'commands'],
      memberPermissions: [],
      botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
      factionMembersOnly: false,
      nsfw: false,
      ownerOnly: false,
      cooldown: 5000
    });
  }

  async run (message, args, data) {
    const prefix = data.config.Prefix;
    let argLower;

    if (typeof args[0] === 'string') argLower = (args[0]).toLowerCase();

    // if a command is provided
    if (argLower) {
      // if the command doesn't exist, error message
      const cmd = this.client.commands.get(argLower) || this.client.commands.get(this.client.aliases.get(argLower));
      if (!cmd) {
        return message.error(`${argLower} is not a valid command`);
      }

      // Creates the help embed
      const groupEmbed = new Discord.MessageEmbed()
        .setAuthor(`Help information on command: ${prefix}${cmd.help.name}`)
        .addField('Description', `${cmd.help.description}`)
        .addField('Usage', `${message.guild ? prefix : ''}${cmd.help.usage}`)
        .addField('Examples', `${message.guild ? prefix : ''}${cmd.help.examples}`)
        .addField('Alias',
          cmd.help.aliases.length > 0
            ? cmd.help.aliases.map(a => '`' + a + '`').join('\n')
            : 'No alias'
        )
        .addField('Permissions',
          cmd.conf.memberPermissions.length > 0
            ? cmd.conf.memberPermissions.map((p) => '`' + p + '`').join('\n')
            : 'No specific permission is required to execute this command.'
        )
        .setColor(this.client.config.embed.color)
        .setFooter(this.client.config.embed.footer);

      // and send the embed in the current channel
      return message.channel.send({ embeds: [groupEmbed] });
    }

    // put all command categories into an array
    const categories = [];
    const commands = this.client.commands;

    commands.forEach((command) => {
      if (!categories.includes(command.help.category)) {
        if (command.help.category === 'Administration' && !message.channel.permissionsFor(message.member).has('MANAGE_GUILD')) {
          return;
        }
        if (command.help.category === 'Owner' && message.author.id !== message.guild.ownerId) {
          return;
        }
        categories.push(command.help.category);
      }
    });

    const emojis = this.client.customEmojis;

    const embed = new Discord.MessageEmbed()
      .setDescription(`To get help on a specific command type "${prefix}help <command>"!`)
      .setColor(this.client.config.embed.color)
      .setFooter(this.client.config.embed.footer);
    for (const cat of categories.sort()) {
      const tCommands = commands.filter((cmd) => cmd.help.category === cat);
      embed.addField(emojis.categories[cat.toLowerCase()] + ' ' + cat + ' - (' + tCommands.size + ')', tCommands.map((cmd) => '`' + cmd.help.name + '`').join(', '));
    }

    embed.setAuthor(`${this.client.user.username} commands`);
    return message.channel.send({ embeds: [embed] });
  }
}

module.exports = Help;
