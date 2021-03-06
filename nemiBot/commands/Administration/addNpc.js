const Command = require('../../base/command.js');

class AddNpc extends Command {
  constructor (client) {
    super(client, {
      name: 'AddNPC',
      description: 'Add an NPC to be included in the NPC loot check',
      usage: 'AddNPC (ID)',
      examples: 'AddNPC 123456',
      dirname: __dirname,
      enabled: true,
      guildOnly: true,
      aliases: ['NPC+', 'NPCAdd'],
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
      const npcID = parseInt(args[0]);
      if (typeof npcID === 'number') {
        await this.client.guilddata.npcConfig.updateNpcConfig(message.guild.id, npcID, true);
        return message.success(`NPC with ID: ${npcID} has been added`);
      } else {
        return message.error(`${npcID} is not a valid value for NPC ID, supplied value should be a number.`);
      }
    } catch (err) {
      this.client.logger.log(err, 'error');
    }
  }
}

module.exports = AddNpc;
