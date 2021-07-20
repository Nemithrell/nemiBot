module.exports = class {
  constructor (client) {
    this.client = client;
  }

  async run (guild) {
    try {
      this.client.guilddata.deleteGuild(guild.id);
    } catch (err) {
      this.client.logger.log(err, 'error');
    }
  }
};
