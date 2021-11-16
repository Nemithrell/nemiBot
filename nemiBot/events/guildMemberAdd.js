const { user, faction } = require('../helpers/tornAPI.js');

module.exports = class {
  constructor (client) {
    this.client = client;
  }

  async run (member) {
    const guildConfig = await this.client.guilddata.guildConfig.getGuildConfig(member.guild.id);
    try {
      const discordId = member ? member.id : null;
      const verifyRole = guildConfig.Roles.Verified;
      if (discordId) {
        const tornUser = await user.profile(guildConfig, discordId, 30);
        if (tornUser) {
          if (verifyRole != null) member.roles.add(await member.guild.roles.cache.get(verifyRole));
          member.setNickname(`${tornUser.name} [${tornUser.player_id}]`);
          const factionMembers = Object.entries((await faction.basic(guildConfig)).members).map(([k, v]) => [parseInt(k), v.position]);
          if (factionMembers.some(([k, v]) => k === tornUser.player_id)) {
            let [, memberFactionRole] = factionMembers.find(([k, v]) => k === tornUser.player_id);
            memberFactionRole = await member.guild.roles.cache.find(role => role.name === memberFactionRole);
            if (memberFactionRole) {
              member.roles.add(memberFactionRole);
            }
          }
        }
      }
    } catch (err) {
      this.client.logger.log(err, 'error');
    }
  }
};
