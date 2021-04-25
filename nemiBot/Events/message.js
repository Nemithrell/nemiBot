module.exports = class
{
	constructor(client)
	{
		this.client = client;
	}

	async run(message)
	{

		const data = {};

		// If the messagr author is a bot
		if (message.author.bot)
		{
			return;
		}

		// If the member on a guild is invisible or not cached, fetch them.
		if (message.guild && !message.member)
		{
			await message.guild.members.fetch(message.author.id);
		}

		const client = this.client;
		data.config = client.config;

		// Check if the bot was mentionned
		if (message.content.match(new RegExp(`<@!?${client.user.id}>( |)`)))
		{
			if (message.guild)
			{
				return message.sendMessage(`Hello ${message.author}, comand prefix is !.`);
			} else
			{
				return message.sendMessage(`Hello ${message.author}, as you are currently in direct message you don't need to add a prefix before command name.`);
			}
		}

		// Gets the prefix
		const prefix = client.config.prefix;
		if (!prefix)
		{
			return;
		}

		const args = message.content.slice((typeof prefix === "string" ? prefix.length : 0)).trim().split(/ +/g);
		const command = args.shift().toLowerCase();
		const cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command));

		if (!cmd && message.guild) return;
		else if (!cmd && !message.guild)
		{
			return message.sendMessage(`Hello ${message.author}, as you are currently in direct message you don't need to add a prefix before command name.`);
		}

		if (cmd.conf.guildOnly && !message.guild)
		{
			return message.error("This command is not availablein direct message!");
		}

		if (message.guild)
		{
			let neededPermissions = [];

			if (!cmd.conf.botPermissions.includes("EMBED_LINKS"))
			{
				cmd.conf.botPermissions.push("EMBED_LINKS");
			}

			cmd.conf.botPermissions.forEach((perm) =>
			{
				if (!message.channel.permissionsFor(message.guild.me).has(perm))
				{
					neededPermissions.push(perm);
				}
			});

			if (neededPermissions.length > 0)
			{
				const list = neededPermissions.map((p) => `\`${p}\``).join(", ");
				return message.error(`I need the following permissions to execute this command: ${list}`);
			}

			neededPermissions = [];
			cmd.conf.memberPermissions.forEach((perm) =>
			{
				if (!message.channel.permissionsFor(message.member).has(perm))
				{
					neededPermissions.push(perm);
				}
			});

			if (neededPermissions.length > 0)
			{
				const list = neededPermissions.map((p) => `\`${p}\``).join(", ");
				return message.error(`You need the following permissions to execute this command: ${list}`);
			}

			if (!message.channel.nsfw && cmd.conf.nsfw)
			{
				return message.error("You must execute this command in a channel that allows NSFW!");
			}

			client.logger.log(`${message.author.username} (${message.author.id}) ran command ${cmd.help.name}`, "cmd");

			//const log = new this.client.logs({
			//	commandName: cmd.help.name,
			//	author: { username: message.author.username, discriminator: message.author.discriminator, id: message.author.id },
			//	guild: { name: message.guild ? message.guild.name : "dm", id: message.guild ? message.guild.id : "dm" }
			//});
			//log.save();
		}
		try
		{
			cmd.run(message, args, data);
			if (cmd.help.category === "Moderation" && client.config.autoDeleteModCommands)
			{
				message.delete();
			}
		} catch (e)
		{
			console.error(e);
			return message.error("Something went wrong... Please retry again later!");
		}
	}
};