const Command = require("../../base/Command.js"),
	{ user } = require("../../helpers/tornAPI.js");

class Verify extends Command
{
	constructor(client)
	{
		super(client, {
			name: "verify",
			description: "Verify your discord account against torn.",
			usage: `${client.config.prefix}verify (command)`,
			examples: `${client.config.prefix}verify`,
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["v"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 5000
		});
	}

	async run(message)
	{
		try
		{
			const result = await user.discord(message.author.id);


			console.log(result.discord.userID);
			console.log(result.discord.discordID);
			message.member.roles.add("837488589582893067");
			//message.member.setNickname("test");
		}
		catch (err)
		{
			this.client.logger.log(err.stack, "error");
		}

		
		
	}

}

module.exports = Verify;