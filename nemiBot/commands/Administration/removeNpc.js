const Command = require('../../base/Command.js');

class SetVerifyRole extends Command {
  constructor (client) {
    super(client, {
      name: 'RemoveNPC',
      description: 'Remove an NPC to be included in the NPC loot check',
      usage: 'RemoveNPC (ID)',
      examples: 'RemoveNPC 123456',
      dirname: __dirname,
      enabled: true,
      guildOnly: true,
      aliases: ['NPC-', 'NpcRem'],
      memberPermissions: ['MANAGE_GUILD'],
      botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
      nsfw: false,
      ownerOnly: false,
      cooldown: 5000
    });
  }

  async run (message, args, data) {
    try {
      const npcID = args[0];
      if (typeof npcID === 'number') {
        await this.client.guilddata.updateNpcConfig(message.guild.id, args[0], false);
        return message.channel.send(`NPC with ID: ${npcID} has been removed`);
      } else {
        return message.channel.send(`${npcID} is not a valid value for NPC ID, supplied value should be a number.`);
      }
    } catch (err) {
      this.client.logger.log(err, 'error');
    }
  }
}

module.exports = SetVerifyRole;
