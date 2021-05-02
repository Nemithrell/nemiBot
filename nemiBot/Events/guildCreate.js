const Discord = require("discord.js");

module.exports = class
{

	constructor(client)
	{
		this.client = client;
	}

	async run(guild)
	{

		//const owner = await guild.members.fetch(guild.ownerID);

		const messageOptions = {};

		const thanksEmbed = new Discord.MessageEmbed()
			.setAuthor("Thank you for adding me to your guild !")
			.setDescription("To configure me, type `" + this.client.config.prefix + "help` and look at the administration commands!")
			.setColor(this.client.config.embed.color)
			.setFooter(this.client.config.embed.footer)
			.setTimestamp();
		messageOptions.embed = thanksEmbed;

		try
		{
			const owner = await guild.members.fetch(guild.ownerID);
			owner.send(messageOptions);
		}
		catch (err)
		{
			this.client.logger.log(err.stack, "error");
		}
	}
};