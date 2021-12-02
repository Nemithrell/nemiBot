const { Client, Collection } = require('discord.js');

const path = require('path');

// Creates nemiBot class
class nemiBot extends Client {
  constructor (options) {
    super(options);
    this.config = require('../config'); // Load the config file
    this.guilddata = require('./guild');
    this.customEmojis = require('../emojis.json'); // load the bot's emojis
    this.commands = new Collection(); // Creates new commands collection
    this.aliases = new Collection(); // Creates new command aliases collection
    this.logger = require('../helpers/logger'); // Load the logger file
  }

  // This function is used to load a command and add it to the collection
  loadCommand (commandPath, commandName) {
    try {
      const props = new (require(`.${commandPath}${path.sep}${commandName}`))(this);
      this.logger.log(`Loading Command: ${props.help.name}. ??`, 'log');
      props.conf.location = commandPath;
      if (props.init) {
        props.init(this);
      }
      this.commands.set(props.help.name.toLowerCase(), props);
      props.help.aliases.forEach((alias) => {
        this.aliases.set(alias.toLowerCase(), props.help.name.toLowerCase());
      });
      return false;
    } catch (e) {
      return `Unable to load command ${commandName}: ${e}`;
    }
  }

  // This function is used to unload a command (you need to load them again)
  async unloadCommand (commandPath, commandName) {
    let command;
    if (this.commands.has(commandName)) {
      command = this.commands.get(commandName);
    } else if (this.aliases.has(commandName)) {
      command = this.commands.get(this.aliases.get(commandName));
    }
    if (!command) {
      return `The command \`${commandName}\` doesn't seem to exist, nor is it an alias. Try again!`;
    }
    if (command.shutdown) {
      await command.shutdown(this);
    }
    delete require.cache[require.resolve(`.${commandPath}${path.sep}${commandName}.js`)];
    return false;
  }

  async getPrefix (message, data) {
    if (message.channel.type !== 'DM') {
      const prefixes = [
        `<@!${message.client.user.id}> `,
        `<@${message.client.user.id}> `,
        message.client.user.username.toLowerCase(),
        data.config.Prefix
      ];
      let prefix = null;
      prefixes.forEach((p) => {
        if (message.content.startsWith(p) || message.content.toLowerCase().startsWith(p)) {
          prefix = p;
        }
      });
      return prefix;
    } else {
      return true;
    }
  }
}

module.exports = nemiBot;
