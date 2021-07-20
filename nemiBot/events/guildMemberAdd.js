const { user } = require('../helpers/tornAPI.js');

module.exports = class {
  constructor (client) {
    this.client = client;
  }

  async run (member) {
    const guildConfig = await this.client.guilddata.getGuildConfig(member.guild.id);
    try {
      const discordId = member ? member.id : null;
      const verifyRole = guildConfig.Roles.Verified;
      if (discordId) {
        const userBasic = await user.basic(guildConfig, discordId, 30);
        if (userBasic) {
          if (verifyRole != null) member.roles.add(verifyRole);
          member.setNickname(`${userBasic.name} [${userBasic.player_id}]`);
        }
      }
    } catch (err) {
      this.client.logger.log(err, 'error');
    }
  }
};
