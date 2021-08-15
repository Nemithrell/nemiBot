const Command = require('../../base/command.js');
const Resolvers = require('../../helpers/resolvers');

class SetChannels extends Command {
  constructor (client) {
    super(client, {
      name: 'SetChannel',
      description: `Set the channel to be used for automatic notification. The available channel types are: ${Object.keys(client.guilddata.guildConfigData.Channels).map((k) => k).join(', ')}`,
      usage: 'SetChannel  channeltype (channel)',
      examples: 'SetChannel chain #test',
      dirname: __dirname,
      enabled: true,
      guildOnly: true,
      aliases: ['setchannel', 'sc'],
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
      if (args.length < 2) return message.error('Not enough arguments supplied for this command. Please make sure you have typed correctly. You can find more info in the help command');
      let channeltype = args[0];
      const allowedChannelTypes = Object.entries(data.config.Channels).map(([key]) => key);
      channeltype = allowedChannelTypes.find((key) => key.toLowerCase() === args[0].toLowerCase());
      if (channeltype === undefined) return message.error(`Invalid channel type selectet. Allowed values for channel type is: ${allowedChannelTypes.join(', ')}`);
      let channel = args[1];
      channel = await Resolvers.resolveChannel({
        message,
        search: channel,
        channelType: 'GUILD_TEXT'
      });
      if (!channel) {
        return message.error('Unable to find the mentioned channel. Please make sure you have typed correctly. you can find more info in the help command');
      }

      await this.client.guilddata.guildConfig.setChannels(message.guild.id, channeltype, channel.id);
      return message.channel.send(`Channel type: ${channeltype} set to notify on channel ${channel}`);
    } catch (err) {
      this.client.logger.log(err, 'error');
    }
  }
}

module.exports = SetChannels;
