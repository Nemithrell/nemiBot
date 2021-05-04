const Command = require('../../base/Command.js');
const { user } = require('../../helpers/tornAPI.js');

class Verify extends Command {
  constructor (client) {
    super(client, {
      name: 'verify',
      description: 'Verify your discord account against torn.',
      usage: 'verify (user)',
      examples: 'verify',
      dirname: __dirname,
      enabled: true,
      guildOnly: true,
      aliases: ['v'],
      memberPermissions: [],
      botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
      nsfw: false,
      ownerOnly: false,
      cooldown: 5000
    });
  }

  async run (message, args, data) {
    try {
      const verifyRole = data.config.verifiedrole.role;
      const userDiscord = await user.discord(message.author.id);
      const userBasic = await user.basic(userDiscord.discord.userID);

      if (verifyRole != null) message.member.roles.add(verifyRole);

      message.member.setNickname(`${userBasic.name} [${userBasic.player_id}]`);
    } catch (err) {
      this.client.logger.log(err, 'error');
    }
  }
}

module.exports = Verify;
