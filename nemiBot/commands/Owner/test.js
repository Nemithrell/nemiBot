const Command = require('../../base/command.js');
const { createFactionRoles } = require('../../helpers/functions.js');

class test extends Command {
  constructor (client) {
    super(client, {
      name: 'test',
      description: 'test',
      usage: 'test',
      examples: 'test',
      dirname: __dirname,
      enabled: true,
      guildOnly: true,
      aliases: [],
      memberPermissions: ['MANAGE_GUILD'],
      botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
      factionMembersOnly: false,
      nsfw: false,
      ownerOnly: true,
      cooldown: 5000
    });
  }

  async run (message, args, data) {
    await createFactionRoles(this.client, data);
  }
}

module.exports = test;
