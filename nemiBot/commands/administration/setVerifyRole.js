const Command = require('../../base/Command.js');

class SetVerifyRole extends Command {
  constructor (client) {
    super(client, {
      name: 'setverifyrole',
      description: 'Set the role to be assigned to users that verify',
      usage: 'setverifyrole (role)',
      examples: 'setverifyrole @test',
      dirname: __dirname,
      enabled: true,
      guildOnly: true,
      aliases: ['svr'],
      memberPermissions: [],
      botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
      nsfw: false,
      ownerOnly: false,
      cooldown: 5000
    });
  }

  async run (message, args, data) {
    try {
      await this.client.guilddata.setVerifyRole(message.guild.id, args[0]);
      return message.channel.send('role set');
    } catch (err) {
      this.client.logger.log(err, 'error');
    }
  }
}

module.exports = SetVerifyRole;
