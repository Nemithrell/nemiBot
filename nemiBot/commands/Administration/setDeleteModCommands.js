const Command = require('../../base/command.js');

class SetDeleteModCommands extends Command {
  constructor (client) {
    super(client, {
      name: 'SetDeleteModCommands',
      description: 'Enable or disable the delete Mod commands',
      usage: 'SetDeleteModCommands (ON/OFF)',
      examples: 'SetDeleteModCommands on',
      dirname: __dirname,
      enabled: true,
      guildOnly: true,
      aliases: ['dmc', 'setdmc'],
      memberPermissions: ['MANAGE_GUILD'],
      botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
      factionMembersOnly: false,
      nsfw: false,
      ownerOnly: true,
      cooldown: 5000
    });
  }

  async run (message, args, data) {
    try {
      let enable;
      if (!args[0]) return message.error('No arguments supplied. check the help command for usage of this command.');
      enable = args[0].toLowerCase();

      switch (enable) {
        case 'off':
          enable = false;
          break;
        case 'on':
          enable = true;
          break;
        default:
          return message.error('Invalid argument supplied. See help command for valid arguments.');
      }

      await this.client.guilddata.guildConfig.setDeleteModCommands(message.guild.id, enable);
      return message.success(`Deletian of Mod commands has successfully been ${enable ? 'enabled' : 'disabled'}`);
    } catch (err) {
      this.client.logger.log(err, 'error');
    }
  }
}

module.exports = SetDeleteModCommands;
