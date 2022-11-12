const Command = require('../../base/command.js');

class AddFactionTeritoryMonitor extends Command {
  constructor (client) {
    super(client, {
      name: 'AddFactionTeritoryMonitor',
      description: 'Add an faction to be included in the faction teritori monitoring',
      usage: 'AddFactionTeritoryMonitor (FactionID)',
      examples: 'AddFactionTeritoryMonitor 123456',
      dirname: __dirname,
      enabled: true,
      guildOnly: true,
      aliases: ['FTT+', 'FTTAdd'],
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
      const factionID = parseInt(args[0]);
      if (typeof factionID === 'number') {
        await this.client.guilddata.factionTeritoryMonitoring.add(data.guild.id, factionID);
        return message.success(`Faction with ID: ${factionID} has been added`);
      } else {
        return message.error(`${factionID} is not a valid value for faction ID, supplied value should be a number.`);
      }
    } catch (err) {
      this.client.logger.log(err, 'error');
    }
  }
}

module.exports = AddFactionTeritoryMonitor;
