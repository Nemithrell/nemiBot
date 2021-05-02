const Command = require("../../base/Command.js"),
	Discord = require("discord.js"),
	prettyMS = require("pretty-ms"),
	yatadb = require("../../db/yata.js");

class Loot extends Command
{
	constructor(client)
	{
		super(client, {
			name: "loot",
			description: "Show NPC loot information.",
			usage: `${client.config.prefix}loot (command)`,
			examples: `${client.config.prefix}loot`,
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: ["npc"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 5000
		});
	}

	async run(message)
	{
		const result = await yatadb.Query("SELECT * FROM loot_npc", []);
		for (var id in result)
		{
			let TimeToLootLeveIV = (result[id].hospitalTS * 1000) - (new Date).getTime() + (210 * 60 * 1000);
			TimeToLootLeveIV = TimeToLootLeveIV > 0 ? prettyMS(TimeToLootLeveIV, { secondsDecimalDigits: 0 }) : "Now!";

			let TimeToLootLeveV = (result[id].hospitalTS * 1000) - (new Date).getTime() + (450 * 60 * 1000);
			TimeToLootLeveV = TimeToLootLeveV > 0 ? prettyMS(TimeToLootLeveV, { secondsDecimalDigits: 0 }) : "Now!";

			const embed = new Discord.MessageEmbed()
				.setColor(this.client.config.embed.color)
				.setAuthor(result[id].name, `https://yata.nemi.zone/media/loot/npc_${result[id].tId}.png`, `https://www.torn.com/loader.php?sid=attack&user2ID=${result[id].tId}`)
				.addField("Loot level 4 in ", `${TimeToLootLeveIV}`, true)
				.addField("\u200B", "\u200B", true)
				.addField("Loot level 5 in ", `${TimeToLootLeveV}`, true);
			message.channel.send(embed);
		}
	}

}

module.exports = Loot;