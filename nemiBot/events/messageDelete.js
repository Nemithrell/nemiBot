module.exports = class {
  constructor (client) {
    this.client = client;
  }

  async run (message) {
    const client = this.client;

    const guildConfig = await client.guilddata.guildConfig.getGuildConfig(message.guild.id);

    if (guildConfig.Channels.NotInFaction && message.channel.id === guildConfig.Channels.NotInFaction) {
      const guildMemberNotInFaction = await client.guilddata.guildMemberNotInFaction.getList(message.guild.id);
      if (guildMemberNotInFaction.some((x) => x.messageId === message.id)) {
        const newguildMemberNotInFaction = guildMemberNotInFaction.filter((x) => x.messageId !== message.id);
        await client.guilddata.guildMemberNotInFaction.setList(message.guild.id, newguildMemberNotInFaction);
      }
    }
  }
};
