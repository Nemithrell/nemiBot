const Command = require('../../base/Command.js');
const { registerTornFaction } = require('../../helpers/tornAPI.js');

class ConnectTornFaction extends Command {
  constructor (client) {
    super(client, {
      name: 'ConnectTornFaction',
      description: 'Set the faction ID connectiong the Discord server to Torn.',
      usage: 'ConnectTornFaction GuildId ApiKey',
      examples: 'ConnectTornFaction',
      dirname: __dirname,
      enabled: true,
      guildOnly: false,
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
    try {
      if (message.guild) {
        return message.error(`This command is only available in direct message! Run this command in DM with the following "ConnectTornFaction ${message.guild.id} ApiKey"`);
      } else if (!args.length === 2) {
        return message.error('Invalid number of arguments supplied. Run this command with the following "ConnectTornFaction GuildId ApiKey"');
      } else if ((this.client.guilds.cache.get(args[0])).ownerID !== message.author.id) {
        return message.error('You are not the owner of the discord guild and are not permitted to run this command.');
      } else {
        const factionId = await registerTornFaction(args[1]);

        if (!isNaN(parseInt(factionId))) {
          const guildConfig = await this.client.guilddata.setTornFaction(args[0], factionId);
          return message.success(`Guild successfully registered with faction ${guildConfig.Faction.Id}`);
        } else {
          return message.error(factionId);
        }
      }
    } catch (err) {
      this.client.logger.log(err, 'error');
    }
  }
}

module.exports = ConnectTornFaction;
