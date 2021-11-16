const Command = require('../../base/command.js');

class RemoveFactionTeritoryMonitor extends Command {
  constructor (client) {
    super(client, {
      name: 'RemoveFactionTeritoryMonitor',
      description: 'Remove a faction to be included in the faction teritori monitoring',
      usage: 'RemoveFactionTeritoryMonitor (FactionID)',
      examples: 'RemoveFactionTeritoryMonitor 123456',
      dirname: __dirname,
      enabled: true,
      guildOnly: true,
      aliases: ['FTT-', 'FTTRemove'],
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
      const factionID = parseInt(args[0]);
      if (typeof factionID === 'number') {
        await this.client.guilddata.factionTeritoryMonitoring.remove(data.guild.id, factionID);
        return message.success(`Faction with ID: ${factionID} has been removed`);
      } else {
        return message.error(`${factionID} is not a valid value for faction ID, supplied value should be a number.`);
      }
    } catch (err) {
      this.client.logger.log(err, 'error');
    }
  }
}

module.exports = RemoveFactionTeritoryMonitor;
