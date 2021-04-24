const { MessageEmbed } = require("discord.js");
const config = require("../config");

MessageEmbed.prototype.errorColor = function ()
{
	this.setColor("#FF0000");
	return this;
};

MessageEmbed.prototype.successColor = function ()
{
	this.setColor("#32CD32");
	return this;
};

MessageEmbed.prototype.defaultColor = function ()
{
	this.setColor(config.color);
	return this;
};