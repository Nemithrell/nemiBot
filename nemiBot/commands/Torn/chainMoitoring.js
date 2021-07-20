const Command = require('../../base/command.js');

class ChainMonitoring extends Command {
  constructor (client) {
    super(client, {
      name: 'ChainMonitoring',
      description: 'Enable bot monitoring of active chain',
      usage: 'ChainMonitoring (start/stop)',
      examples: 'ChainMonitoring start',
      dirname: __dirname,
      enabled: true,
      guildOnly: true,
      aliases: ['chain', 'cm'],
      memberPermissions: [],
      botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
      factionMembersOnly: true,
      nsfw: false,
      ownerOnly: false,
      cooldown: 5000
    });
  }

  async run (message, args, data) {
    try {
      if (args[0].toLowerCase() === 'start') {
        await this.client.guilddata.setChainWatch(message.guild.id, true);
        return message.success('Chain monitoring started.');
      } else if (args[0].toLowerCase() === 'stop') {
        await this.client.guilddata.setChainWatch(message.guild.id, false);
        return message.success('Chain monitoring stopped.');
      } else {
        return message.error('Invalid argument supplied, allowed arguments is "start" or "stop". Please see help command for more information on how to use this command.');
      }
    } catch (err) {
      this.client.logger.log(err, 'error');
      return message.error('Unable to start chain monitoring');
    }
  }
}

module.exports = ChainMonitoring;
