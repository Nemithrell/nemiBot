const Discord = require('discord.js');

module.exports = class {
  constructor (client) {
    this.client = client;
  }

  async run (guild) {
    // const owner = await guild.members.fetch(guild.ownerID);
    this.client.guilddata.creatGuild(guild.id);

    const thanksEmbed = new Discord.MessageEmbed()
      .setAuthor('Thank you for adding me to your guild !')
      .setDescription('To configure me, type `' + this.client.config.prefix + 'help` and look at the administration commands!')
      .setColor(this.client.config.embed.color)
      .setFooter(this.client.config.embed.footer)
      .setTimestamp();

    const setupEmbed = new Discord.MessageEmbed()
      .setAuthor('Set up a connectin to a Faction in Torn.')
      .setDescription(`Before you can use any of the Torn API commands you first need to register the discord server to a Faction in Torn. This can only be done by a Faction leader or Co-Leader. To register the discord server with a Torn faction, please enter the following command here: "ConnectTornFaction ${guild.id} ApiKey". Where ApiKey is the Torn ApiKey of either the Faction leader or co-leader`)
      .addField('Please enter the following command:', `ConnectTornFaction ${guild.id} <ApiKey>`)
      .setColor(this.client.config.embed.color)
      .setFooter(this.client.config.embed.footer)
      .setTimestamp();

    try {
      const owner = await guild.members.fetch(guild.ownerId);
      owner.send({ embeds: [thanksEmbed, setupEmbed] });
    } catch (err) {
      this.client.logger.log(err.stack, 'error');
    }
  }
};
