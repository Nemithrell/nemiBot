const Command = require('../../base/command.js');
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
      factionMembersOnly: false,
      nsfw: false,
      ownerOnly: false,
      cooldown: 5000
    });
  }

  async run (message, args, data) {
    try {
      const msgArray = await checkNpc(this.client, data);
      const chunked = [];
      while (msgArray.length) {
        chunked.push(msgArray.splice(0, 10));
      }

      for (const chunk of chunked) {
        message.channel.send({ embeds: chunk });
      }
    } catch (err) {
      this.client.logger.log(err, 'error');
    }
  }
}

module.exports = Loot;
