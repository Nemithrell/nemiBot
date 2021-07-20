const Command = require('../../base/Command.js');
const { checkNpc } = require('../../helpers/functions.js');

class Loot extends Command {
  constructor (client) {
    super(client, {
      name: 'Loot',
      description: 'Show NPC loot information.',
      usage: 'loot',
      examples: 'loot',
      dirname: __dirname,
      enabled: true,
      guildOnly: true,
      aliases: ['npc'],
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
      const msgArray = await checkNpc(this.client, data);

      for (const msg of msgArray) {
        message.channel.send(msg);
      }
    } catch (err) {
      this.client.logger.log(err, 'error');
    }
  }
}

module.exports = Loot;
