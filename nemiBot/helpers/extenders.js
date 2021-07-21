const { Message, MessageEmbed, Channel } = require('discord.js');
const config = require('../config');

MessageEmbed.prototype.errorColor = function () {
  this.setColor('#FF0000');
  return this;
};

MessageEmbed.prototype.successColor = function () {
  this.setColor('#32CD32');
  return this;
};

MessageEmbed.prototype.defaultColor = function () {
  this.setColor(config.color);
  return this;
};

// Wrapper for sendT with error emoji
Message.prototype.error = function (string) {
  const prefixEmoji = 'error';
  return this.sendMessage(string, prefixEmoji);
};

// Wrapper for sendT with success emoji
Message.prototype.success = function (string) {
  const prefixEmoji = 'success';
  return this.sendMessage(string, prefixEmoji);
};

Message.prototype.sendMessage = function (string, prefixEmoji) {
  if (prefixEmoji) {
    string = `${this.client.customEmojis[prefixEmoji]} ${string}`;
  }
  return this.channel.send(string);
};

// Wrapper for sendT with error emoji
Channel.prototype.error = function (string) {
  const prefixEmoji = 'error';
  return this.sendMessage(string, prefixEmoji);
};

// Wrapper for sendT with success emoji
Channel.prototype.success = function (string) {
  const prefixEmoji = 'success';
  return this.sendMessage(string, prefixEmoji);
};

Channel.prototype.sendMessage = function (string, prefixEmoji) {
  if (prefixEmoji) {
    string = `${this.client.customEmojis[prefixEmoji]} ${string}`;
  }
  return this.channel.send(string);
};
