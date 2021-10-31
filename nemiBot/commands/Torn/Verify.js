const Command = require('../../base/command.js');
const { resolveMember } = require('../../helpers/resolvers.js');
const { user } = require('../../helpers/tornAPI.js');
const { verifyAll } = require('../../helpers/functions.js');

class Verify extends Command {
  constructor (client) {
    super(client, {
      name: 'Verify',
      description: 'Verify your discord account against torn.',
      usage: 'verify (user)',
      examples: 'verify',
      dirname: __dirname,
      enabled: true,
      guildOnly: true,
      aliases: ['v'],
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
      const member = args[0] ? await resolveMember({ message, search: args[0] }) : message.author;
      const discordId = member ? member.id : null;
      const verifyRole = data.config.Roles.Verified;
      if (discordId) {
        const userBasic = await user.basic(data.config, discordId, 30);
        if (userBasic.hasOwn('player_id')) {
          if (verifyRole != null && !message.member.roles.cache.has(verifyRole.id)) message.member.roles.add(verifyRole);
          if (message.member.displayName !== `${userBasic.name} [${userBasic.player_id}]` && message.member.manageable) message.member.setNickname(`${userBasic.name} [${userBasic.player_id}]`);
          message.success(`${member} has been assosiated with Torn player ${userBasic.name} [${userBasic.player_id}]`);
        } else if (!userBasic) {
          message.error(`Unable to find a Torn profile asociated with discord user ${member}. Please make sure to link the discord profile to Torn.`);
        }
      } else if (args[0].toLowerCase() === 'all') {
        verifyAll(this.client, data);
        message.success('verifying everyone triggered');
      } else {
        message.error('Unable to find discord ID of the user. Please make sure you type the command correctly. See the help command for more information.');
      }
    } catch (err) {
      this.client.logger.log(err, 'error');
    }
  }
}

module.exports = Verify;
