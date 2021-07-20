const Command = require('../../base/command.js');

class StartChainWatch extends Command {
  constructor (client) {
    super(client, {
      name: 'StartChainWatch',
      description: 'Enable bot monitoring of active chain',
      usage: 'StartChainWatch',
      examples: 'StartChainWatch',
      dirname: __dirname,
      enabled: true,
      guildOnly: true,
      aliases: ['chain', 'startchain', 'scw'],
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
      await this.client.guilddata.setChainWatch(message.guild.id, true);
      return message.success('Chain monitoring started');
    } catch (err) {
      this.client.logger.log(err, 'error');
      return message.error('Unable to start chain monitoring');
    }
  }
}

module.exports = StartChainWatch;
